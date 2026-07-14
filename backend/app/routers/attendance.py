from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceResponse,
)
from app.security.dependencies import get_current_user
from app.services.attendance_service import get_all_attendance
from app.services.qr_attendance_service import check_in

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/check-in", response_model=AttendanceResponse)
def employee_check_in(
    attendance: AttendanceCheckInRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return check_in(
        attendance.restaurant_id,
        current_user,
        db
    )


@router.get("/", response_model=list[AttendanceResponse])
def attendance_history(
    db: Session = Depends(get_db)
):
    return get_all_attendance(db)