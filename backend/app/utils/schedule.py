import re

from fastapi import HTTPException

_TIME = re.compile(r"^(\d{1,2}):(\d{2})(?::\d{2})?$")


def _to_minutes(value: str, label: str) -> int:
    match = _TIME.match((value or "").strip())

    if match is None:
        raise HTTPException(
            status_code=400,
            detail=f"{label} must be a time like 09:00."
        )

    hours, minutes = int(match.group(1)), int(match.group(2))

    if hours > 23 or minutes > 59:
        raise HTTPException(
            status_code=400,
            detail=f"{label} must be a time like 09:00."
        )

    return hours * 60 + minutes


def _format(total_minutes: int) -> str:
    return f"{total_minutes // 60:02d}:{total_minutes % 60:02d}"


def validate_schedule(schedule_type, shift_start, shift_end):
    """
    Check a work schedule and return (schedule_type, shift_start, shift_end).

    Flexible schedules carry no times. Fixed schedules need a start and an end,
    and the end must be later than the start.
    """
    if schedule_type not in ("Flexible", "Fixed"):
        raise HTTPException(
            status_code=400,
            detail="Schedule type must be Flexible or Fixed."
        )

    if schedule_type == "Flexible":
        return "Flexible", None, None

    if not shift_start or not shift_end:
        raise HTTPException(
            status_code=400,
            detail="Fixed schedule requires shift start and shift end times."
        )

    start = _to_minutes(shift_start, "Shift start")
    end = _to_minutes(shift_end, "Shift end")

    if start >= end:
        raise HTTPException(
            status_code=400,
            detail="Shift end time must be later than shift start time."
        )

    return "Fixed", _format(start), _format(end)
