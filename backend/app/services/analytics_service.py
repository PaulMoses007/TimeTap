from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant


# ============================================================
# TIMEZONE
# ============================================================

RIGA_TIMEZONE = ZoneInfo("Europe/Riga")


# ============================================================
# UTC -> RIGA
# ============================================================

def to_riga_time(value):
    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(
            tzinfo=timezone.utc
        )

    return value.astimezone(
        RIGA_TIMEZONE
    )


# ============================================================
# NORMALIZE TIME STRING
# ============================================================

def normalize_time_string(value):
    """
    Accept both:

        11:00
        11.00

    and normalize them to:

        11:00
    """

    if not value:
        return None

    value = value.strip()

    value = value.replace(".", ":")

    return value


# ============================================================
# AVERAGE TIME
# ============================================================

def _average_time(
    records,
    field_name
):
    values = []

    for record in records:

        value = getattr(
            record,
            field_name,
            None
        )

        if value is None:
            continue

        local_value = to_riga_time(
            value
        )

        total_seconds = (
            local_value.hour * 3600
            + local_value.minute * 60
            + local_value.second
        )

        values.append(
            total_seconds
        )

    if not values:
        return None

    average_seconds = (
        sum(values) / len(values)
    )

    hours = int(
        average_seconds // 3600
    )

    minutes = int(
        (average_seconds % 3600) // 60
    )

    return f"{hours:02d}:{minutes:02d}"


# ============================================================
# LATE ARRIVAL ANALYSIS
# ============================================================

def _calculate_late_minutes(
    employee,
    records
):
    """
    Calculate lateness for Fixed schedule employees.

    Flexible employees do not have a scheduled start time,
    therefore lateness is not calculated for them.
    """

    if employee.schedule_type != "Fixed":
        return 0, 0.0

    normalized_start = normalize_time_string(
        employee.shift_start
    )

    if not normalized_start:
        return 0, 0.0

    try:

        scheduled_time = datetime.strptime(
            normalized_start,
            "%H:%M"
        ).time()

    except ValueError:

        return 0, 0.0

    scheduled_minutes = (
        scheduled_time.hour * 60
        + scheduled_time.minute
    )

    late_arrivals = 0
    late_minutes = []

    for record in records:

        if record.check_in is None:
            continue

        local_check_in = to_riga_time(
            record.check_in
        )

        actual_minutes = (
            local_check_in.hour * 60
            + local_check_in.minute
        )

        difference = (
            actual_minutes
            - scheduled_minutes
        )

        if difference > 0:

            late_arrivals += 1

            late_minutes.append(
                difference
            )

    if late_minutes:

        average_late_minutes = round(
            sum(late_minutes)
            / len(late_minutes),
            2
        )

    else:

        average_late_minutes = 0.0

    return (
        late_arrivals,
        average_late_minutes
    )


# ============================================================
# ADAPTIVE ALERTS
# ============================================================

def _generate_employee_alerts(
    employee,
    employee_result
):

    alerts = []

    employee_name = (
        f"{employee.first_name} "
        f"{employee.last_name}"
    )

    employee_id = employee.employee_id

    attendance_rate = (
        employee_result[
            "attendance_rate"
        ]
    )

    average_shift_hours = (
        employee_result[
            "average_shift_hours"
        ]
    )

    late_arrivals = (
        employee_result[
            "late_arrivals"
        ]
    )

    average_late_minutes = (
        employee_result[
            "average_late_minutes"
        ]
    )

    days_present = (
        employee_result[
            "days_present"
        ]
    )

    average_check_in = (
        employee_result[
            "average_check_in"
        ]
    )

    # ========================================================
    # LOW ATTENDANCE
    # ========================================================

    if attendance_rate < 50:

        alerts.append(
            {
                "employee_id":
                    employee_id,

                "employee_name":
                    employee_name,

                "alert_type":
                    "Low Attendance",

                "severity":
                    "error",

                "message":
                    (
                        f"{employee_name} has an "
                        f"attendance rate of "
                        f"{attendance_rate}%, which "
                        f"is below the 50% threshold."
                    ),
            }
        )

    # ========================================================
    # REPEATED LATENESS
    # ========================================================

    if (
        employee.schedule_type == "Fixed"
        and late_arrivals >= 2
    ):

        alerts.append(
            {
                "employee_id":
                    employee_id,

                "employee_name":
                    employee_name,

                "alert_type":
                    "Repeated Lateness",

                "severity":
                    "warning",

                "message":
                    (
                        f"{employee_name} has recorded "
                        f"{late_arrivals} late arrivals, "
                        f"with an average lateness of "
                        f"{average_late_minutes} minutes."
                    ),
            }
        )

    # ========================================================
    # SHORT SHIFTS
    # ========================================================

    if (
        days_present >= 2
        and average_shift_hours > 0
        and average_shift_hours < 4
    ):

        alerts.append(
            {
                "employee_id":
                    employee_id,

                "employee_name":
                    employee_name,

                "alert_type":
                    "Short Shifts",

                "severity":
                    "warning",

                "message":
                    (
                        f"{employee_name} has an "
                        f"average completed shift "
                        f"of {average_shift_hours} "
                        f"hours."
                    ),
            }
        )

    # ========================================================
    # FLEXIBLE PATTERN
    # ========================================================

    if (
        employee.schedule_type == "Flexible"
        and days_present >= 2
        and average_check_in
    ):

        alerts.append(
            {
                "employee_id":
                    employee_id,

                "employee_name":
                    employee_name,

                "alert_type":
                    "Attendance Pattern",

                "severity":
                    "info",

                "message":
                    (
                        f"{employee_name} has an "
                        f"observed average check-in "
                        f"time of {average_check_in} "
                        f"based on historical attendance."
                    ),
            }
        )

    return alerts


