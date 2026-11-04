from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


# QR Check-In Request
class AttendanceCheckInRequest(BaseModel):
    restaurant_id: int
    # "qr" = scanned the restaurant QR (main method)
    # "button" = held the check-in/out button for 15 seconds
    source: Literal["qr", "button"] = "qr"


# QR Check-Out Request
class AttendanceCheckOutRequest(BaseModel):
    restaurant_id: int
    source: Literal["qr", "button"] = "qr"


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

    source: str | None = None
    check_out_source: str | None = None

    class Config:
        from_attributes = True