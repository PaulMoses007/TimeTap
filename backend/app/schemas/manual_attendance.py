from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ManualAttendanceCreate(BaseModel):
    """
    Employee asks for a missed check-in and/or check-out to be added.

    Times may include a UTC offset (recommended, e.g. 2026-11-03T09:00:00+02:00).
    A time without an offset is treated as Riga local time.
    """

    check_in: datetime | None = None
    check_out: datetime | None = None
    reason: str = Field(min_length=5, max_length=500)

    @model_validator(mode="after")
    def at_least_one_time(self):
        if self.check_in is None and self.check_out is None:
            raise ValueError("Provide a check-in time, a check-out time, or both")
        return self


class ManualAttendanceReview(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class ManualAttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_code: str | None = None
    employee_name: str | None = None
    restaurant_id: int
    restaurant_name: str | None = None

    work_date: date
    requested_check_in: datetime | None
    requested_check_out: datetime | None
    reason: str

    status: str
    reviewed_by: int | None = None
    reviewed_at: datetime | None = None
    review_note: str | None = None
    attendance_id: int | None = None
    created_at: datetime | None = None
