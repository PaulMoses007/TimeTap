from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: str


class EmployeeResponse(EmployeeCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True