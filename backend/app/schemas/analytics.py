from pydantic import BaseModel


class EmployeeAnalytics(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    role: str
    restaurant: str

    schedule_type: str
    shift_start: str | None
    shift_end: str | None

    days_present: int
    total_worked_minutes: int
    total_worked_hours: float
    average_shift_hours: float
    attendance_rate: float

    average_check_in: str | None
    average_check_out: str | None

    late_arrivals: int
    average_late_minutes: float


class AdaptiveAlert(BaseModel):
    employee_id: str
    employee_name: str
    alert_type: str
    severity: str
    message: str


class AnalyticsSummary(BaseModel):
    total_employees: int
    employees_with_attendance: int
    total_attendance_records: int

    total_worked_minutes: int
    total_worked_hours: float

    average_shift_hours: float
    average_attendance_rate: float

    employees_with_low_attendance: int

    employees: list[EmployeeAnalytics]

    alerts: list[AdaptiveAlert]