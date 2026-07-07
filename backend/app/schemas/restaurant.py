from pydantic import BaseModel, EmailStr


class RestaurantCreate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr


class RestaurantUpdate(BaseModel):
    name: str
    address: str
    phone: str
    email: EmailStr
    is_active: bool


class RestaurantResponse(BaseModel):
    id: int
    name: str
    address: str | None
    phone: str | None
    email: EmailStr | None
    is_active: bool

    class Config:
        from_attributes = True