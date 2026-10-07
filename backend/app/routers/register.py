from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.models.employee import Employee
from app.models.restaurant import Restaurant

from app.schemas.employee import (
    EmployeeRegister,
    EmployeeResponse,
)

from app.schemas.manager import (
    ManagerRegister,
    ManagerResponse,
)

from app.security.password import hash_password

from app.utils.employee_code import (
    generate_employee_code
)


router = APIRouter(
    prefix="/register",
    tags=["Registration"]
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
# EMPLOYEE REGISTRATION
# ==================================================

@router.post(
    "/",
    response_model=EmployeeResponse
)
def register_employee(
    employee: EmployeeRegister,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # FIND RESTAURANT USING INVITATION CODE
    # --------------------------------------------------

    invitation_code = (
        employee.invitation_code
        .strip()
        .upper()
    )

    restaurant = (
        db.query(Restaurant)
        .filter(
            Restaurant.invitation_code ==
            invitation_code
        )
        .first()
    )

    if restaurant is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Invalid restaurant "
                "invitation code."
            )
        )

    # --------------------------------------------------
    # CHECK RESTAURANT STATUS
    # --------------------------------------------------

    if not restaurant.is_active:

        raise HTTPException(
            status_code=400,
            detail=(
                "This restaurant is "
                "currently inactive."
            )
        )

    # --------------------------------------------------
    # CHECK DUPLICATE EMAIL
    # --------------------------------------------------

    existing = (
        db.query(Employee)
        .filter(
            Employee.email ==
            employee.email
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email already registered."
            )
        )

    # --------------------------------------------------
    # VALIDATE SCHEDULE
    # --------------------------------------------------

    if employee.schedule_type not in [
        "Flexible",
        "Fixed"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Schedule type must be "
                "Flexible or Fixed."
            )
        )

    # --------------------------------------------------
    # FIXED SCHEDULE
    # --------------------------------------------------

    if employee.schedule_type == "Fixed":

        if (
            not employee.shift_start
            or not employee.shift_end
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Fixed schedule requires "
                    "shift start and shift end times."
                )
            )

        if (
            employee.shift_start >=
            employee.shift_end
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "Shift end time must be later "
                    "than shift start time."
                )
            )

    # --------------------------------------------------
    # FLEXIBLE SCHEDULE
    # --------------------------------------------------

    if employee.schedule_type == "Flexible":

        shift_start = None
        shift_end = None

    else:

        shift_start = employee.shift_start
        shift_end = employee.shift_end

    # --------------------------------------------------
    # GENERATE RESTAURANT-SPECIFIC EMPLOYEE ID
    # --------------------------------------------------

    employee_code = generate_employee_code(
        employee.role,
        restaurant.id,
        db
    )

    # --------------------------------------------------
    # CREATE EMPLOYEE
    # --------------------------------------------------

    new_employee = Employee(

        employee_id=employee_code,

        first_name=
            employee.first_name,

        last_name=
            employee.last_name,

        email=
            employee.email,

        phone=
            employee.phone,

        role=
            employee.role,

        # Restaurant comes automatically
        # from the invitation code.
        restaurant_id=
            restaurant.id,

        password_hash=
            hash_password(
                employee.password
            ),

        schedule_type=
            employee.schedule_type,

        shift_start=
            shift_start,

        shift_end=
            shift_end,

        # Manager must approve employee.
        approval_status=
            "Pending",

        is_verified=
            False,

        is_active=
            True,
    )

    db.add(new_employee)

    db.commit()

    db.refresh(new_employee)

    return new_employee


# ==================================================
# MANAGER REGISTRATION
# ==================================================

@router.post(
    "/manager",
    response_model=ManagerResponse
)
def register_manager(
    manager: ManagerRegister,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------
    # CHECK DUPLICATE EMAIL
    # --------------------------------------------------

    existing = (
        db.query(Employee)
        .filter(
            Employee.email ==
            manager.email
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Email already registered."
            )
        )

    # --------------------------------------------------
    # CREATE MANAGER ACCOUNT
    # --------------------------------------------------
    #
    # IMPORTANT:
    #
    # The manager does NOT have a restaurant yet.
    #
    # Therefore:
    #
    # restaurant_id = None
    # employee_id = None
    #
    # The M001 code will be generated later,
    # when this manager creates their first restaurant.
    # --------------------------------------------------

    new_manager = Employee(

        employee_id=None,

        first_name=
            manager.first_name,

        last_name=
            manager.last_name,

        email=
            manager.email,

        phone=
            manager.phone,

        role=
            "Manager",

        restaurant_id=
            None,

        password_hash=
            hash_password(
                manager.password
            ),

        schedule_type=
            "Flexible",

        shift_start=
            None,

        shift_end=
            None,

        # Managers do not need another
        # manager to approve their account.
        approval_status=
            "Approved",

        is_verified=
            True,

        is_active=
            True,
    )

    db.add(new_manager)

    db.commit()

    db.refresh(new_manager)

    return ManagerResponse(
        id=new_manager.id,

        employee_id=
            new_manager.employee_id,

        first_name=
            new_manager.first_name,

        last_name=
            new_manager.last_name,

        email=
            new_manager.email,

        phone=
            new_manager.phone,

        role=
            new_manager.role,

        approval_status=
            new_manager.approval_status,

        is_active=
            new_manager.is_active,
    )