import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.restaurant import Restaurant
from app.qr.qr_generator import generate_restaurant_qr
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantUpdate,
    RestaurantResponse,
)

router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=RestaurantResponse)
def create_restaurant(
    restaurant: RestaurantCreate,
    db: Session = Depends(get_db)
):
    new_restaurant = Restaurant(
        name=restaurant.name,
        address=restaurant.address,
        phone=restaurant.phone,
        email=restaurant.email,
    )

    db.add(new_restaurant)
    db.commit()
    db.refresh(new_restaurant)

    # Generate QR Code automatically
    generate_restaurant_qr(
        new_restaurant.id,
        new_restaurant.name
    )

    return new_restaurant


@router.get("/", response_model=list[RestaurantResponse])
def get_all_restaurants(
    db: Session = Depends(get_db)
):
    return db.query(Restaurant).all()


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    return restaurant


@router.put("/{restaurant_id}", response_model=RestaurantResponse)
def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db)
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    restaurant.name = restaurant_data.name
    restaurant.address = restaurant_data.address
    restaurant.phone = restaurant_data.phone
    restaurant.email = restaurant_data.email
    restaurant.is_active = restaurant_data.is_active

    db.commit()
    db.refresh(restaurant)

    return restaurant


@router.delete("/{restaurant_id}")
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    db.delete(restaurant)
    db.commit()

    return {
        "message": "Restaurant deleted successfully"
    }


@router.get("/{restaurant_id}/qr")
def get_restaurant_qr(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    # Check if restaurant exists
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    filepath = f"qrcodes/restaurant_{restaurant_id}.png"

    # Check if QR file exists
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail="QR code not found"
        )

    return FileResponse(
        path=filepath,
        media_type="image/png",
        filename=f"restaurant_{restaurant_id}.png"
    )