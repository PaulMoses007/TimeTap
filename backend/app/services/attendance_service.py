from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee


class AttendanceService:

    @staticmethod
    def check_in(employee_id: int, db: Session):

        # Check if employee exists
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

        # Check if already checked in today
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.work_date == date.today()
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Employee already checked in today"
            )

        # Create attendance record
        attendance = Attendance(
            employee_id=employee_id
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)

        return attendance

    @staticmethod
    def check_out(employee_id: int, db: Session):

        # Find today's attendance
        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.work_date == date.today()
            )
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=404,
                detail="Employee has not checked in today"
            )

        # Prevent double checkout
        if attendance.check_out is not None:
            raise HTTPException(
                status_code=400,
                detail="Employee already checked out"
            )

        # Save checkout time
        attendance.check_out = datetime.utcnow()

        # Calculate worked time
        time_difference = attendance.check_out - attendance.check_in

        worked_minutes = int(time_difference.total_seconds() // 60)

        worked_hours = round(worked_minutes / 60, 2)

        attendance.worked_minutes = worked_minutes
        attendance.worked_hours = worked_hours

        db.commit()
        db.refresh(attendance)

        return attendance