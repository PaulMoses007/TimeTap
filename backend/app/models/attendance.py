from sqlalchemy import Column, Integer, DateTime, Date, ForeignKey, Float, String
from datetime import datetime, date

from app.core.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False
    )

    work_date = Column(
        Date,
        default=date.today
    )

    check_in = Column(
        DateTime,
        default=datetime.utcnow
    )

    check_out = Column(
        DateTime,
        nullable=True
    )

    # Actual worked minutes
    worked_minutes = Column(
        Integer,
        default=0
    )

    # Worked hours (example: 8.50)
    worked_hours = Column(
        Float,
        default=0
    )

    # Attendance status
    status = Column(
        String,
        default="Present"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )