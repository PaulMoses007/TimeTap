from datetime import date, datetime
from pydantic import BaseModel


class AttendanceReportResponse(BaseModel):
    employee_name: str
    employee_code: str
    work_date: date

    check_in: datetime
    check_out: datetime | None

    worked_minutes: int
    worked_hours: float

    status: str

    class Config:
        from_attributes = True