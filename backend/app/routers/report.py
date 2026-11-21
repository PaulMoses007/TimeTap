from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.report import AttendanceReportResponse
from app.security.roles import require_manager
from app.services.export_service import build_hours_workbook, build_separate_zip
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
        manager_id=current_user["id"],
    )


XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/export")
def export_working_hours(
    period: str = "week",
    on: date | None = None,
    employee_id: int | None = None,
    separate: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Excel file with every employee's working hours.

    period=week  -> the Monday-Sunday week that contains `on`
    period=month -> the calendar month that contains `on`
    `on` defaults to today (Riga). Only the manager's own restaurant.
    employee_id -> only that employee.
    separate=true -> a zip with one Excel file per employee.
    """
    if period not in ("week", "month"):
        raise HTTPException(status_code=400, detail="Period must be week or month.")

    anchor = on or datetime.now(ZoneInfo("Europe/Riga")).date()

    media_type = XLSX_TYPE

    if separate:
        content, filename = build_separate_zip(
            db=db, manager_id=current_user["id"], period=period, anchor=anchor
        )
        media_type = "application/zip"
    else:
        try:
            content, filename = build_hours_workbook(
                db=db,
                manager_id=current_user["id"],
                period=period,
                anchor=anchor,
                employee_id=employee_id,
            )
        except LookupError as error:
            raise HTTPException(status_code=404, detail=str(error))

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
