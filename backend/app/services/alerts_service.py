"""What the manager should look at right now (dashboard alerts)."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.attendance import Attendance, ManualAttendanceRequest
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.restaurant import Restaurant
from app.models.roster import Shift
from app.services.leave_service import approved_leave_by_day

RIGA_TZ = ZoneInfo("Europe/Riga")

# How long after the planned start before someone counts as late
LATE_AFTER_MINUTES = 15

# An open shift longer than this is probably a forgotten check-out
OPEN_SHIFT_HOURS = 14


def _clock(value: str) -> tuple[int, int]:
    hours, minutes = value.split(":")
    return int(hours), int(minutes)


def build_alerts(db: Session, manager_id: int) -> dict:
    now = datetime.now(RIGA_TZ)
    today = now.date()

    restaurant = db.query(Restaurant).filter(Restaurant.manager_id == manager_id).first()

    if restaurant is None:
        return {"today": today, "items": []}

    employees = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id == restaurant.id,
            Employee.role != "Manager",
            Employee.deleted_at.is_(None),
            Employee.is_active.is_(True),
            Employee.approval_status == "Approved",
        )
        .all()
    )
    ids = [e.id for e in employees]
    by_id = {e.id: e for e in employees}

    items: list[dict] = []

    # ------------------------------------------------ open (forgotten) shifts
    now_utc = datetime.utcnow()
    open_rows = (
        db.query(Attendance)
        .filter(Attendance.employee_id.in_(ids or [-1]), Attendance.check_out.is_(None))
        .all()
    )
    has_open = set()

    for row in open_rows:
        has_open.add(row.employee_id)
        hours_open = (now_utc - row.check_in).total_seconds() / 3600

        if row.work_date < today or hours_open > OPEN_SHIFT_HOURS:
            started = (
                row.check_in.replace(tzinfo=timezone.utc)
                .astimezone(RIGA_TZ)
                .strftime("%d.%m %H:%M")
            )
            person = by_id[row.employee_id]
            items.append(
                {
                    "type": "open_shift",
                    "severity": "warning",
                    "title": f"{person.first_name} {person.last_name} did not check out",
                    "detail": f"Checked in {started} and the shift is still open. Fix the record on their page.",
                    "employee_id": person.id,
                    "link": f"/employees/{person.id}",
                }
            )

    # ----------------------------------------------------- late / no-show
    monday = today - timedelta(days=today.weekday())
    week_shifts = (
        db.query(Shift)
        .filter(
            Shift.restaurant_id == restaurant.id,
            Shift.work_date >= monday,
            Shift.work_date <= monday + timedelta(days=6),
        )
        .all()
    )
    roster_in_use = bool(week_shifts)
    today_shift = {s.employee_id: s for s in week_shifts if s.work_date == today}

    checked_in_today = {
        row.employee_id
        for row in db.query(Attendance)
        .filter(Attendance.employee_id.in_(ids or [-1]), Attendance.work_date == today)
        .all()
    }
    on_leave = approved_leave_by_day(db, ids, today, today)

    for person in employees:
        if person.id in checked_in_today or person.id in has_open or person.id in on_leave:
            continue

        start_text = None
        if person.id in today_shift:
            start_text = today_shift[person.id].start_time
        elif not roster_in_use and person.schedule_type == "Fixed" and person.shift_start:
            # No roster this week: a fixed schedule means every day
            start_text = person.shift_start

        if not start_text:
            continue

        hour, minute = _clock(start_text)
        expected = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        late_by = int((now - expected).total_seconds() // 60)

        if late_by >= LATE_AFTER_MINUTES:
            items.append(
                {
                    "type": "late",
                    "severity": "error",
                    "title": f"{person.first_name} {person.last_name} has not checked in",
                    "detail": f"Expected at {start_text}, {late_by} min ago.",
                    "employee_id": person.id,
                    "link": f"/employees/{person.id}",
                }
            )

    # ------------------------------------------------------- waiting for you
    pending_people = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id == restaurant.id,
            Employee.role != "Manager",
            Employee.deleted_at.is_(None),
            Employee.is_active.is_(True),
            Employee.approval_status == "Pending",
        )
        .count()
    )
    pending_manual = (
        db.query(ManualAttendanceRequest)
        .filter(
            ManualAttendanceRequest.restaurant_id == restaurant.id,
            ManualAttendanceRequest.status == "Pending",
        )
        .count()
    )
    pending_leave = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.restaurant_id == restaurant.id, LeaveRequest.status == "Pending")
        .count()
    )

    waiting = [
        (pending_people, "new registration", "new registrations", "/employees"),
        (pending_manual, "manual attendance request", "manual attendance requests", "/manager-attendance"),
        (pending_leave, "leave request", "leave requests", "/manager-attendance"),
    ]

    for count, one, many, link in waiting:
        if count:
            items.append(
                {
                    "type": "waiting",
                    "severity": "info",
                    "title": f"{count} {one if count == 1 else many} waiting for you",
                    "detail": "Open to approve or reject.",
                    "count": count,
                    "link": link,
                }
            )

    order = {"error": 0, "warning": 1, "info": 2}
    items.sort(key=lambda item: order[item["severity"]])

    return {"today": today, "items": items}
