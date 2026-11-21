from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.restaurant import Restaurant
from app.schemas.leave import LeaveCreate, LeaveResponse, LeaveReview
from app.security.dependencies import get_current_user
from app.security.roles import require_manager

router = APIRouter(prefix="/leave", tags=["Leave"])

RIGA_TZ = ZoneInfo("Europe/Riga")

MAX_DAYS_PER_REQUEST = 60
MAX_DAYS_BACK = 14          # a sick day can be reported a little late
MAX_DAYS_AHEAD = 365


def riga_today():
    return datetime.now(RIGA_TZ).date()


def to_response(row: LeaveRequest, db: Session) -> LeaveResponse:
    employee = db.query(Employee).filter(Employee.id == row.employee_id).first()

    return LeaveResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=f"{employee.first_name} {employee.last_name}" if employee else None,
        employee_code=employee.employee_id if employee else None,
        leave_type=row.leave_type,
        start_date=row.start_date,
        end_date=row.end_date,
        days=(row.end_date - row.start_date).days + 1,
        reason=row.reason,
        status=row.status,
        review_note=row.review_note,
        reviewed_at=row.reviewed_at,
        created_at=row.created_at,
    )


def managed_restaurant_ids(manager_id: int, db: Session) -> list[int]:
    return [
        r.id
        for r in db.query(Restaurant).filter(Restaurant.manager_id == manager_id).all()
    ]


def overlapping(db: Session, employee_id: int, start, end, ignore_id: int | None = None):
    query = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == employee_id,
        LeaveRequest.status.in_(["Pending", "Approved"]),
        LeaveRequest.start_date <= end,
        LeaveRequest.end_date >= start,
    )
    if ignore_id is not None:
        query = query.filter(LeaveRequest.id != ignore_id)
    return query.first()


# ------------------------------------------------------------ employee
@router.post("/", response_model=LeaveResponse)
def request_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") == "Manager":
        raise HTTPException(status_code=403, detail="Managers do not request leave here")

    employee = (
        db.query(Employee)
        .filter(Employee.id == current_user["id"], Employee.deleted_at.is_(None))
        .first()
    )

    if (
        employee is None
        or not employee.is_active
        or employee.approval_status != "Approved"
        or employee.restaurant_id is None
    ):
        raise HTTPException(status_code=403, detail="Your account cannot request leave")

    today = riga_today()

    if data.start_date < today - timedelta(days=MAX_DAYS_BACK):
        raise HTTPException(
            status_code=400,
            detail=f"Leave can only start up to {MAX_DAYS_BACK} days in the past.",
        )
    if data.end_date > today + timedelta(days=MAX_DAYS_AHEAD):
        raise HTTPException(status_code=400, detail="Leave can be requested up to one year ahead.")
    if (data.end_date - data.start_date).days + 1 > MAX_DAYS_PER_REQUEST:
        raise HTTPException(
            status_code=400,
            detail=f"One request can cover at most {MAX_DAYS_PER_REQUEST} days.",
        )

    if overlapping(db, employee.id, data.start_date, data.end_date):
        raise HTTPException(
            status_code=400,
            detail="You already have a pending or approved leave in these days.",
        )

    row = LeaveRequest(
        employee_id=employee.id,
        restaurant_id=employee.restaurant_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=(data.reason or "").strip() or None,
        status="Pending",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return to_response(row, db)


@router.get("/my", response_model=list[LeaveResponse])
def my_leave(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    rows = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == current_user["id"])
        .order_by(LeaveRequest.start_date.desc())
        .all()
    )
    return [to_response(r, db) for r in rows]


@router.delete("/{leave_id}")
def cancel_my_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """An employee withdraws a request that nobody has answered yet."""
    row = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.id == leave_id, LeaveRequest.employee_id == current_user["id"])
        .first()
    )

    if row is None:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if row.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail="Only a request that is still pending can be withdrawn.",
        )

    db.delete(row)
    db.commit()

    return {"message": "Leave request withdrawn."}


# ------------------------------------------------------------- manager
@router.get("/", response_model=list[LeaveResponse])
def list_leave(
    status: str | None = Query(default=None, pattern="^(Pending|Approved|Rejected)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    ids = managed_restaurant_ids(current_user["id"], db)
    if not ids:
        return []

    query = db.query(LeaveRequest).filter(LeaveRequest.restaurant_id.in_(ids))
    if status:
        query = query.filter(LeaveRequest.status == status)

    rows = query.order_by(LeaveRequest.start_date.desc(), LeaveRequest.id.desc()).all()
    return [to_response(r, db) for r in rows]


def get_managed(db: Session, leave_id: int, manager_id: int) -> LeaveRequest:
    row = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.id == leave_id,
            LeaveRequest.restaurant_id.in_(managed_restaurant_ids(manager_id, db)),
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return row


def review(db: Session, row: LeaveRequest, manager_id: int, status: str, note: str | None):
    row.status = status
    row.reviewed_by = manager_id
    row.reviewed_at = datetime.utcnow()
    row.review_note = (note or "").strip() or None
    db.commit()
    db.refresh(row)
    return to_response(row, db)


@router.put("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: int,
    data: LeaveReview | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    row = get_managed(db, leave_id, current_user["id"])

    if row.status != "Pending":
        raise HTTPException(status_code=400, detail=f"This request was already {row.status.lower()}")

    return review(db, row, current_user["id"], "Approved", data.note if data else None)


@router.put("/{leave_id}/reject", response_model=LeaveResponse)
def reject_leave(
    leave_id: int,
    data: LeaveReview | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    """Rejects a pending request, or revokes one that was approved."""
    row = get_managed(db, leave_id, current_user["id"])

    if row.status == "Rejected":
        raise HTTPException(status_code=400, detail="This request was already rejected")

    return review(db, row, current_user["id"], "Rejected", data.note if data else None)
