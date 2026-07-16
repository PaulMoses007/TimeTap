from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TodayAttendanceResponse(BaseModel):
    employee_id: str

    first_name: str
    last_name: str

    restaurant: str

    role: str

    status: str

    check_in: Optional[datetime]
    check_out: Optional[datetime]

    class Config:
        from_attributes = True