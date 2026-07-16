from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.employee import Employee
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    new_employee = Employee(
        employee_id=generate_employee_code(employee.role, db),
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.email,
        phone=employee.phone,
        role=employee.role,
        password_hash=hash_password(employee.password),
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


@router.get("/", response_model=list[EmployeeResponse])
def get_all_employees(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return db.query(Employee).all()


@router.get("/pending", response_model=list[EmployeeResponse])
def get_pending_employees(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    return (
        db.query(Employee)
        .filter(Employee.approval_status == "Pending")
        .all()
    )


# -----------------------------
# NEW: Approve Employee
# -----------------------------
@router.put("/{employee_id}/approve", response_model=EmployeeResponse)
def approve_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.approval_status = "Approved"
    employee.is_verified = True

    employee.approved_by = current_user["id"]
    employee.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(employee)

    return employee

@router.put("/{employee_id}/reject", response_model=EmployeeResponse)
def reject_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.approval_status = "Rejected"
    employee.is_verified = False

    employee.approved_by = current_user["id"]
    employee.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(employee)

    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee.first_name = employee_data.first_name
    employee.last_name = employee_data.last_name
    employee.email = employee_data.email
    employee.phone = employee_data.phone
    employee.role = employee_data.role
    employee.is_active = employee_data.is_active

    db.commit()
    db.refresh(employee)

    return employee


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
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