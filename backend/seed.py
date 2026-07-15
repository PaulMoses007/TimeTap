from app.core.database import SessionLocal
from app.models.employee import Employee
from app.security.password import hash_password
from app.utils.employee_code import generate_employee_code


def seed_manager():
    db = SessionLocal()

    try:
        # Check if any employees already exist
        employee_count = db.query(Employee).count()

        if employee_count > 0:
            print("Employees already exist. Seed skipped.")
            return

        manager = Employee(
            employee_id=generate_employee_code("Manager", db),
            first_name="Paul",
            last_name="Moses",
            email="paul@example.com",
            phone="+37120000000",
            role="Manager",
            password_hash=hash_password("Welcome123"),
            is_active=True,
            is_verified=True,
        )

        db.add(manager)
        db.commit()

        print("=" * 50)
        print("First manager created successfully!")
        print("Email    : paul@example.com")
        print("Password : Welcome123")
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    seed_manager()