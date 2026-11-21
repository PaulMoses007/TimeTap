from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant
from app.schemas.attendance import AttendanceEdit, AttendanceResponse
from app.security.dependencies import get_current_user
from app.security.roles import require_manager
from app.services.attendance_edit_service import apply_times
from app.services.export_service import build_hours_workbook, period_range
from app.services.qr_attendance_service import get_employee

router = APIRouter(prefix="/attendance", tags=["Attendance corrections"])

RIGA_TZ = ZoneInfo("Europe/Riga")
XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _own_employee(db: Session, manager_id: int, employee_id: int) -> Employee:
    employee = (
        db.query(Employee)
        .join(Restaurant, Employee.restaurant_id == Restaurant.id)
        .filter(
            Employee.id == employee_id,
            Employee.role != "Manager",
            Employee.deleted_at.is_(None),
            Restaurant.manager_id == manager_id,
        )
        .first()
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found in your restaurant.")
    return employee


# ---------------------------------------------------------------- manager
@router.put("/{attendance_id}", response_model=AttendanceResponse)
def edit_attendance(
    attendance_id: int,
    data: AttendanceEdit,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    """Manager corrects the times of an existing record (with a reason)."""
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Attendance record not found.")

    _own_employee(db, current_user["id"], record.employee_id)

    apply_times(db, record, data.check_in, data.check_out, data.note, current_user["id"], is_new=False)
    db.commit()
    db.refresh(record)
    return record


@router.post("/for-employee/{employee_id}", response_model=AttendanceResponse)
def add_attendance(
    employee_id: int,
    data: AttendanceEdit,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager),
):
    """Manager adds a missing record for an employee (with a reason)."""
    employee = _own_employee(db, current_user["id"], employee_id)

    record = Attendance(employee_id=employee.id)
    apply_times(db, record, data.check_in, data.check_out, data.note, current_user["id"], is_new=True)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# --------------------------------------------------------------- employee
def _summary(db: Session, employee: Employee, period: str, anchor: date):
    start, end = period_range(period, anchor)
    rows = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.work_date >= start,
            Attendance.work_date <= end,
        )
        .all()
    )
    minutes = sum(r.worked_minutes or 0 for r in rows)
    days = {r.work_date for r in rows if r.check_out is not None}
    return {
        "start": start,
        "end": end,
        "total_minutes": minutes,
        "total_hours": round(minutes / 60, 2),
        "days_worked": len(days),
        "open_shift": any(r.check_out is None for r in rows),
    }


@router.get("/my-summary")
def my_summary(
    on: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The logged-in employee's hours this week and this month."""
    employee = get_employee(current_user, db)
    anchor = on or datetime.now(RIGA_TZ).date()
    return {
        "week": _summary(db, employee, "week", anchor),
        "month": _summary(db, employee, "month", anchor),
    }


@router.get("/my-export")
def my_export(
    period: str = "month",
    on: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The logged-in employee's own hours as an Excel file."""
    if period not in ("week", "month"):
        raise HTTPException(status_code=400, detail="Period must be week or month.")

    employee = get_employee(current_user, db)
    anchor = on or datetime.now(RIGA_TZ).date()

    content, filename = build_hours_workbook(
        db=db,
        manager_id=0,
        period=period,
        anchor=anchor,
        self_employee=employee,
    )
    return Response(
        content=content,
        media_type=XLSX_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