# ============================================================
# MAIN ANALYTICS
# ============================================================

def get_attendance_analytics(
    db: Session,
    days: int = 30
):

    # ========================================================
    # CURRENT RIGA DATE
    # ========================================================

    now_riga = datetime.now(
        RIGA_TIMEZONE
    )

    today = now_riga.date()

    start_date = (
        today
        - timedelta(days=days - 1)
    )

    # ========================================================
    # EMPLOYEES
    # ========================================================

    employees = (
        db.query(Employee)
        .filter(
            Employee.is_active == True,
            Employee.role != "Manager"
        )
        .all()
    )

    # ========================================================
    # ATTENDANCE
    # ========================================================

    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= start_date,
            Attendance.work_date <= today
        )
        .all()
    )

    total_attendance_records = len(
        attendance_records
    )

    total_worked_minutes = 0

    employees_with_attendance = 0

    employees_with_low_attendance = 0

    employee_results = []

    adaptive_alerts = []

    # ========================================================
    # PROCESS EMPLOYEES
    # ========================================================

    for employee in employees:

        employee_records = [
            record
            for record in attendance_records
            if record.employee_id == employee.id
        ]

        # ----------------------------------------------------
        # DAYS PRESENT
        # ----------------------------------------------------

        days_present = len(
            employee_records
        )

        if days_present > 0:
            employees_with_attendance += 1

        # ----------------------------------------------------
        # WORKED TIME
        # ----------------------------------------------------

        employee_worked_minutes = sum(
            record.worked_minutes or 0
            for record in employee_records
        )

        employee_worked_hours = round(
            employee_worked_minutes / 60,
            2
        )

        total_worked_minutes += (
            employee_worked_minutes
        )

        # ----------------------------------------------------
        # COMPLETED SHIFTS
        # ----------------------------------------------------

        completed_records = [
            record
            for record in employee_records
            if record.check_in is not None
            and record.check_out is not None
        ]

        if completed_records:

            completed_shift_hours = [
                (
                    record.worked_minutes or 0
                ) / 60
                for record in completed_records
            ]

            average_shift_hours = round(
                sum(completed_shift_hours)
                / len(completed_shift_hours),
                2
            )

        else:

            average_shift_hours = 0.0

        # ----------------------------------------------------
        # ATTENDANCE RATE
        #
        # IMPORTANT:
        # Use the actual analysis period as denominator.
        # This guarantees the result cannot exceed 100%.
        # ----------------------------------------------------

        analysis_days = days

        if analysis_days > 0:

            attendance_rate = round(
                (
                    days_present
                    / analysis_days
                ) * 100,
                2
            )

        else:

            attendance_rate = 0.0

        # Safety limit

        attendance_rate = max(
            0.0,
            min(
                attendance_rate,
                100.0
            )
        )

        # ----------------------------------------------------
        # LOW ATTENDANCE
        # ----------------------------------------------------

        if attendance_rate < 50:

            employees_with_low_attendance += 1

        # ----------------------------------------------------
        # AVERAGE CHECK-IN
        # ----------------------------------------------------

        average_check_in = _average_time(
            employee_records,
            "check_in"
        )

        # ----------------------------------------------------
        # AVERAGE CHECK-OUT
        # ----------------------------------------------------

        average_check_out = _average_time(
            employee_records,
            "check_out"
        )

        # ----------------------------------------------------
        # LATE ARRIVALS
        # ----------------------------------------------------

        (
            late_arrivals,
            average_late_minutes
        ) = _calculate_late_minutes(
            employee,
            employee_records
        )

        # ----------------------------------------------------
        # RESTAURANT
        # ----------------------------------------------------

        restaurant = None

        if employee.restaurant_id:

            restaurant = (
                db.query(Restaurant)
                .filter(
                    Restaurant.id
                    == employee.restaurant_id
                )
                .first()
            )

        restaurant_name = (
            restaurant.name
            if restaurant
            else "Unassigned"
        )

        # ----------------------------------------------------
        # EMPLOYEE RESULT
        # ----------------------------------------------------

        employee_result = {

            "employee_id":
                employee.employee_id,

            "first_name":
                employee.first_name,

            "last_name":
                employee.last_name,

            "role":
                employee.role,

            "restaurant":
                restaurant_name,

            "schedule_type":
                employee.schedule_type,

            "shift_start":
                normalize_time_string(
                    employee.shift_start
                ),

            "shift_end":
                normalize_time_string(
                    employee.shift_end
                ),

            "days_present":
                days_present,

            "total_worked_minutes":
                employee_worked_minutes,

            "total_worked_hours":
                employee_worked_hours,

            "average_shift_hours":
                average_shift_hours,

            "attendance_rate":
                attendance_rate,

            "average_check_in":
                average_check_in,

            "average_check_out":
                average_check_out,

            "late_arrivals":
                late_arrivals,

            "average_late_minutes":
                average_late_minutes,
        }

        employee_results.append(
            employee_result
        )

        # ----------------------------------------------------
        # ADAPTIVE ALERTS
        # ----------------------------------------------------

        employee_alerts = (
            _generate_employee_alerts(
                employee,
                employee_result
            )
        )

        adaptive_alerts.extend(
            employee_alerts
        )

    # ========================================================
    # TOTAL WORKED HOURS
    # ========================================================

    total_worked_hours = round(
        total_worked_minutes / 60,
        2
    )

    # ========================================================
    # AVERAGE SHIFT
    # ========================================================

    completed_employee_shifts = [
        employee["average_shift_hours"]
        for employee in employee_results
        if employee["average_shift_hours"] > 0
    ]

    if completed_employee_shifts:

        average_shift_hours = round(
            sum(completed_employee_shifts)
            / len(completed_employee_shifts),
            2
        )

    else:

        average_shift_hours = 0.0

    # ========================================================
    # AVERAGE ATTENDANCE
    # ========================================================

    if employee_results:

        average_attendance_rate = round(
            sum(
                employee["attendance_rate"]
                for employee in employee_results
            )
            / len(employee_results),
            2
        )

    else:

        average_attendance_rate = 0.0

    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {

        "total_employees":
            len(employees),

        "employees_with_attendance":
            employees_with_attendance,

        "total_attendance_records":
            total_attendance_records,

        "total_worked_minutes":
            total_worked_minutes,

        "total_worked_hours":
            total_worked_hours,

        "average_shift_hours":
            average_shift_hours,

        "average_attendance_rate":
            average_attendance_rate,

        "employees_with_low_attendance":
            employees_with_low_attendance,

        "employees":
            employee_results,

        "alerts":
            adaptive_alerts,
    }

