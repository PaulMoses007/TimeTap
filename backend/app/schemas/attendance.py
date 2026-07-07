from datetime import datetime, date
from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    employee_id: int


class AttendanceCheckOut(BaseModel):
    employee_id: int


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    work_date: date
    check_in: datetime
    check_out: datetime | None

    worked_minutes: int
    worked_hours: float

    status: str

    class Config:
        from_attributes = True