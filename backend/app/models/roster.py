from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.core.database import Base


class Shift(Base):
    """One planned shift: who works on which day, from when to when."""

    __tablename__ = "shifts"
    __table_args__ = (
        UniqueConstraint("employee_id", "work_date", name="uq_shift_employee_day"),
    )

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)

    work_date = Column(Date, nullable=False, index=True)

    # "HH:MM" Riga time. If the end is not after the start, the shift
    # runs past midnight.
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    note = Column(String, nullable=True)

    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
