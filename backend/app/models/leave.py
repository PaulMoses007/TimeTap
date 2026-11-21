from datetime import datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text

from app.core.database import Base


class LeaveRequest(Base):
    """An employee's request for days off (sick, vacation, day off, other)."""

    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True)

    # Sick / Vacation / Day off / Other
    leave_type = Column(String, nullable=False)

    # First and last day, both included
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    reason = Column(Text, nullable=True)

    # Pending / Approved / Rejected
    status = Column(String, default="Pending", nullable=False, index=True)

    reviewed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
