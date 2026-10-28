from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant


RIGA_TIMEZONE = ZoneInfo("Europe/Riga")


def utc_now():
    """
    Return the current UTC time.

    The value is intentionally timezone-naive because
    SQLite stores attendance timestamps as naive
    datetime values.
    """
    return datetime.utcnow()


def get_riga_date(utc_datetime):
    """
    Convert a naive UTC datetime to the local Riga date.

    This allows an overnight shift to keep the work_date
    of the day on which the employee checked in.
    """
    if utc_datetime.tzinfo is None:
        utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)

    return utc_datetime.astimezone(RIGA_TIMEZONE).date()


def get_employee(current_user: dict, db: Session):
    """
    Find the employee associated with the JWT.
    """
    employee = (
        db.query(Employee)
        .filter(Employee.email == current_user["sub"])
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return employee


def get_restaurant(restaurant_id: int, db: Session):
    """
    Find the restaurant.
    """
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found",
        )

    return restaurant


def check_restaurant_assignment(employee, restaurant_id: int):
    """
    Make sure the employee is assigned to the restaurant being scanned.
    """
    if employee.restaurant_id != restaurant_id:
        raise HTTPException(
            status_code=403,
            detail="Employee is not assigned to this restaurant",
        )


def check_in(restaurant_id: int, current_user: dict, db: Session):
    # Find employee
    employee = get_employee(current_user, db)

    # Check restaurant exists
    get_restaurant(restaurant_id, db)

    # Check employee is assigned to this restaurant
    check_restaurant_assignment(employee, restaurant_id)

    # Find any open shift, including one started on a previous date
    open_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.check_out.is_(None),
        )
        .order_by(Attendance.check_in.desc())
        .first()
    )

    if open_attendance:
        raise HTTPException(
            status_code=400,
            detail="You are already checked in",
        )

    # Create new shift
    check_in_time = utc_now()

    attendance = Attendance(
        employee_id=employee.id,
        # Keep the local Riga date of the check-in for overnight shifts.
        work_date=get_riga_date(check_in_time),
        check_in=check_in_time,
        check_out=None,
        worked_minutes=0,
        worked_hours=0,
        status="Present",
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


def check_out(restaurant_id: int, current_user: dict, db: Session):
    # Find employee
    employee = get_employee(current_user, db)

    # Check restaurant exists
    get_restaurant(restaurant_id, db)

    # Check employee is assigned to this restaurant
    check_restaurant_assignment(employee, restaurant_id)

    # Find the current open shift, including overnight shifts
    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.check_out.is_(None),
        )
        .order_by(Attendance.check_in.desc())
        .first()
    )

    if attendance is None:
        raise HTTPException(
            status_code=404,
            detail="You do not have an active shift",
        )

    # Prevent invalid attendance data
    if attendance.check_in is None:
        raise HTTPException(
            status_code=500,
            detail="Attendance record has no check-in time",
        )

    # Save checkout time
    check_out_time = utc_now()
    attendance.check_out = check_out_time

    # Calculate duration. Round to the nearest whole minute instead
    # of always rounding down, so displayed duration is more intuitive.
    time_difference = check_out_time - attendance.check_in

    worked_minutes = round(time_difference.total_seconds() / 60)

    # Prevent negative worked time
    if worked_minutes < 0:
        worked_minutes = 0

    worked_hours = round(worked_minutes / 60, 2)

    attendance.worked_minutes = worked_minutes
    attendance.worked_hours = worked_hours
    attendance.status = "Present"

    # Save
    db.commit()
    db.refresh(attendance)

    return attendance
