import os
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.restaurant import Restaurant
from app.models.employee import Employee

from app.qr.qr_generator import generate_restaurant_qr

from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantUpdate,
    RestaurantResponse,
)

from app.schemas.employee import (
    EmployeeResponse
)

from app.security.roles import require_manager

from app.utils.employee_code import (
    generate_employee_code
)


router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"]
)


# ==================================================
# DATABASE
# ==================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==================================================
# EMPLOYEE INVITATION CODE
# ==================================================

def generate_invitation_code(
    db: Session
):

    characters = (
        string.ascii_uppercase +
        string.digits
    )

    while True:

        code = (
            "TT-" +
            "".join(
                secrets.choice(characters)
                for _ in range(8)
            )
        )

        existing = (
            db.query(Restaurant)
            .filter(
                Restaurant.invitation_code ==
                code
            )
            .first()
        )

        if existing is None:
            return code


# ==================================================
# CREATE RESTAURANT
# ==================================================

@router.post(
    "/",
    response_model=RestaurantResponse
)
def create_restaurant(
    restaurant: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    # --------------------------------------------------
    # FIND MANAGER
    # --------------------------------------------------

    manager = (
        db.query(Employee)
        .filter(
            Employee.id == manager_id
        )
        .first()
    )

    if manager is None:

        raise HTTPException(
            status_code=404,
            detail="Manager account not found"
        )

    if manager.role != "Manager":

        raise HTTPException(
            status_code=403,
            detail=(
                "Only managers can "
                "create restaurants"
            )
        )

    # --------------------------------------------------
    # PREVENT DUPLICATE RESTAURANT
    # --------------------------------------------------

    existing_restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.manager_id ==
            manager_id
        )
        .first()
    )

    if existing_restaurant is not None:

        raise HTTPException(
            status_code=400,
            detail=(
                "You already have a restaurant."
            )
        )

    # --------------------------------------------------
    # CREATE RESTAURANT
    # --------------------------------------------------

    new_restaurant = Restaurant(

        name=restaurant.name,

        address=restaurant.address,

        phone=restaurant.phone,

        email=restaurant.email,

        manager_id=manager_id,

        invitation_code=
            generate_invitation_code(db),
    )

    db.add(new_restaurant)

    db.flush()

    # --------------------------------------------------
    # GENERATE MANAGER ID
    # --------------------------------------------------

    manager.employee_id = (
        generate_employee_code(
            "Manager",
            new_restaurant.id,
            db
        )
    )

    manager.restaurant_id = (
        new_restaurant.id
    )

    # --------------------------------------------------
    # SAVE
    # --------------------------------------------------

    db.commit()

    db.refresh(new_restaurant)

    db.refresh(manager)

    # --------------------------------------------------
    # GENERATE ATTENDANCE QR
    # --------------------------------------------------

    generate_restaurant_qr(
        new_restaurant.id,
        new_restaurant.name
    )

    return new_restaurant


# ==================================================
# GET MANAGER'S RESTAURANTS
# ==================================================

@router.get(
    "/",
    response_model=list[RestaurantResponse]
)
def get_all_restaurants(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    return (
        db.query(Restaurant)
        .filter(
            Restaurant.manager_id ==
            manager_id
        )
        .all()
    )


# ==================================================
# GET SINGLE RESTAURANT
# ==================================================

@router.get(
    "/{restaurant_id}",
    response_model=RestaurantResponse
)
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if restaurant is None:

        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    return restaurant


# ==================================================
# GET EMPLOYEES
# ==================================================

@router.get(
    "/{restaurant_id}/employees",
    response_model=list[EmployeeResponse]
)
def get_restaurant_employees(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if restaurant is None:

        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    return (
        db.query(Employee)
        .filter(
            Employee.restaurant_id ==
            restaurant_id
        )
        .all()
    )


# ==================================================
# UPDATE RESTAURANT
# ==================================================

@router.put(
    "/{restaurant_id}",
    response_model=RestaurantResponse
)
def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.manager_id == manager_id
        )
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


# ==================================================
# DELETE RESTAURANT
# ==================================================

@router.delete(
    "/{restaurant_id}"
)
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if restaurant is None:

        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    employees = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id ==
            restaurant_id
        )
        .all()
    )

    for employee in employees:
        employee.restaurant_id = None

    db.delete(restaurant)

    db.commit()

    return {
        "message":
            "Restaurant deleted successfully"
    }


# ==================================================
# GET ATTENDANCE QR
# ==================================================

@router.get(
    "/{restaurant_id}/qr"
)
def get_restaurant_qr(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == restaurant_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if restaurant is None:

        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    filepath = (
        f"qrcodes/restaurant_{restaurant_id}.png"
    )

    if not os.path.exists(filepath):

        raise HTTPException(
            status_code=404,
            detail="QR code not found"
        )

    return FileResponse(
        path=filepath,
        media_type="image/png",
        filename=(
            f"restaurant_{restaurant_id}.png"
        )
    )