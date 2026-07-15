from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.report import AttendanceReportResponse
from app.security.roles import require_manager
from app.services.report_service import get_attendance_report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "/attendance",
    response_model=list[AttendanceReportResponse]
)
def attendance_report(
    employee_id: int | None = None,
    work_date: date | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    return get_attendance_report(
        db=db,
        employee_id=employee_id,
        work_date=work_date,
        start_date=start_date,
        end_date=end_date,
    )