from datetime import datetime

from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    password: str


# Version 2.0
# Employee self-registration
class EmployeeRegister(BaseModel):
    restaurant_id: int

    first_name: str
    last_name: str

    email: EmailStr
    phone: str

    role: str

    password: str


class EmployeeUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    is_active: bool


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str

    first_name: str
    last_name: str

    email: EmailStr
    phone: str

    role: str

    restaurant_id: int | None

    approval_status: str

    is_active: bool
    is_verified: bool

    created_at: datetime

    class Config:
        from_attributes = True