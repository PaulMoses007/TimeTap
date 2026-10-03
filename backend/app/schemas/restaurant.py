from pydantic import BaseModel, EmailStr


# ==================================================
# CREATE RESTAURANT
# ==================================================

class RestaurantCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr


# ==================================================
# UPDATE RESTAURANT
# ==================================================

class RestaurantUpdate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr
    is_active: bool


# ==================================================
# RESTAURANT RESPONSE
# ==================================================

class RestaurantResponse(BaseModel):
    id: int

    name: str

    address: str | None

    phone: str | None

    email: EmailStr | None

    is_active: bool

    # Employee registration invitation code
    invitation_code: str | None = None

    class Config:
        from_attributes = True