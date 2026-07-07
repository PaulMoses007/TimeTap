from sqlalchemy.orm import Session

from app.models.employee import Employee


PREFIXES = {
    "Manager": "M",
    "Assistant Manager": "AM",
    "Chef": "C",
    "Sous Chef": "SC",
    "Kitchen Helper": "KH",
    "Dish Washer": "DW",
    "Waiter": "W",
    "Bartender": "B",
    "Cashier": "CA",
    "Host": "H",
    "Cleaner": "CL",
    "Delivery Driver": "DD",
}


def generate_employee_code(role: str, db: Session) -> str:
    prefix = PREFIXES.get(role, "EMP")

    employees = (
        db.query(Employee)
        .filter(Employee.employee_id.like(f"{prefix}%"))
        .all()
    )

    highest = 0

    for employee in employees:
        try:
            number = int(employee.employee_id.replace(prefix, ""))
            highest = max(highest, number)
        except ValueError:
            continue

    return f"{prefix}{highest + 1:03d}"