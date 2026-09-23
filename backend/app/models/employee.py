from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)

    # Employee Code (M001, C001, W001...)
    employee_id = Column(
        String,
        unique=True,
        nullable=False
    )

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

    # Manager, Chef, Waiter...
    role = Column(
        String,
        nullable=False
    )

    # --------------------------------------------------
    # Restaurant Assignment
    # --------------------------------------------------

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=True
    )

    # --------------------------------------------------
    # Employee Schedule
    # --------------------------------------------------

    # Flexible or Fixed
    schedule_type = Column(
        String,
        default="Flexible",
        nullable=False
    )

    # Used only when schedule_type = "Fixed"
    # Example: "11:00"
    shift_start = Column(
        String,
        nullable=True
    )

    # Used only when schedule_type = "Fixed"
    # Example: "19:00"
    shift_end = Column(
        String,
        nullable=True
    )

    # --------------------------------------------------
    # Approval
    # --------------------------------------------------

    # Pending / Approved / Rejected
    approval_status = Column(
        String,
        default="Pending"
    )

    # Manager ID who approved this employee
    approved_by = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True
    )

    # Approval timestamp
    approved_at = Column(
        DateTime,
        nullable=True
    )

    # --------------------------------------------------
    # Authentication
    # --------------------------------------------------

    password_hash = Column(
        String,
        nullable=True
    )

    # Account Active
    is_active = Column(
        Boolean,
        default=True
    )

    # Email / Account Verified
    is_verified = Column(
        Boolean,
        default=False
    )

    # Last Login
    last_login = Column(
        DateTime,
        nullable=True
    )

    # --------------------------------------------------
    # Timestamps
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