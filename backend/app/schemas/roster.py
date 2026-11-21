from datetime import date

from pydantic import BaseModel, Field


class ShiftSet(BaseModel):
    employee_id: int
    work_date: date
    start_time: str
    end_time: str
    note: str | None = Field(default=None, max_length=100)


class CopyWeek(BaseModel):
    from_week_start: date
    to_week_start: date
