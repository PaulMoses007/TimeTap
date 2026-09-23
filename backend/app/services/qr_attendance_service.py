from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant


def utc_now():
    """
    Return the current UTC time.

    The value is intentionally timezone-naive because
    SQLite stores the attendance timestamps as naive
    datetime values.
    """
    return datetime.utcnow()


def check_in(
    restaurant_id: int,
    current_user: dict,
    db: Session
):
    # ============================================================
    # FIND EMPLOYEE FROM JWT
    # ============================================================

    employee = (
        db.query(Employee)
        .filter(
            Employee.email == current_user["sub"]
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    # ============================================================
    # CHECK RESTAURANT
    # ============================================================

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id
        )
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    # ============================================================
    # CHECK EMPLOYEE RESTAURANT ASSIGNMENT
    # ============================================================

    if employee.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=403,
            detail="Employee is not assigned to this restaurant"
        )

    # ============================================================
    # CHECK IF ALREADY CHECKED IN TODAY
    # ============================================================

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

    # ============================================================
    # CREATE ATTENDANCE RECORD
    # ============================================================

    attendance = Attendance(
        employee_id=employee.id,
        work_date=date.today(),
        check_in=utc_now(),
        status="Present",
        worked_minutes=0,
        worked_hours=0
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
    # ============================================================
    # FIND EMPLOYEE FROM JWT
    # ============================================================

    employee = (
        db.query(Employee)
        .filter(
            Employee.email == current_user["sub"]
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    # ============================================================
    # CHECK RESTAURANT
    # ============================================================

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id
        )
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    # ============================================================
    # CHECK EMPLOYEE RESTAURANT ASSIGNMENT
    # ============================================================

    if employee.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=403,
            detail="Employee is not assigned to this restaurant"
        )

    # ============================================================
    # FIND TODAY'S ATTENDANCE
    # ============================================================

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

    # ============================================================
    # PREVENT DOUBLE CHECKOUT
    # ============================================================

    if attendance.check_out is not None:
        raise HTTPException(
            status_code=400,
            detail="Already checked out"
        )

    # ============================================================
    # SAVE CHECKOUT TIME
    # ============================================================

    attendance.check_out = utc_now()

    # ============================================================
    # CALCULATE WORKED TIME
    # ============================================================

    if attendance.check_in is None:
        raise HTTPException(
            status_code=500,
            detail="Attendance record has no check-in time"
        )

    time_difference = (
        attendance.check_out -
        attendance.check_in
    )

    worked_minutes = int(
        time_difference.total_seconds() // 60
    )

    # Prevent negative worked time
    if worked_minutes < 0:
        worked_minutes = 0

    worked_hours = round(
        worked_minutes / 60,
        2
    )

    attendance.worked_minutes = worked_minutes
    attendance.worked_hours = worked_hours
    attendance.status = "Present"

    # ============================================================
    # SAVE
    # ============================================================

    db.commit()
    db.refresh(attendance)

    return attendance