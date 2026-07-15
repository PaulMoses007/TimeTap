from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_restaurants: int
    total_employees: int
    pending_approvals: int

    checked_in_today: int
    checked_out_today: int

    working_now: int
    absent_today: int