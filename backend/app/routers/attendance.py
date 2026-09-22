from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant

from app.schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceResponse,
)

from app.schemas.today_attendance import (
    TodayAttendanceResponse,
)

from app.schemas.weekly_attendance import (
    WeeklyAttendanceResponse,
)

from app.schemas.monthly_attendance import (
    MonthlyAttendanceResponse,
)

from app.security.dependencies import get_current_user
from app.security.roles import require_manager

from app.services.attendance_service import (
    get_all_attendance,
)

from app.services.qr_attendance_service import (
    check_in,
    check_out,
)


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# TODAY'S ATTENDANCE
# ============================================================

@router.get(
    "/today",
    response_model=list[TodayAttendanceResponse]
)
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Return today's attendance for employees.

    Managers are excluded from attendance records.
    """

    employees = (
        db.query(Employee)
        .filter(Employee.role != "Manager")
        .all()
    )

    results = []

    for employee in employees:

        # -----------------------------------------
        # Find restaurant
        # -----------------------------------------

        restaurant_name = "Not Assigned"

        if employee.restaurant_id:

            restaurant = (
                db.query(Restaurant)
                .filter(
                    Restaurant.id == employee.restaurant_id
                )
                .first()
            )

            if restaurant:
                restaurant_name = restaurant.name

        # -----------------------------------------
        # Find today's attendance
        # -----------------------------------------

        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee.id,
                Attendance.work_date == date.today()
            )
            .first()
        )

        # -----------------------------------------
        # Determine status
        # -----------------------------------------

        if attendance is None:

            status = "Absent"

            check_in_time = None
            check_out_time = None

        elif attendance.check_out is None:

            status = "Working"

            check_in_time = attendance.check_in
            check_out_time = None

        else:

            status = "Checked Out"

            check_in_time = attendance.check_in
            check_out_time = attendance.check_out

        # -----------------------------------------
        # Add result
        # -----------------------------------------

        results.append(
            {
                "employee_id": employee.employee_id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "restaurant": restaurant_name,
                "role": employee.role,
                "status": status,
                "check_in": check_in_time,
                "check_out": check_out_time,
            }
        )

    return results


# ============================================================
# WEEKLY ATTENDANCE
# ============================================================

@router.get(
    "/weekly",
    response_model=list[WeeklyAttendanceResponse]
)
def get_weekly_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Return attendance summary for the last 7 days.

    Managers are excluded.
    """

    today = date.today()

    start_date = today - timedelta(days=6)

    employees = (
        db.query(Employee)
        .filter(Employee.role != "Manager")
        .all()
    )

    results = []

    for employee in employees:

        # -----------------------------------------
        # Find restaurant
        # -----------------------------------------

        restaurant_name = "Not Assigned"

        if employee.restaurant_id:

            restaurant = (
                db.query(Restaurant)
                .filter(
                    Restaurant.id == employee.restaurant_id
                )
                .first()
            )

            if restaurant:
                restaurant_name = restaurant.name

        # -----------------------------------------
        # Get attendance records
        # -----------------------------------------

        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee.id,
                Attendance.work_date >= start_date,
                Attendance.work_date <= today
            )
            .all()
        )

        # -----------------------------------------
        # Count unique days
        # -----------------------------------------

        unique_days = {
            record.work_date
            for record in attendance_records
        }

        days_present = len(unique_days)

        days_absent = max(
            0,
            7 - days_present
        )

        # -----------------------------------------
        # Add result
        # -----------------------------------------

        results.append(
            {
                "employee_id": employee.employee_id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "role": employee.role,
                "restaurant": restaurant_name,
                "days_present": days_present,
                "days_absent": days_absent,
            }
        )

    return results


# ============================================================
# MONTHLY ATTENDANCE
# ============================================================

@router.get(
    "/monthly",
    response_model=list[MonthlyAttendanceResponse]
)
def get_monthly_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Return attendance summary for the current month.

    Managers are excluded.
    """

    today = date.today()

    start_date = today.replace(
        day=1
    )

    employees = (
        db.query(Employee)
        .filter(Employee.role != "Manager")
        .all()
    )

    results = []

    for employee in employees:

        # -----------------------------------------
        # Find restaurant
        # -----------------------------------------

        restaurant_name = "Not Assigned"

        if employee.restaurant_id:

            restaurant = (
                db.query(Restaurant)
                .filter(
                    Restaurant.id == employee.restaurant_id
                )
                .first()
            )

            if restaurant:
                restaurant_name = restaurant.name

        # -----------------------------------------
        # Get attendance records
        # -----------------------------------------

        attendance_records = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee.id,
                Attendance.work_date >= start_date,
                Attendance.work_date <= today
            )
            .all()
        )

        # -----------------------------------------
        # Count unique attendance days
        # -----------------------------------------

        unique_days = {
            record.work_date
            for record in attendance_records
        }

        days_present = len(unique_days)

        days_absent = max(
            0,
            today.day - days_present
        )

        # -----------------------------------------
        # Add result
        # -----------------------------------------

        results.append(
            {
                "employee_id": employee.employee_id,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "role": employee.role,
                "restaurant": restaurant_name,
                "days_present": days_present,
                "days_absent": days_absent,
            }
        )

    return results


# ============================================================
# EMPLOYEE CHECK-IN
# ============================================================

@router.post(
    "/check-in",
    response_model=AttendanceResponse
)
def employee_check_in(
    attendance: AttendanceCheckInRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employee checks in to a restaurant.
    """

    return check_in(
        attendance.restaurant_id,
        current_user,
        db
    )


# ============================================================
# EMPLOYEE CHECK-OUT
# ============================================================

@router.post(
    "/check-out",
    response_model=AttendanceResponse
)
def employee_check_out(
    attendance: AttendanceCheckInRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Employee checks out from a restaurant.
    """

    return check_out(
        attendance.restaurant_id,
        current_user,
        db
    )


# ============================================================
# EMPLOYEE ATTENDANCE HISTORY
# ============================================================

@router.get(
    "/my",
    response_model=list[AttendanceResponse]
)
def my_attendance_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Return attendance history for the currently
    logged-in employee.
    """

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

    return (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id
        )
        .order_by(
            Attendance.work_date.desc()
        )
        .all()
    )


# ============================================================
# MANAGER - ALL ATTENDANCE HISTORY
# ============================================================

@router.get(
    "/",
    response_model=list[AttendanceResponse]
)
def attendance_history(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Return all attendance records.

    Only managers can access this endpoint.
    """

    return get_all_attendance(db)