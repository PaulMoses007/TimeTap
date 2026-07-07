from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceCheckOut,
    AttendanceResponse,
)
from app.services.attendance_service import (
    AttendanceService,
    get_all_attendance,
)

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


@router.post("/checkin", response_model=AttendanceResponse)
def check_in(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db)
):
    return AttendanceService.check_in(
        attendance.employee_id,
        db
    )


@router.post("/checkout", response_model=AttendanceResponse)
def check_out(
    attendance: AttendanceCheckOut,
    db: Session = Depends(get_db)
):
    return AttendanceService.check_out(
        attendance.employee_id,
        db
    )


@router.get("/", response_model=list[AttendanceResponse])
def attendance_history(
    db: Session = Depends(get_db)
):
    return get_all_attendance(db)