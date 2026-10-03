from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.restaurant import Restaurant

from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
)

from app.security.password import hash_password
from app.utils.employee_code import generate_employee_code
from app.security.dependencies import get_current_user
from app.security.roles import require_manager


router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
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
# ADD RESTAURANT NAME TO EMPLOYEE RESPONSE
# ==================================================

def employee_response(
    employee: Employee,
    db: Session
):
    restaurant_name = None

    if employee.restaurant_id is not None:

        restaurant = (
            db.query(Restaurant)
            .filter(
                Restaurant.id == employee.restaurant_id
            )
            .first()
        )

        if restaurant is not None:
            restaurant_name = restaurant.name

    data = {
        "id": employee.id,
        "employee_id": employee.employee_id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "role": employee.role,
        "restaurant_id": employee.restaurant_id,
        "restaurant_name": restaurant_name,
        "schedule_type": employee.schedule_type,
        "shift_start": employee.shift_start,
        "shift_end": employee.shift_end,
        "approval_status": employee.approval_status,
        "is_active": employee.is_active,
        "is_verified": employee.is_verified,
        "created_at": employee.created_at,
    }

    return EmployeeResponse(**data)


# ==================================================
# CREATE EMPLOYEE
# ==================================================

@router.post(
    "/",
    response_model=EmployeeResponse
)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    # --------------------------------------------------
    # Check restaurant access
    # --------------------------------------------------

    if employee.restaurant_id is not None:

        restaurant = (
            db.query(Restaurant)
            .filter(
                Restaurant.id == employee.restaurant_id,
                Restaurant.manager_id == manager_id
            )
            .first()
        )

        if restaurant is None:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have access "
                    "to this restaurant."
                )
            )

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

        schedule_type=employee.schedule_type,

        shift_start=employee.shift_start,

        shift_end=employee.shift_end,
    )

    db.add(new_employee)

    db.commit()

    db.refresh(new_employee)

    return employee_response(
        new_employee,
        db
    )


# ==================================================
# GET ALL EMPLOYEES
# ==================================================

@router.get(
    "/",
    response_model=list[EmployeeResponse]
)
def get_all_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_manager)
):

    manager_id = current_user["id"]

    # --------------------------------------------------
    # Find restaurants managed by current manager
    # --------------------------------------------------

    managed_restaurant_ids = [
        restaurant.id
        for restaurant in (
            db.query(Restaurant)
            .filter(
                Restaurant.manager_id == manager_id
            )
            .all()
        )
    ]

    # --------------------------------------------------
    # Find employees belonging to those restaurants
    # --------------------------------------------------

    employees = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id.in_(
                managed_restaurant_ids
            )
        )
        .all()
    )

    return [
        employee_response(employee, db)
        for employee in employees
    ]


# ==================================================
# GET PENDING EMPLOYEES
# ==================================================

@router.get(
    "/pending",
    response_model=list[EmployeeResponse]
)
def get_pending_employees(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    managed_restaurant_ids = [
        restaurant.id
        for restaurant in (
            db.query(Restaurant)
            .filter(
                Restaurant.manager_id == manager_id
            )
            .all()
        )
    ]

    employees = (
        db.query(Employee)
        .filter(
            Employee.approval_status == "Pending",
            Employee.restaurant_id.in_(
                managed_restaurant_ids
            )
        )
        .all()
    )

    return [
        employee_response(employee, db)
        for employee in employees
    ]


# ==================================================
# APPROVE EMPLOYEE
# ==================================================

@router.put(
    "/{employee_id}/approve",
    response_model=EmployeeResponse
)
def approve_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    employee = (
        db.query(Employee)
        .join(
            Restaurant,
            Employee.restaurant_id == Restaurant.id
        )
        .filter(
            Employee.id == employee_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.approval_status = "Approved"

    employee.is_verified = True

    employee.approved_by = manager_id

    employee.approved_at = datetime.utcnow()

    db.commit()

    db.refresh(employee)

    return employee_response(
        employee,
        db
    )


# ==================================================
# REJECT EMPLOYEE
# ==================================================

@router.put(
    "/{employee_id}/reject",
    response_model=EmployeeResponse
)
def reject_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    employee = (
        db.query(Employee)
        .join(
            Restaurant,
            Employee.restaurant_id == Restaurant.id
        )
        .filter(
            Employee.id == employee_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.approval_status = "Rejected"

    employee.is_verified = False

    employee.approved_by = manager_id

    employee.approved_at = datetime.utcnow()

    db.commit()

    db.refresh(employee)

    return employee_response(
        employee,
        db
    )


# ==================================================
# GET CURRENT LOGGED-IN EMPLOYEE
# ==================================================

@router.get(
    "/me",
    response_model=EmployeeResponse
)
def get_current_employee(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == current_user["id"]
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Current employee not found"
        )

    return employee_response(
        employee,
        db
    )


# ==================================================
# GET SINGLE EMPLOYEE
# ==================================================

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # --------------------------------------------------
    # Employee can view own profile
    # --------------------------------------------------

    if current_user["id"] == employee_id:

        employee = (
            db.query(Employee)
            .filter(
                Employee.id == employee_id
            )
            .first()
        )

    # --------------------------------------------------
    # Manager can view employees in managed restaurants
    # --------------------------------------------------

    elif current_user["role"] == "Manager":

        employee = (
            db.query(Employee)
            .join(
                Restaurant,
                Employee.restaurant_id == Restaurant.id
            )
            .filter(
                Employee.id == employee_id,
                Restaurant.manager_id ==
                current_user["id"]
            )
            .first()
        )

    else:

        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee_response(
        employee,
        db
    )


# ==================================================
# UPDATE EMPLOYEE
# ==================================================

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    # --------------------------------------------------
    # Find employee in manager's restaurants
    # --------------------------------------------------

    employee = (
        db.query(Employee)
        .join(
            Restaurant,
            Employee.restaurant_id == Restaurant.id
        )
        .filter(
            Employee.id == employee_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    # --------------------------------------------------
    # Validate new restaurant assignment
    # --------------------------------------------------

    if employee_data.restaurant_id is not None:

        restaurant = (
            db.query(Restaurant)
            .filter(
                Restaurant.id ==
                employee_data.restaurant_id,
                Restaurant.manager_id ==
                manager_id
            )
            .first()
        )

        if restaurant is None:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You cannot assign an employee "
                    "to a restaurant you do not manage."
                )
            )

    # --------------------------------------------------
    # Update employee
    # --------------------------------------------------

    employee.first_name = employee_data.first_name

    employee.last_name = employee_data.last_name

    employee.email = employee_data.email

    employee.phone = employee_data.phone

    employee.role = employee_data.role

    employee.is_active = employee_data.is_active

    employee.restaurant_id = (
        employee_data.restaurant_id
    )

    employee.schedule_type = (
        employee_data.schedule_type
    )

    employee.shift_start = (
        employee_data.shift_start
    )

    employee.shift_end = (
        employee_data.shift_end
    )

    db.commit()

    db.refresh(employee)

    return employee_response(
        employee,
        db
    )


# ==================================================
# DELETE EMPLOYEE
# ==================================================

@router.delete(
    "/{employee_id}"
)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):

    manager_id = current_user["id"]

    employee = (
        db.query(Employee)
        .join(
            Restaurant,
            Employee.restaurant_id == Restaurant.id
        )
        .filter(
            Employee.id == employee_id,
            Restaurant.manager_id == manager_id
        )
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    db.delete(employee)

    db.commit()

    return {
        "message": "Employee deleted successfully"
    }