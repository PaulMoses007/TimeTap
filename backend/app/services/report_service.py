from datetime import date
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee


def get_attendance_report(
    db: Session,
    employee_id: int | None = None,
    work_date: date | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    query = (
        db.query(Attendance, Employee)
        .join(
            Employee,
            Attendance.employee_id == Employee.id
        )
    )

    # Filter by employee
    if employee_id is not None:
        query = query.filter(
            Attendance.employee_id == employee_id
        )

    # Filter by one date
    if work_date is not None:
        query = query.filter(
            Attendance.work_date == work_date
        )

    # Filter by date range
    if start_date is not None:
        query = query.filter(
            Attendance.work_date >= start_date
        )

    if end_date is not None:
        query = query.filter(
            Attendance.work_date <= end_date
        )

    records = (
        query.order_by(
            Attendance.work_date.desc(),
            Attendance.check_in.desc()
        )
        .all()
    )

    report = []

    for attendance, employee in records:
        report.append({
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "employee_code": employee.employee_id,
            "work_date": attendance.work_date,
            "check_in": attendance.check_in,
            "check_out": attendance.check_out,
            "worked_minutes": attendance.worked_minutes,
            "worked_hours": attendance.worked_hours,
            "status": attendance.status,
        })

    return report