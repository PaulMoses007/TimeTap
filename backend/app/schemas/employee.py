from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str


class EmployeeUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True