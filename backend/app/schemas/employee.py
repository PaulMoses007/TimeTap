from datetime import datetime

from pydantic import BaseModel, EmailStr


# ==================================================
# CREATE EMPLOYEE
# ==================================================

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    password: str

    restaurant_id: int | None = None

    schedule_type: str = "Flexible"
    shift_start: str | None = None
    shift_end: str | None = None


# ==================================================
# EMPLOYEE SELF-REGISTRATION
# ==================================================

class EmployeeRegister(BaseModel):
    invitation_code: str

    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    password: str

    schedule_type: str = "Flexible"
    shift_start: str | None = None
    shift_end: str | None = None


# ==================================================
# UPDATE EMPLOYEE
# ==================================================

class EmployeeUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    is_active: bool

    restaurant_id: int | None = None

    schedule_type: str = "Flexible"

    shift_start: str | None = None
    shift_end: str | None = None


# ==================================================
# EMPLOYEE RESPONSE
# ==================================================

class EmployeeResponse(BaseModel):
    id: int

    employee_id: str

    first_name: str

    last_name: str

    email: EmailStr

    phone: str

    role: str

    restaurant_id: int | None

    # Restaurant name
    restaurant_name: str | None = None

    # Schedule
    schedule_type: str

    shift_start: str | None

    shift_end: str | None

    # Approval
    approval_status: str

    is_active: bool

    is_verified: bool

    created_at: datetime

    class Config:
        from_attributes = True