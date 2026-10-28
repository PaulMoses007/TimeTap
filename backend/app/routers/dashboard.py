from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant
from app.schemas.dashboard import DashboardResponse
from app.security.roles import require_manager


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=DashboardResponse)
def dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    # ==========================================================
    # GET CURRENT MANAGER
    # ==========================================================

    manager = (
        db.query(Employee)
        .filter(
            Employee.id == current_user["id"],
            Employee.role == "Manager"
        )
        .first()
    )

    if manager is None:
        return {
            "total_restaurants": 0,
            "total_employees": 0,
            "pending_approvals": 0,
            "checked_in_today": 0,
            "checked_out_today": 0,
            "working_now": 0,
            "absent_today": 0,
        }

    # ==========================================================
    # MANAGER HAS NO RESTAURANT YET
    # ==========================================================

    if manager.restaurant_id is None:
        return {
            "total_restaurants": 0,
            "total_employees": 0,
            "pending_approvals": 0,
            "checked_in_today": 0,
            "checked_out_today": 0,
            "working_now": 0,
            "absent_today": 0,
        }

    restaurant_id = manager.restaurant_id

    # ==========================================================
    # RESTAURANT COUNT
    # ==========================================================

    total_restaurants = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id
        )
        .count()
    )

    # ==========================================================
    # EMPLOYEES IN MANAGER'S RESTAURANT
    # ==========================================================

    total_employees = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id == restaurant_id,
            Employee.role != "Manager",
            Employee.is_active == True
        )
        .count()
    )

    # ==========================================================
    # PENDING APPROVALS
    # ==========================================================

    pending_approvals = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id == restaurant_id,
            Employee.role != "Manager",
            Employee.approval_status == "Pending",
            Employee.is_active == True
        )
        .count()
    )

    # ==========================================================
    # TODAY'S ATTENDANCE
    # ==========================================================

    today = date.today()

    today_attendance = (
        db.query(Attendance)
        .join(
            Employee,
            Attendance.employee_id == Employee.id
        )
        .filter(
            Employee.restaurant_id == restaurant_id,
            Employee.role != "Manager",
            Attendance.work_date == today
        )
        .all()
    )

    # ==========================================================
    # CHECKED IN
    # ==========================================================

    checked_in_today = len(today_attendance)

    # ==========================================================
    # CHECKED OUT
    # ==========================================================

    checked_out_today = sum(
        1
        for record in today_attendance
        if record.check_out is not None
    )

    # ==========================================================
    # CURRENTLY WORKING
    # ==========================================================

    working_now = sum(
        1
        for record in today_attendance
        if record.check_in is not None
        and record.check_out is None
    )

    # ==========================================================
    # ABSENT
    # ==========================================================

    absent_today = (
        total_employees - checked_in_today
    )

    if absent_today < 0:
        absent_today = 0

    # ==========================================================
    # RESPONSE
    # ==========================================================

    return {
        "total_restaurants": total_restaurants,
        "total_employees": total_employees,
        "pending_approvals": pending_approvals,
        "checked_in_today": checked_in_today,
        "checked_out_today": checked_out_today,
        "working_now": working_now,
        "absent_today": absent_today,
    }
