from pydantic import BaseModel


class QRCheckInRequest(BaseModel):
    restaurant_id: int