# ============================================================
# DAILY ATTENDANCE TREND
# ============================================================

def get_attendance_trend(
    db: Session,
    days: int = 30
):
    """
    Process attendance history day by day.

    Returns:
    - attendance count
    - total worked hours
    - average worked hours
    - late arrivals

    for each day in the selected period.
    """

    now_riga = datetime.now(
        RIGA_TIMEZONE
    )

    today = now_riga.date()

    start_date = (
        today
        - timedelta(days=days - 1)
    )

    # --------------------------------------------------------
    # Get attendance records
    # --------------------------------------------------------

    records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= start_date,
            Attendance.work_date <= today
        )
        .all()
    )

    # --------------------------------------------------------
    # Get employees
    # --------------------------------------------------------

    employees = (
        db.query(Employee)
        .filter(
            Employee.is_active == True,
            Employee.role != "Manager"
        )
        .all()
    )

    employee_map = {
        employee.id: employee
        for employee in employees
    }

    trends = []

    # --------------------------------------------------------
    # Process each day
    # --------------------------------------------------------

    for day_offset in range(days):

        current_date = (
            start_date
            + timedelta(days=day_offset)
        )

        daily_records = [
            record
            for record in records
            if record.work_date == current_date
        ]

        attendance_count = len(
            daily_records
        )

        total_worked_minutes = sum(
            record.worked_minutes or 0
            for record in daily_records
        )

        total_worked_hours = round(
            total_worked_minutes / 60,
            2
        )

        if attendance_count > 0:

            average_worked_hours = round(
                total_worked_hours
                / attendance_count,
                2
            )

        else:

            average_worked_hours = 0.0

        # ----------------------------------------------------
        # Calculate daily late arrivals
        # ----------------------------------------------------

        daily_late_arrivals = 0

        for record in daily_records:

            employee = employee_map.get(
                record.employee_id
            )

            if employee is None:
                continue

            late_count, _ = (
                _calculate_late_minutes(
                    employee,
                    [record]
                )
            )

            daily_late_arrivals += (
                late_count
            )

        trends.append(
            {
                "date":
                    current_date.isoformat(),

                "attendance_count":
                    attendance_count,

                "total_worked_hours":
                    total_worked_hours,

                "average_worked_hours":
                    average_worked_hours,

                "late_arrivals":
                    daily_late_arrivals,
            }
        )

    return trends