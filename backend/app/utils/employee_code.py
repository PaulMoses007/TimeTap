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


def generate_employee_code(
    role: str,
    restaurant_id: int,
    db: Session
) -> str:

    prefix = PREFIXES.get(
        role,
        "EMP"
    )

    employees = (
        db.query(Employee)
        .filter(
            Employee.restaurant_id ==
            restaurant_id
        )
        .filter(
            Employee.employee_id.like(
                f"{prefix}%"
            )
        )
        .all()
    )

    highest = 0

    for employee in employees:

        try:

            number = int(
                employee.employee_id[
                    len(prefix):
                ]
            )

            highest = max(
                highest,
                number
            )

        except (ValueError, TypeError):

            continue

    return (
        f"{prefix}"
        f"{highest + 1:03d}"
    )