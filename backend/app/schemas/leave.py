from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

LeaveType = Literal["Sick", "Vacation", "Day off", "Other"]


class LeaveCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def dates_in_order(self):
        if self.end_date < self.start_date:
            raise ValueError("The last day cannot be before the first day")
        return self


class LeaveReview(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str | None = None
    employee_code: str | None = None
    leave_type: str
    start_date: date
    end_date: date
    days: int
    reason: str | None = None
    status: str
    review_note: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime | None = None
