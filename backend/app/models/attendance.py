from sqlalchemy import Column, Integer, DateTime, Date, ForeignKey, Float, String, Text
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

    # How the record was created: qr / button / manual
    source = Column(
        String,
        default="qr",
        nullable=True
    )

    # How the employee checked out: qr / button / manual
    check_out_source = Column(
        String,
        nullable=True
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


class ManualAttendanceRequest(Base):
    """
    An employee's request to add a missed check-in and/or check-out.
    A manager approves or rejects it later. Approval creates or
    completes the real Attendance record with source="manual".
    """

    __tablename__ = "manual_attendance_requests"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False,
        index=True
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=False,
        index=True
    )

    # Riga-local date of the shift (same rule as Attendance.work_date)
    work_date = Column(Date, nullable=False)

    # Naive UTC, like Attendance.check_in / check_out.
    # At least one of the two is set.
    requested_check_in = Column(DateTime, nullable=True)
    requested_check_out = Column(DateTime, nullable=True)

    reason = Column(Text, nullable=False)

    # Pending / Approved / Rejected
    status = Column(String, default="Pending", nullable=False, index=True)

    reviewed_by = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=True
    )
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)

    # Attendance record created or completed on approval
    attendance_id = Column(
        Integer,
        ForeignKey("attendance.id"),
        nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)

