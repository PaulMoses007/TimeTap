from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant


def check_in(
    restaurant_id: int,
    current_user: dict,
    db: Session
):
    # Find employee from JWT
    employee = (
        db.query(Employee)
        .filter(Employee.email == current_user["sub"])
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    # Check restaurant exists
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    # Already checked in today?
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.work_date == date.today()
        )
        .first()
    )

    if attendance:
        raise HTTPException(
            status_code=400,
            detail="Already checked in today"
        )

    attendance = Attendance(
        employee_id=employee.id,
        work_date=date.today(),
        check_in=datetime.utcnow(),
        status="Present"
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


def check_out(
    restaurant_id: int,
    current_user: dict,
    db: Session
):
    # Find employee from JWT
    employee = (
        db.query(Employee)
        .filter(Employee.email == current_user["sub"])
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    # Check restaurant exists
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    # Find today's attendance
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.work_date == date.today()
        )
        .first()
    )

    if attendance is None:
        raise HTTPException(
            status_code=404,
            detail="You have not checked in today"
        )

    if attendance.check_out is not None:
        raise HTTPException(
            status_code=400,
            detail="Already checked out"
        )

    attendance.check_out = datetime.utcnow()

    time_difference = attendance.check_out - attendance.check_in

    worked_minutes = int(
        time_difference.total_seconds() // 60
    )

    worked_hours = round(
        worked_minutes / 60,
        2
    )

    attendance.worked_minutes = worked_minutes
    attendance.worked_hours = worked_hours

    db.commit()
    db.refresh(attendance)

    return attendance