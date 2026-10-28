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


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    address = Column(
        String,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    email = Column(
        String,
        nullable=True
    )

    # --------------------------------------------------
    # Restaurant Manager
    # --------------------------------------------------

    manager_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True
    )

    # --------------------------------------------------
    # Employee Invitation
    # --------------------------------------------------

    # Unique code employees use to join this restaurant
    invitation_code = Column(
        String,
        unique=True,
        nullable=False
    )

    # --------------------------------------------------
    # Status
    # --------------------------------------------------

    is_active = Column(
        Boolean,
        default=True
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