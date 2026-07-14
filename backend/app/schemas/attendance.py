from datetime import date, datetime

from pydantic import BaseModel


# QR Check-In Request
class AttendanceCheckInRequest(BaseModel):
    restaurant_id: int


# QR Check-Out Request
class AttendanceCheckOutRequest(BaseModel):
    restaurant_id: int


# Attendance Response
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