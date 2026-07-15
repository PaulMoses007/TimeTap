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
    total_restaurants = db.query(Restaurant).count()

    total_employees = (
        db.query(Employee)
        .filter(Employee.role != "Manager")
        .count()
    )

    pending_approvals = (
        db.query(Employee)
        .filter(Employee.approval_status == "Pending")
        .count()
    )

    checked_in_today = (
        db.query(Attendance)
        .filter(Attendance.work_date == date.today())
        .count()
    )

    checked_out_today = (
        db.query(Attendance)
        .filter(
            Attendance.work_date == date.today(),
            Attendance.check_out.isnot(None)
        )
        .count()
    )

    working_now = checked_in_today - checked_out_today

    absent_today = total_employees - checked_in_today

    if absent_today < 0:
        absent_today = 0

    return {
        "total_restaurants": total_restaurants,
        "total_employees": total_employees,
        "pending_approvals": pending_approvals,
        "checked_in_today": checked_in_today,
        "checked_out_today": checked_out_today,
        "working_now": working_now,
        "absent_today": absent_today,
    }