"""Manager corrections of attendance records."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance

RIGA_TZ = ZoneInfo("Europe/Riga")
MAX_SHIFT = timedelta(hours=24)


def riga_to_naive_utc(value: datetime) -> datetime:
    """Form times are Riga local time; the database stores naive UTC."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=RIGA_TZ)
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def riga_date(naive_utc: datetime):
    return naive_utc.replace(tzinfo=timezone.utc).astimezone(RIGA_TZ).date()


def apply_times(
    db: Session,
    attendance: Attendance,
    check_in: datetime,
    check_out: datetime | None,
    note: str,
    manager_id: int,
    is_new: bool,
):
    """Validate and store new times on `attendance` (already attached)."""
    note = (note or "").strip()
    if len(note) < 3:
        raise HTTPException(status_code=400, detail="Please write a short reason for the change.")

    new_in = riga_to_naive_utc(check_in).replace(second=0, microsecond=0)
    new_out = (
        riga_to_naive_utc(check_out).replace(second=0, microsecond=0)
        if check_out is not None
        else None
    )

    now = datetime.utcnow()
    if new_in > now + timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="Check-in cannot be in the future.")

    if new_out is not None:
        if new_out <= new_in:
            raise HTTPException(status_code=400, detail="Check-out must be later than check-in.")
        if new_out - new_in > MAX_SHIFT:
            raise HTTPException(status_code=400, detail="A shift cannot be longer than 24 hours.")
        if new_out > now + timedelta(minutes=5):
            raise HTTPException(status_code=400, detail="Check-out cannot be in the future.")

    # No overlap with the employee's other records (an open shift runs until now)
    others = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == attendance.employee_id,
            Attendance.id != (attendance.id or -1),
        )
        .all()
    )
    this_end = new_out or now
    for other in others:
        other_end = other.check_out or now
        if other.check_in < this_end and new_in < other_end:
            raise HTTPException(
                status_code=400,
                detail="These times overlap another record of this employee.",
            )

    if new_out is None and any(o.check_out is None for o in others):
        raise HTTPException(status_code=400, detail="This employee already has an open shift.")

    if is_new or attendance.check_in != new_in:
        attendance.source = "manual"
    if new_out is not None and (is_new or attendance.check_out != new_out):
        attendance.check_out_source = "manual"

    attendance.check_in = new_in
    attendance.check_out = new_out
    attendance.work_date = riga_date(new_in)
    attendance.status = "Present"
    attendance.edit_note = note
    attendance.edited_by = manager_id

    if new_out is None:
        attendance.worked_minutes = 0
        attendance.worked_hours = 0
    else:
        minutes = max(0, round((new_out - new_in).total_seconds() / 60))
        attendance.worked_minutes = minutes
        attendance.worked_hours = round(minutes / 60, 2)
