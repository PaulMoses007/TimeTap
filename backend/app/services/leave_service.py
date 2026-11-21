from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.leave import LeaveRequest


def approved_leave_by_day(
    db: Session,
    employee_ids: list[int],
    start: date,
    end: date,
) -> dict[int, dict[date, str]]:
    """{employee_id: {day: leave_type}} for approved leave inside [start, end]."""
    result: dict[int, dict[date, str]] = {}

    if not employee_ids:
        return result

    rows = (
        db.query(LeaveRequest)
        .filter(
            LeaveRequest.employee_id.in_(employee_ids),
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= end,
            LeaveRequest.end_date >= start,
        )
        .all()
    )

    for row in rows:
        day = max(row.start_date, start)
        last = min(row.end_date, end)
        while day <= last:
            result.setdefault(row.employee_id, {})[day] = row.leave_type
            day += timedelta(days=1)

    return result
