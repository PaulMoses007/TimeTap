from pydantic import BaseModel


class MonthlyAttendanceResponse(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    role: str
    restaurant: str

    days_present: int
    days_absent: int

    class Config:
        from_attributes = True