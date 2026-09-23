from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.restaurant import Restaurant
from app.schemas.employee import (
    EmployeeRegister,
    EmployeeResponse,
)
from app.security.password import hash_password
from app.utils.employee_code import generate_employee_code


router = APIRouter(
    prefix="/register",
    tags=["Registration"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.post(
    "/",
    response_model=EmployeeResponse
)
def register_employee(
    employee: EmployeeRegister,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # Check restaurant
    # --------------------------------------------------

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.id == employee.restaurant_id
        )
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )


    # --------------------------------------------------
    # Check duplicate email
    # --------------------------------------------------

    existing = (
        db.query(Employee)
        .filter(
            Employee.email == employee.email
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    # --------------------------------------------------
    # Validate schedule type
    # --------------------------------------------------

    if employee.schedule_type not in [
        "Flexible",
        "Fixed"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Schedule type must be Flexible or Fixed"
        )


    # --------------------------------------------------
    # Fixed schedule validation
    # --------------------------------------------------

    if employee.schedule_type == "Fixed":

        if not employee.shift_start or not employee.shift_end:
            raise HTTPException(
                status_code=400,
                detail="Fixed schedule requires shift start and shift end times"
            )

        if employee.shift_start >= employee.shift_end:
            raise HTTPException(
                status_code=400,
                detail="Shift end time must be later than shift start time"
            )


    # --------------------------------------------------
    # Flexible schedule
    # --------------------------------------------------

    if employee.schedule_type == "Flexible":

        shift_start = None
        shift_end = None

    else:

        shift_start = employee.shift_start
        shift_end = employee.shift_end


    # --------------------------------------------------
    # Create employee
    # --------------------------------------------------

    new_employee = Employee(

        employee_id=generate_employee_code(
            employee.role,
            db
        ),

        first_name=employee.first_name,

        last_name=employee.last_name,

        email=employee.email,

        phone=employee.phone,

        role=employee.role,

        restaurant_id=employee.restaurant_id,

        password_hash=hash_password(
            employee.password
        ),

        # Schedule
        schedule_type=employee.schedule_type,
        shift_start=shift_start,
        shift_end=shift_end,

        # Approval
        approval_status="Pending",

        is_verified=False,

        is_active=True,
    )


    # --------------------------------------------------
    # Save employee
    # --------------------------------------------------

    db.add(new_employee)

    db.commit()

    db.refresh(new_employee)


    return new_employee