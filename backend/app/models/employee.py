from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from app.core.database import Base


class Employee(Base):

    __tablename__ = "employees"

    # --------------------------------------------------
    # DATABASE ID
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # --------------------------------------------------
    # EMPLOYEE BUSINESS CODE
    # --------------------------------------------------
    #
    # Example:
    #
    # Restaurant 1:
    # M001
    # W001
    # W002
    #
    # Restaurant 2:
    # M001
    # W001
    #
    # The combination of restaurant_id + employee_id
    # must be unique.
    # --------------------------------------------------

    employee_id = Column(
        String,
        nullable=False
    )

    # --------------------------------------------------
    # PERSONAL INFORMATION
    # --------------------------------------------------

    first_name = Column(
        String,
        nullable=False
    )

    last_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    phone = Column(
        String,
        nullable=False
    )

    # --------------------------------------------------
    # ROLE
    # --------------------------------------------------

    # Manager, Chef, Waiter, Other role, etc.
    role = Column(
        String,
        nullable=False
    )

    # --------------------------------------------------
    # RESTAURANT ASSIGNMENT
    # --------------------------------------------------

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=True
    )

    # --------------------------------------------------
    # EMPLOYEE SCHEDULE
    # --------------------------------------------------

    # Flexible or Fixed
    schedule_type = Column(
        String,
        default="Flexible",
        nullable=False
    )

    # Used when schedule_type = Fixed
    # Example: "11:00"
    shift_start = Column(
        String,
        nullable=True
    )

    # Used when schedule_type = Fixed
    # Example: "19:00"
    shift_end = Column(
        String,
        nullable=True
    )

    # --------------------------------------------------
    # APPROVAL
    # --------------------------------------------------

    # Pending / Approved / Rejected
    approval_status = Column(
        String,
        default="Pending"
    )

    # Manager who approved this employee
    approved_by = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True
    )

    approved_at = Column(
        DateTime,
        nullable=True
    )

    # --------------------------------------------------
    # AUTHENTICATION
    # --------------------------------------------------

    password_hash = Column(
        String,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True
    )

    is_verified = Column(
        Boolean,
        default=False
    )

    last_login = Column(
        DateTime,
        nullable=True
    )

    # --------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # --------------------------------------------------
    # RESTAURANT-SCOPED EMPLOYEE ID
    # --------------------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "restaurant_id",
            "employee_id",
            name="uq_employee_restaurant_code"
        ),
    )