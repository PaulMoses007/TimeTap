from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.attendance import Attendance, ManualAttendanceRequest
from app.models.employee import Employee
from app.models.restaurant import Restaurant
from app.schemas.manual_attendance import (
    ManualAttendanceCreate,
    ManualAttendanceResponse,
    ManualAttendanceReview,
)
from app.security.dependencies import get_current_user
from app.security.roles import require_manager

router = APIRouter(
    prefix="/attendance/manual-requests",
    tags=["Manual Attendance"],
)

RIGA_TZ = ZoneInfo("Europe/Riga")

# Requests can only be made for recent shifts
MAX_DAYS_BACK = 14


# ------------------------------------------------------------
# helpers
# ------------------------------------------------------------

def to_utc_naive(value: datetime) -> datetime:
    """Convert to naive UTC (how Attendance stores times).
    A value without an offset is treated as Riga local time."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=RIGA_TZ)
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def riga_date(utc_naive: datetime):
    return utc_naive.replace(tzinfo=timezone.utc).astimezone(RIGA_TZ).date()


def minutes_between(start: datetime, end: datetime) -> int:
    return max(0, round((end - start).total_seconds() / 60))


def to_response(req: ManualAttendanceRequest, db: Session) -> ManualAttendanceResponse:
    employee = db.query(Employee).filter(Employee.id == req.employee_id).first()
    restaurant = db.query(Restaurant).filter(Restaurant.id == req.restaurant_id).first()

    return ManualAttendanceResponse(
        id=req.id,
        employee_id=req.employee_id,
        employee_code=employee.employee_id if employee else None,
        employee_name=(
            f"{employee.first_name} {employee.last_name}" if employee else None
        ),
        restaurant_id=req.restaurant_id,
        restaurant_name=restaurant.name if restaurant else None,
        work_date=req.work_date,
        requested_check_in=req.requested_check_in,
        requested_check_out=req.requested_check_out,
        reason=req.reason,
        status=req.status,
        reviewed_by=req.reviewed_by,
        reviewed_at=req.reviewed_at,
        review_note=req.review_note,
        attendance_id=req.attendance_id,
        created_at=req.created_at,
    )


def current_employee(current_user: dict, db: Session) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.id == current_user["id"], Employee.deleted_at.is_(None))
        .first()
    )

    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    return employee


def managed_restaurant_ids(manager_id: int, db: Session) -> list[int]:
    return [
        r.id
        for r in db.query(Restaurant).filter(Restaurant.manager_id == manager_id).all()
    ]


def get_managed_request(request_id: int, manager_id: int, db: Session):
    req = (
        db.query(ManualAttendanceRequest)
        .filter(
            ManualAttendanceRequest.id == request_id,
            ManualAttendanceRequest.restaurant_id.in_(
                managed_restaurant_ids(manager_id, db)
            ),
        )
        .first()
    )

    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"This request was already {req.status.lower()}",
        )

    return req


# ------------------------------------------------------------
# EMPLOYEE: submit a request
# ------------------------------------------------------------

@router.post("/", response_model=ManualAttendanceResponse)
def create_manual_request(
    data: ManualAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") == "Manager":
        raise HTTPException(
            status_code=403,
            detail="Managers do not have attendance records",
        )

    employee = current_employee(current_user, db)

    if not employee.is_active or employee.approval_status != "Approved":
        raise HTTPException(status_code=403, detail="Account is not active")

    if employee.restaurant_id is None:
        raise HTTPException(
            status_code=400,
            detail="You are not assigned to a restaurant",
        )

    check_in = to_utc_naive(data.check_in) if data.check_in else None
    check_out = to_utc_naive(data.check_out) if data.check_out else None

    now = datetime.utcnow()

    for value in (check_in, check_out):
        if value is None:
            continue
        if value > now + timedelta(minutes=5):
            raise HTTPException(
                status_code=400,
                detail="Times cannot be in the future",
            )
        if value < now - timedelta(days=MAX_DAYS_BACK):
            raise HTTPException(
                status_code=400,
                detail=f"Requests can only be made for the last {MAX_DAYS_BACK} days",
            )

    if check_in and check_out and check_out <= check_in:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    # Shift date follows the check-in (same rule as QR attendance);
    # a check-out-only request uses the check-out date.
    work_date = riga_date(check_in or check_out)

    duplicate = (
        db.query(ManualAttendanceRequest)
        .filter(
            ManualAttendanceRequest.employee_id == employee.id,
            ManualAttendanceRequest.work_date == work_date,
            ManualAttendanceRequest.status == "Pending",
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request for this date",
        )

    req = ManualAttendanceRequest(
        employee_id=employee.id,
        restaurant_id=employee.restaurant_id,
        work_date=work_date,
        requested_check_in=check_in,
        requested_check_out=check_out,
        reason=data.reason.strip(),
        status="Pending",
    )

    db.add(req)
    db.commit()
    db.refresh(req)

    return to_response(req, db)


# ------------------------------------------------------------
# EMPLOYEE: my requests
# ------------------------------------------------------------

@router.get("/my", response_model=list[ManualAttendanceResponse])
def my_manual_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    requests = (
        db.query(ManualAttendanceRequest)
        .filter(ManualAttendanceRequest.employee_id == current_user["id"])
        .order_by(ManualAttendanceRequest.created_at.desc())
        .all()
    )

    return [to_response(r, db) for r in requests]


# ------------------------------------------------------------
# MANAGER: list requests for my restaurants
# ------------------------------------------------------------

@router.get("/", response_model=list[ManualAttendanceResponse])
def list_manual_requests(
    status: str | None = Query(default=None, pattern="^(Pending|Approved|Rejected)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    ids = managed_restaurant_ids(current_user["id"], db)

    if not ids:
        return []

    query = db.query(ManualAttendanceRequest).filter(
        ManualAttendanceRequest.restaurant_id.in_(ids)
    )

    if status:
        query = query.filter(ManualAttendanceRequest.status == status)

    requests = query.order_by(ManualAttendanceRequest.created_at.desc()).all()

    return [to_response(r, db) for r in requests]


# ------------------------------------------------------------
# MANAGER: approve
# ------------------------------------------------------------

@router.put("/{request_id}/approve", response_model=ManualAttendanceResponse)
def approve_manual_request(
    request_id: int,
    review: ManualAttendanceReview | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    req = get_managed_request(request_id, current_user["id"], db)

    check_in = req.requested_check_in
    check_out = req.requested_check_out

    open_shift = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == req.employee_id,
            Attendance.check_out.is_(None),
        )
        .order_by(Attendance.check_in.desc())
        .first()
    )

    if check_in and check_out:
        # Full shift: must not overlap an existing record
        records = (
            db.query(Attendance)
            .filter(Attendance.employee_id == req.employee_id)
            .all()
        )
        for record in records:
            record_end = record.check_out or datetime.utcnow()
            if record.check_in < check_out and record_end > check_in:
                raise HTTPException(
                    status_code=400,
                    detail="This overlaps an existing attendance record",
                )

        minutes = minutes_between(check_in, check_out)
        attendance = Attendance(
            employee_id=req.employee_id,
            work_date=req.work_date,
            check_in=check_in,
            check_out=check_out,
            worked_minutes=minutes,
            worked_hours=round(minutes / 60, 2),
            status="Present",
            source="manual",
            check_out_source="manual",
        )
        db.add(attendance)

    elif check_in:
        # Missed check-in only: opens a shift
        if open_shift:
            raise HTTPException(
                status_code=400,
                detail="The employee already has an open shift",
            )

        attendance = Attendance(
            employee_id=req.employee_id,
            work_date=req.work_date,
            check_in=check_in,
            check_out=None,
            worked_minutes=0,
            worked_hours=0,
            status="Present",
            source="manual",
        )
        db.add(attendance)

    else:
        # Missed check-out only: closes the open shift
        if open_shift is None:
            raise HTTPException(
                status_code=400,
                detail="There is no open shift to check out of",
            )

        if check_out <= open_shift.check_in:
            raise HTTPException(
                status_code=400,
                detail="Check-out is before the open shift's check-in",
            )

        minutes = minutes_between(open_shift.check_in, check_out)
        open_shift.check_out = check_out
        open_shift.check_out_source = "manual"
        open_shift.worked_minutes = minutes
        open_shift.worked_hours = round(minutes / 60, 2)
        attendance = open_shift

    db.flush()

    req.status = "Approved"
    req.reviewed_by = current_user["id"]
    req.reviewed_at = datetime.utcnow()
    req.review_note = review.note if review else None
    req.attendance_id = attendance.id

    db.commit()
    db.refresh(req)

    return to_response(req, db)


# ------------------------------------------------------------
# MANAGER: reject
# ------------------------------------------------------------

@router.put("/{request_id}/reject", response_model=ManualAttendanceResponse)
def reject_manual_request(
    request_id: int,
    review: ManualAttendanceReview | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    req = get_managed_request(request_id, current_user["id"], db)

    req.status = "Rejected"
    req.reviewed_by = current_user["id"]
    req.reviewed_at = datetime.utcnow()
    req.review_note = review.note if review else None

    db.commit()
    db.refresh(req)

    return to_response(req, db)
