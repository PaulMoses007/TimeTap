"""Excel export of employee working hours (weekly or monthly)."""

import calendar
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from zoneinfo import ZoneInfo

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant

RIGA_TZ = ZoneInfo("Europe/Riga")

HEADER_FONT = Font(bold=True, color="FFFFFF")
HEADER_FILL = PatternFill("solid", fgColor="2463EB")
TOTAL_FONT = Font(bold=True)


def period_range(period: str, anchor: date) -> tuple[date, date]:
    """Week = Monday..Sunday containing `anchor`; month = calendar month."""
    if period == "week":
        start = anchor - timedelta(days=anchor.weekday())
        return start, start + timedelta(days=6)

    last_day = calendar.monthrange(anchor.year, anchor.month)[1]
    return anchor.replace(day=1), anchor.replace(day=last_day)


def _local(value: datetime | None):
    """Stored times are naive UTC; show them in Riga time."""
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc).astimezone(RIGA_TZ).replace(tzinfo=None)


def _style_header(ws, row: int, columns: int):
    for col in range(1, columns + 1):
        cell = ws.cell(row=row, column=col)
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def _widths(ws, widths: list[int]):
    for index, width in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(index)].width = width


def build_hours_workbook(
    db: Session,
    manager_id: int,
    period: str,
    anchor: date,
) -> tuple[bytes, str]:
    start, end = period_range(period, anchor)
    days = [start + timedelta(days=i) for i in range((end - start).days + 1)]

    restaurant = (
        db.query(Restaurant).filter(Restaurant.manager_id == manager_id).first()
    )

    employees = []
    records = []

    if restaurant is not None:
        employees = (
            db.query(Employee)
            .filter(
                Employee.restaurant_id == restaurant.id,
                Employee.role != "Manager",
                Employee.deleted_at.is_(None),
            )
            .order_by(Employee.first_name, Employee.last_name)
            .all()
        )

        ids = [employee.id for employee in employees]

        if ids:
            records = (
                db.query(Attendance)
                .filter(
                    Attendance.employee_id.in_(ids),
                    Attendance.work_date >= start,
                    Attendance.work_date <= end,
                )
                .order_by(Attendance.work_date, Attendance.check_in)
                .all()
            )

    by_employee: dict[int, list[Attendance]] = {employee.id: [] for employee in employees}
    for record in records:
        by_employee[record.employee_id].append(record)

    def minutes_of(record: Attendance) -> int:
        return record.worked_minutes or 0

    label = "Week" if period == "week" else "Month"
    title = f"{start:%d.%m.%Y} - {end:%d.%m.%Y}"
    restaurant_name = restaurant.name if restaurant else "-"

    wb = Workbook()

    # ---------------------------------------------------------------- Summary
    ws = wb.active
    ws.title = "Summary"
    ws["A1"] = f"TimeTap - {label}ly working hours"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = f"Restaurant: {restaurant_name}"
    ws["A3"] = f"Period: {title}"
    ws["A4"] = f"Created: {datetime.now(RIGA_TZ):%d.%m.%Y %H:%M} (Riga time)"

    headers = ["Employee", "Code", "Role", "Days worked", "Total hours", "Average hours / day", "Manual entries", "Open (no check-out)"]
    header_row = 6
    for col, text in enumerate(headers, start=1):
        ws.cell(row=header_row, column=col, value=text)
    _style_header(ws, header_row, len(headers))

    row = header_row + 1
    grand_minutes = 0
    for employee in employees:
        items = by_employee[employee.id]
        total = sum(minutes_of(item) for item in items)
        worked_days = {item.work_date for item in items if item.check_out is not None}
        grand_minutes += total

        ws.cell(row=row, column=1, value=f"{employee.first_name} {employee.last_name}")
        ws.cell(row=row, column=2, value=employee.employee_id)
        ws.cell(row=row, column=3, value=employee.role)
        ws.cell(row=row, column=4, value=len(worked_days))
        ws.cell(row=row, column=5, value=round(total / 60, 2))
        ws.cell(row=row, column=6, value=round(total / 60 / len(worked_days), 2) if worked_days else 0)
        ws.cell(row=row, column=7, value=sum(1 for item in items if item.source == "manual" or item.check_out_source == "manual"))
        ws.cell(row=row, column=8, value=sum(1 for item in items if item.check_out is None))
        row += 1

    if employees:
        ws.cell(row=row, column=1, value="TOTAL").font = TOTAL_FONT
        ws.cell(row=row, column=5, value=round(grand_minutes / 60, 2)).font = TOTAL_FONT
    else:
        ws.cell(row=row, column=1, value="No employees found for this restaurant.")

    _widths(ws, [28, 14, 14, 13, 13, 19, 15, 19])
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)

    # ------------------------------------------------------- Daily hours grid
    grid = wb.create_sheet("Daily hours")
    grid.cell(row=1, column=1, value="Employee")
    for index, day in enumerate(days, start=2):
        grid.cell(row=1, column=index, value=f"{day:%a}\n{day:%d.%m}")
    total_col = len(days) + 2
    grid.cell(row=1, column=total_col, value="Total")
    _style_header(grid, 1, total_col)
    grid.row_dimensions[1].height = 32

    for r, employee in enumerate(employees, start=2):
        grid.cell(row=r, column=1, value=f"{employee.first_name} {employee.last_name}")
        per_day: dict[date, int] = {}
        for item in by_employee[employee.id]:
            per_day[item.work_date] = per_day.get(item.work_date, 0) + minutes_of(item)
        for index, day in enumerate(days, start=2):
            minutes = per_day.get(day)
            cell = grid.cell(row=r, column=index, value=round(minutes / 60, 2) if minutes else None)
            cell.alignment = Alignment(horizontal="center")
        total_cell = grid.cell(row=r, column=total_col, value=round(sum(per_day.values()) / 60, 2))
        total_cell.font = TOTAL_FONT

    _widths(grid, [28] + [8] * len(days) + [10])
    grid.freeze_panes = "B2"

    # -------------------------------------------------------------- Details
    detail = wb.create_sheet("Details")
    detail_headers = ["Date", "Employee", "Code", "Check-in", "Check-out", "Hours", "Check-in via", "Check-out via", "Status"]
    for col, text in enumerate(detail_headers, start=1):
        detail.cell(row=1, column=col, value=text)
    _style_header(detail, 1, len(detail_headers))

    names = {employee.id: employee for employee in employees}
    r = 2
    for record in records:
        employee = names[record.employee_id]
        check_in, check_out = _local(record.check_in), _local(record.check_out)
        detail.cell(row=r, column=1, value=record.work_date).number_format = "DD.MM.YYYY"
        detail.cell(row=r, column=2, value=f"{employee.first_name} {employee.last_name}")
        detail.cell(row=r, column=3, value=employee.employee_id)
        detail.cell(row=r, column=4, value=check_in).number_format = "HH:MM"
        detail.cell(row=r, column=5, value=check_out if check_out else "not checked out")
        if check_out:
            detail.cell(row=r, column=5).number_format = "HH:MM"
        detail.cell(row=r, column=6, value=round(minutes_of(record) / 60, 2))
        detail.cell(row=r, column=7, value=record.source)
        detail.cell(row=r, column=8, value=record.check_out_source)
        detail.cell(row=r, column=9, value=record.status)
        r += 1

    _widths(detail, [13, 28, 14, 11, 16, 9, 14, 15, 12])
    detail.freeze_panes = "A2"

    buffer = BytesIO()
    wb.save(buffer)

    if period == "week":
        name = f"TimeTap_hours_week_{start:%Y-%m-%d}.xlsx"
    else:
        name = f"TimeTap_hours_{start:%Y-%m}.xlsx"

    return buffer.getvalue(), name
