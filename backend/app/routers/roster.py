import re
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.employee import Employee
from app.models.restaurant import Restaurant
from app.models.roster import Shift
from app.schemas.roster import CopyWeek, ShiftSet
from app.security.dependencies import get_current_user
from app.security.roles import require_manager
from app.services.leave_service import approved_leave_by_day

router = APIRouter(prefix="/roster", tags=["Roster"])

RIGA_TZ = ZoneInfo("Europe/Riga")
TIME_RE = re.compile(r"^([01]?\d|2[0-3]):([0-5]\d)$")


def monday_of(day: date) -> date:
    return day - timedelta(days=day.weekday())


def clean_time(value: str, label: str) -> str:
    match = TIME_RE.match((value or "").strip())
    if not match:
        raise HTTPException(status_code=400, detail=f"{label} must be a time like 09:00.")
    return f"{int(match.group(1)):02d}:{match.group(2)}"


def manager_restaurant(db: Session, manager_id: int) -> Restaurant:
    restaurant = db.query(Restaurant).filter(Restaurant.manager_id == manager_id).first()
    if restaurant is None:
        raise HTTPException(status_code=400, detail="Create a restaurant first.")
    return restaurant


def team(db: Session, restaurant_id: int) -> list[Employee]:
    return (
        db.query(Employee)
        .filter(
            Employee.restaurant_id == restaurant_id,
            Employee.role != "Manager",
            Employee.deleted_at.is_(None),
            Employee.is_active.is_(True),
            Employee.approval_status == "Approved",
        )
        .order_by(Employee.first_name, Employee.last_name)
        .all()
    )


def shift_dict(shift: Shift) -> dict:
    return {
        "id": shift.id,
        "employee_id": shift.employee_id,
        "work_date": shift.work_date,
        "start_time": shift.start_time,
        "end_time": shift.end_time,
        "note": shift.note,
    }


# ------------------------------------------------------------- manager
@router.get("/")
def get_week(
    week_start: date | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    """The planned week (Monday-Sunday) of the manager's restaurant."""
    restaurant = (
        db.query(Restaurant).filter(Restaurant.manager_id == current_user["id"]).first()
    )

    start = monday_of(week_start or datetime.now(RIGA_TZ).date())
    end = start + timedelta(days=6)

    if restaurant is None:
        return {"week_start": start, "week_end": end, "employees": [], "shifts": [], "leave": []}

    employees = team(db, restaurant.id)
    ids = [e.id for e in employees]

    shifts = (
        db.query(Shift)
        .filter(
            Shift.restaurant_id == restaurant.id,
            Shift.work_date >= start,
            Shift.work_date <= end,
            Shift.employee_id.in_(ids or [-1]),
        )
        .order_by(Shift.work_date, Shift.start_time)
        .all()
    )

    leave = approved_leave_by_day(db, ids, start, end)

    return {
        "week_start": start,
        "week_end": end,
        "employees": [
            {
                "id": e.id,
                "name": f"{e.first_name} {e.last_name}",
                "role": e.role,
                "schedule_type": e.schedule_type,
                "shift_start": e.shift_start,
                "shift_end": e.shift_end,
            }
            for e in employees
        ],
        "shifts": [shift_dict(s) for s in shifts],
        "leave": [
            {"employee_id": emp_id, "work_date": day, "leave_type": kind}
            for emp_id, days in leave.items()
            for day, kind in sorted(days.items())
        ],
    }


@router.put("/shift")
def set_shift(
    data: ShiftSet,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    """Plan (or change) one employee's shift on one day."""
    restaurant = manager_restaurant(db, current_user["id"])

    employee = next((e for e in team(db, restaurant.id) if e.id == data.employee_id), None)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found in your restaurant.")

    start = clean_time(data.start_time, "Start time")
    end = clean_time(data.end_time, "End time")

    if start == end:
        raise HTTPException(status_code=400, detail="Start and end time cannot be the same.")

    if data.employee_id in approved_leave_by_day(
        db, [employee.id], data.work_date, data.work_date
    ):
        raise HTTPException(
            status_code=400,
            detail=f"{employee.first_name} is on approved leave on this day.",
        )

    shift = (
        db.query(Shift)
        .filter(Shift.employee_id == employee.id, Shift.work_date == data.work_date)
        .first()
    )

    if shift is None:
        shift = Shift(
            employee_id=employee.id,
            restaurant_id=restaurant.id,
            work_date=data.work_date,
            created_by=current_user["id"],
        )
        db.add(shift)

    shift.start_time = start
    shift.end_time = end
    shift.note = (data.note or "").strip() or None

    db.commit()
    db.refresh(shift)

    return shift_dict(shift)


@router.delete("/shift/{shift_id}")
def delete_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    restaurant = manager_restaurant(db, current_user["id"])

    shift = (
        db.query(Shift)
        .filter(Shift.id == shift_id, Shift.restaurant_id == restaurant.id)
        .first()
    )
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")

    db.delete(shift)
    db.commit()

    return {"message": "Shift removed."}


@router.post("/copy-week")
def copy_week(
    data: CopyWeek,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager),
):
    """Copy every shift of one week to another. Days already planned are kept."""
    restaurant = manager_restaurant(db, current_user["id"])

    source = monday_of(data.from_week_start)
    target = monday_of(data.to_week_start)

    if source == target:
        raise HTTPException(status_code=400, detail="Choose two different weeks.")

    people = {e.id for e in team(db, restaurant.id)}
    leave = approved_leave_by_day(db, list(people), target, target + timedelta(days=6))

    shifts = (
        db.query(Shift)
        .filter(
            Shift.restaurant_id == restaurant.id,
            Shift.work_date >= source,
            Shift.work_date <= source + timedelta(days=6),
        )
        .all()
    )

    copied = skipped = 0

    for shift in shifts:
        new_day = target + (shift.work_date - source)

        exists = (
            db.query(Shift)
            .filter(Shift.employee_id == shift.employee_id, Shift.work_date == new_day)
            .first()
        )

        if (
            shift.employee_id not in people
            or exists is not None
            or new_day in leave.get(shift.employee_id, {})
        ):
            skipped += 1
            continue

        db.add(
            Shift(
                employee_id=shift.employee_id,
                restaurant_id=restaurant.id,
                work_date=new_day,
                start_time=shift.start_time,
                end_time=shift.end_time,
                note=shift.note,
                created_by=current_user["id"],
            )
        )
        copied += 1

    db.commit()

    return {"copied": copied, "skipped": skipped}


# ------------------------------------------------------------ employee
@router.get("/my")
def my_shifts(
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """The logged-in employee's planned shifts from today on."""
    days = max(1, min(days, 60))
    today = datetime.now(RIGA_TZ).date()

    shifts = (
        db.query(Shift)
        .filter(
            Shift.employee_id == current_user["id"],
            Shift.work_date >= today,
            Shift.work_date <= today + timedelta(days=days),
        )
        .order_by(Shift.work_date)
        .all()
    )

    return [shift_dict(s) for s in shifts]
