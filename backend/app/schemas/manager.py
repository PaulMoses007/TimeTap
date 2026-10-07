from pydantic import BaseModel, EmailStr


# ==================================================
# MANAGER REGISTRATION
# ==================================================

class ManagerRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str


# ==================================================
# MANAGER RESPONSE
# ==================================================

class ManagerResponse(BaseModel):
    id: int
    employee_id: str

    first_name: str
    last_name: str

    email: EmailStr
    phone: str

    role: str

    approval_status: str
    is_active: bool