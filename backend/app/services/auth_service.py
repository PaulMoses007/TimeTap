from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.schemas.auth import LoginRequest
from app.security.jwt import create_access_token
from app.security.password import verify_password


class AuthService:

    @staticmethod
    def login(login_data: LoginRequest, db: Session):

        employee = (
            db.query(Employee)
            .filter(Employee.email == login_data.email)
            .first()
        )

        if employee is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not verify_password(
            login_data.password,
            employee.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not employee.is_active:
            raise HTTPException(
                status_code=403,
                detail="Employee account is inactive"
            )

        employee.last_login = datetime.utcnow()

        db.commit()

        token = create_access_token(
            {
                "sub": employee.email,
                "employee_id": employee.employee_id,
                "role": employee.role,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }