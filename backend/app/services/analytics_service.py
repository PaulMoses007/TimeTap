from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.restaurant import Restaurant

from app.schemas.analytics import (
    AnalyticsSummary,
    EmployeeAnalytics,
    AdaptiveAlert,
    AttendanceTrend,
    WorkforceInsight,
)


RIGA_TIMEZONE = ZoneInfo("Europe/Riga")


# ============================================================
# TIME HELPERS
# ============================================================

def to_riga_time(value):
    """
    Convert stored UTC-naive datetime to Europe/Riga time.

    Attendance records are stored as UTC-naive timestamps
    in SQLite.
    """

    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(RIGA_TIMEZONE)


def normalize_time_string(value):
    """
    Normalize schedule strings.

    Examples:
        11.00 -> 11:00
        19.30 -> 19:30
    """

    if not value:
        return None

    return value.strip().replace(".", ":")


def parse_shift_time(value):
    """
    Convert a shift time string to a time object.
    """

    value = normalize_time_string(value)

    if not value:
        return None

    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue

    return None


def _average_time(values):
    """
    Calculate average clock time.
    """

    if not values:
        return None

    total_seconds = 0

    for value in values:
        total_seconds += (
            value.hour * 3600
            + value.minute * 60
            + value.second
        )

    average_seconds = total_seconds / len(values)

    hours = int(average_seconds // 3600)
    minutes = int((average_seconds % 3600) // 60)

    return f"{hours:02d}:{minutes:02d}"


def _calculate_late_minutes(employee, check_in):
    """
    Calculate lateness only for employees with a fixed schedule.
    """

    if not employee:
        return 0

    if employee.schedule_type != "Fixed":
        return 0

    shift_start = parse_shift_time(employee.shift_start)

    if shift_start is None:
        return 0

    local_check_in = to_riga_time(check_in)

    if local_check_in is None:
        return 0

    scheduled_minutes = (
        shift_start.hour * 60
        + shift_start.minute
    )

    actual_minutes = (
        local_check_in.hour * 60
        + local_check_in.minute
    )

    late_minutes = actual_minutes - scheduled_minutes

    return max(late_minutes, 0)


# ============================================================
# EMPLOYEE ALERTS
# ============================================================

def _generate_employee_alerts(
    employee,
    days_present,
    attendance_rate,
    average_shift_hours,
    late_arrivals,
    average_late_minutes,
    average_check_in,
):
    """
    Generate adaptive employee-level alerts.
    """

    alerts = []

    # --------------------------------------------------------
    # LOW ATTENDANCE
    # --------------------------------------------------------

    if attendance_rate < 50:
        alerts.append(
            AdaptiveAlert(
                employee_id=employee.employee_id,
                employee_name=(
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                alert_type="Low Attendance",
                severity="error",
                message=(
                    f"Attendance rate is {attendance_rate:.1f}%. "
                    "This is below the 50% monitoring threshold."
                ),
            )
        )

    # --------------------------------------------------------
    # REPEATED LATENESS
    # --------------------------------------------------------

    if (
        employee.schedule_type == "Fixed"
        and late_arrivals >= 2
    ):
        alerts.append(
            AdaptiveAlert(
                employee_id=employee.employee_id,
                employee_name=(
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                alert_type="Repeated Lateness",
                severity="warning",
                message=(
                    f"{late_arrivals} late arrivals detected. "
                    f"Average lateness is "
                    f"{average_late_minutes:.1f} minutes."
                ),
            )
        )

    # --------------------------------------------------------
    # SHORT SHIFTS
    # --------------------------------------------------------

    if (
        days_present >= 2
        and average_shift_hours < 4
    ):
        alerts.append(
            AdaptiveAlert(
                employee_id=employee.employee_id,
                employee_name=(
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                alert_type="Short Shifts",
                severity="warning",
                message=(
                    f"Average shift duration is "
                    f"{average_shift_hours:.2f} hours."
                ),
            )
        )

    # --------------------------------------------------------
    # FLEXIBLE ATTENDANCE PATTERN
    # --------------------------------------------------------

    if (
        employee.schedule_type == "Flexible"
        and days_present >= 2
        and average_check_in
    ):
        alerts.append(
            AdaptiveAlert(
                employee_id=employee.employee_id,
                employee_name=(
                    f"{employee.first_name} "
                    f"{employee.last_name}"
                ),
                alert_type="Attendance Pattern",
                severity="info",
                message=(
                    f"Flexible schedule employee has an "
                    f"average check-in time of "
                    f"{average_check_in}."
                ),
            )
        )

    return alerts


# ============================================================
# ATTENDANCE ANALYTICS
# ============================================================

def get_attendance_analytics(
    db: Session,
    days: int = 30,
):
    """
    Generate employee attendance analytics for
    the requested number of previous days.
    """

    current_date = datetime.now(
        RIGA_TIMEZONE
    ).date()

    start_date = current_date - timedelta(
        days=days - 1
    )

    employees = (
        db.query(Employee)
        .filter(
            Employee.is_active == True,
            Employee.role != "Manager",
        )
        .all()
    )

    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= start_date,
            Attendance.work_date <= current_date,
        )
        .all()
    )

    attendance_by_employee = {}

    for record in attendance_records:
        attendance_by_employee.setdefault(
            record.employee_id,
            []
        ).append(record)

    employee_analytics = []
    all_alerts = []

    total_attendance_records = len(
        attendance_records
    )

    total_worked_minutes = sum(
        record.worked_minutes or 0
        for record in attendance_records
    )

    employees_with_attendance = 0

    for employee in employees:

        records = attendance_by_employee.get(
            employee.id,
            []
        )

        if records:
            employees_with_attendance += 1

        days_present = len(records)

        worked_minutes = sum(
            record.worked_minutes or 0
            for record in records
        )

        worked_hours = worked_minutes / 60

        average_shift_hours = (
            worked_hours / days_present
            if days_present > 0
            else 0
        )

        attendance_rate = (
            (days_present / days) * 100
            if days > 0
            else 0
        )

        attendance_rate = min(
            max(attendance_rate, 0),
            100
        )

        check_in_times = []
        check_out_times = []

        late_arrivals = 0
        total_late_minutes = 0

        for record in records:

            local_check_in = to_riga_time(
                record.check_in
            )

            local_check_out = to_riga_time(
                record.check_out
            )

            if local_check_in:
                check_in_times.append(
                    local_check_in.time()
                )

            if local_check_out:
                check_out_times.append(
                    local_check_out.time()
                )

            late_minutes = _calculate_late_minutes(
                employee,
                record.check_in,
            )

            if late_minutes > 0:
                late_arrivals += 1
                total_late_minutes += late_minutes

        average_check_in = _average_time(
            check_in_times
        )

        average_check_out = _average_time(
            check_out_times
        )

        average_late_minutes = (
            total_late_minutes / late_arrivals
            if late_arrivals > 0
            else 0
        )

        restaurant_name = "Not assigned"

        if employee.restaurant_id:

            restaurant = (
                db.query(Restaurant)
                .filter(
                    Restaurant.id == employee.restaurant_id
                )
                .first()
            )

            if restaurant:
                restaurant_name = restaurant.name

        alerts = _generate_employee_alerts(
            employee=employee,
            days_present=days_present,
            attendance_rate=attendance_rate,
            average_shift_hours=average_shift_hours,
            late_arrivals=late_arrivals,
            average_late_minutes=average_late_minutes,
            average_check_in=average_check_in,
        )

        all_alerts.extend(alerts)

        employee_analytics.append(
            EmployeeAnalytics(
                employee_id=employee.employee_id,
                first_name=employee.first_name,
                last_name=employee.last_name,
                role=employee.role,
                restaurant=restaurant_name,

                schedule_type=(
                    employee.schedule_type
                    or "Flexible"
                ),

                shift_start=employee.shift_start,
                shift_end=employee.shift_end,

                days_present=days_present,

                total_worked_minutes=worked_minutes,

                total_worked_hours=round(
                    worked_hours,
                    2,
                ),

                average_shift_hours=round(
                    average_shift_hours,
                    2,
                ),

                attendance_rate=round(
                    attendance_rate,
                    2,
                ),

                average_check_in=average_check_in,
                average_check_out=average_check_out,

                late_arrivals=late_arrivals,

                average_late_minutes=round(
                    average_late_minutes,
                    2,
                ),
            )
        )

    total_worked_hours = (
        total_worked_minutes / 60
    )

    average_shift_hours = (
        total_worked_hours / total_attendance_records
        if total_attendance_records > 0
        else 0
    )

    average_attendance_rate = (
        sum(
            employee.attendance_rate
            for employee in employee_analytics
        )
        / len(employee_analytics)
        if employee_analytics
        else 0
    )

    employees_with_low_attendance = sum(
        1
        for employee in employee_analytics
        if employee.attendance_rate < 50
    )

    return AnalyticsSummary(
        total_employees=len(employees),

        employees_with_attendance=(
            employees_with_attendance
        ),

        total_attendance_records=(
            total_attendance_records
        ),

        total_worked_minutes=(
            total_worked_minutes
        ),

        total_worked_hours=round(
            total_worked_hours,
            2,
        ),

        average_shift_hours=round(
            average_shift_hours,
            2,
        ),

        average_attendance_rate=round(
            average_attendance_rate,
            2,
        ),

        employees_with_low_attendance=(
            employees_with_low_attendance
        ),

        employees=employee_analytics,

        alerts=all_alerts,
    )


# ============================================================
# ATTENDANCE TREND
# ============================================================

def get_attendance_trend(
    db: Session,
    days: int = 30,
):
    """
    Generate daily attendance trends.
    """

    current_date = datetime.now(
        RIGA_TIMEZONE
    ).date()

    start_date = current_date - timedelta(
        days=days - 1
    )

    attendance_records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= start_date,
            Attendance.work_date <= current_date,
        )
        .all()
    )

    trends = []

    for day_offset in range(days):

        trend_date = (
            start_date
            + timedelta(days=day_offset)
        )

        daily_records = [
            record
            for record in attendance_records
            if record.work_date == trend_date
        ]

        attendance_count = len(
            daily_records
        )

        total_worked_minutes = sum(
            record.worked_minutes or 0
            for record in daily_records
        )

        total_worked_hours = (
            total_worked_minutes / 60
        )

        average_worked_hours = (
            total_worked_hours / attendance_count
            if attendance_count > 0
            else 0
        )

        daily_late_arrivals = 0

        for record in daily_records:

            employee = (
                db.query(Employee)
                .filter(
                    Employee.id == record.employee_id
                )
                .first()
            )

            if employee:

                late_minutes = (
                    _calculate_late_minutes(
                        employee,
                        record.check_in,
                    )
                )

                if late_minutes > 0:
                    daily_late_arrivals += 1

        trends.append(
            AttendanceTrend(
                date=trend_date.isoformat(),

                attendance_count=(
                    attendance_count
                ),

                total_worked_hours=round(
                    total_worked_hours,
                    2,
                ),

                average_worked_hours=round(
                    average_worked_hours,
                    2,
                ),

                late_arrivals=(
                    daily_late_arrivals
                ),
            )
        )

    return trends


# ============================================================
# WORKFORCE ADAPTIVE INSIGHTS
# ============================================================

def get_workforce_insights(
    db: Session,
    days: int = 14,
):
    """
    Compare recent workforce activity against
    the previous period.

    Percentage comparisons are only generated when
    the previous period has enough baseline data.
    """

    current_date = datetime.now(
        RIGA_TIMEZONE
    ).date()

    # --------------------------------------------------------
    # PERIOD DEFINITIONS
    # --------------------------------------------------------

    recent_start = (
        current_date
        - timedelta(days=days - 1)
    )

    previous_end = (
        recent_start
        - timedelta(days=1)
    )

    previous_start = (
        previous_end
        - timedelta(days=days - 1)
    )

    # --------------------------------------------------------
    # GET RECENT RECORDS
    # --------------------------------------------------------

    recent_records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= recent_start,
            Attendance.work_date <= current_date,
        )
        .all()
    )

    # --------------------------------------------------------
    # GET PREVIOUS RECORDS
    # --------------------------------------------------------

    previous_records = (
        db.query(Attendance)
        .filter(
            Attendance.work_date >= previous_start,
            Attendance.work_date <= previous_end,
        )
        .all()
    )

    # --------------------------------------------------------
    # RECENT ATTENDANCE
    # --------------------------------------------------------

    recent_attendance = len(
        recent_records
    )

    # --------------------------------------------------------
    # RECENT WORKED HOURS
    # --------------------------------------------------------

    recent_worked_hours = (
        sum(
            record.worked_minutes or 0
            for record in recent_records
        )
        / 60
    )

    # --------------------------------------------------------
    # RECENT LATENESS
    # --------------------------------------------------------

    recent_late_arrivals = 0

    for record in recent_records:

        employee = (
            db.query(Employee)
            .filter(
                Employee.id == record.employee_id
            )
            .first()
        )

        if employee:

            late_minutes = (
                _calculate_late_minutes(
                    employee,
                    record.check_in,
                )
            )

            if late_minutes > 0:
                recent_late_arrivals += 1

    # --------------------------------------------------------
    # PREVIOUS ATTENDANCE
    # --------------------------------------------------------

    previous_attendance = len(
        previous_records
    )

    # --------------------------------------------------------
    # PREVIOUS WORKED HOURS
    # --------------------------------------------------------

    previous_worked_hours = (
        sum(
            record.worked_minutes or 0
            for record in previous_records
        )
        / 60
    )

    # --------------------------------------------------------
    # PREVIOUS LATENESS
    # --------------------------------------------------------

    previous_late_arrivals = 0

    for record in previous_records:

        employee = (
            db.query(Employee)
            .filter(
                Employee.id == record.employee_id
            )
            .first()
        )

        if employee:

            late_minutes = (
                _calculate_late_minutes(
                    employee,
                    record.check_in,
                )
            )

            if late_minutes > 0:
                previous_late_arrivals += 1

    insights = []

    # ========================================================
    # ATTENDANCE COMPARISON
    # ========================================================

    # Require more than 5 previous attendance records.
    #
    # This prevents very small historical datasets from
    # producing misleading percentage changes.

    if previous_attendance <= 5:

        insights.append(
            WorkforceInsight(
                insight_type="Attendance Baseline",
                severity="info",
                title="Attendance baseline is limited",
                message=(
                    f"{recent_attendance} attendance records "
                    f"were recorded during the recent "
                    f"{days}-day period. "
                    "The previous period has too little "
                    "attendance data for a reliable "
                    "percentage comparison."
                ),
                metric=float(
                    recent_attendance
                ),
            )
        )

    else:

        recent_daily_average = (
            recent_attendance / days
        )

        previous_daily_average = (
            previous_attendance / days
        )

        if previous_daily_average > 0:

            attendance_change = (
                (
                    recent_daily_average
                    - previous_daily_average
                )
                / previous_daily_average
            ) * 100

            if abs(attendance_change) >= 5:

                if attendance_change > 0:

                    insights.append(
                        WorkforceInsight(
                            insight_type=(
                                "Attendance Increase"
                            ),
                            severity="info",
                            title=(
                                "Attendance activity increased"
                            ),
                            message=(
                                "Daily attendance activity "
                                f"increased by "
                                f"{attendance_change:.2f}% "
                                "compared with the previous "
                                f"{days}-day period."
                            ),
                            metric=round(
                                attendance_change,
                                2,
                            ),
                        )
                    )

                else:

                    insights.append(
                        WorkforceInsight(
                            insight_type=(
                                "Attendance Decrease"
                            ),
                            severity="warning",
                            title=(
                                "Attendance activity decreased"
                            ),
                            message=(
                                "Daily attendance activity "
                                f"decreased by "
                                f"{abs(attendance_change):.2f}% "
                                "compared with the previous "
                                f"{days}-day period."
                            ),
                            metric=round(
                                attendance_change,
                                2,
                            ),
                        )
                    )

            else:
                insights.append(
                    WorkforceInsight(
                        insight_type="Attendance Stable",
                        severity="info",
                        title="Attendance activity is stable",
                        message=(
                            "Daily attendance activity changed by only "
                            f"{abs(attendance_change):.2f}% compared with the "
                            f"previous {days}-day period."
                        ),
                        metric=round(attendance_change, 2),
                    )
                )

    # ========================================================
    # WORKED HOURS COMPARISON
    # ========================================================

    # Require at least 20 previous worked hours.
    #
    # This prevents a small historical baseline from producing
    # extremely large and misleading percentage changes.

    if previous_attendance <= 5 or previous_worked_hours < 20:

        insights.append(
            WorkforceInsight(
                insight_type="Worked Hours Baseline",
                severity="info",
                title="Worked-hours baseline is limited",
                message=(
                    f"{recent_worked_hours:.2f} worked hours "
                    "were recorded during the recent "
                    f"{days}-day period. "
                    "The previous period has too little "
                    "worked-hours data for a reliable "
                    "percentage comparison."
                ),
                metric=round(
                    recent_worked_hours,
                    2,
                ),
            )
        )

    else:

        recent_daily_hours = (
            recent_worked_hours / days
        )

        previous_daily_hours = (
            previous_worked_hours / days
        )

        if previous_daily_hours > 0:

            worked_hours_change = (
                (
                    recent_daily_hours
                    - previous_daily_hours
                )
                / previous_daily_hours
            ) * 100

            if abs(worked_hours_change) >= 20:

                if worked_hours_change > 0:

                    insights.append(
                        WorkforceInsight(
                            insight_type=(
                                "Worked Hours Increase"
                            ),
                            severity="info",
                            title=(
                                "Worked hours increased"
                            ),
                            message=(
                                "Daily worked hours "
                                f"increased by "
                                f"{worked_hours_change:.2f}% "
                                "compared with the previous "
                                "period."
                            ),
                            metric=round(
                                worked_hours_change,
                                2,
                            ),
                        )
                    )

                else:

                    insights.append(
                        WorkforceInsight(
                            insight_type=(
                                "Worked Hours Decrease"
                            ),
                            severity="warning",
                            title=(
                                "Worked hours decreased"
                            ),
                            message=(
                                "Daily worked hours "
                                f"decreased by "
                                f"{abs(worked_hours_change):.2f}% "
                                "compared with the previous "
                                "period."
                            ),
                            metric=round(
                                worked_hours_change,
                                2,
                            ),
                        )
                    )

    # ========================================================
    # LATENESS COMPARISON
    # ========================================================

    # Require at least 2 previous late arrivals.
    #
    # If there is no meaningful previous baseline, report the
    # recent late arrivals without calculating a percentage.

    if previous_late_arrivals < 2:

        if recent_late_arrivals > 0:

            insights.append(
                WorkforceInsight(
                    insight_type="Lateness Baseline",
                    severity="warning",
                    title="Late arrivals detected",
                    message=(
                        f"{recent_late_arrivals} late arrivals "
                        f"were recorded during the recent "
                        f"{days}-day period. "
                        "The previous period has no "
                        "late-arrival baseline."
                    ),
                    metric=float(
                        recent_late_arrivals
                    ),
                )
            )

    else:

        lateness_change = (
            (
                recent_late_arrivals
                - previous_late_arrivals
            )
            / previous_late_arrivals
        ) * 100

        if abs(lateness_change) >= 20:

            if lateness_change > 0:

                insights.append(
                    WorkforceInsight(
                        insight_type=(
                            "Lateness Increase"
                        ),
                        severity="warning",
                        title="Late arrivals increased",
                        message=(
                            "Late arrivals increased by "
                            f"{lateness_change:.2f}% "
                            "compared with the previous "
                            "period."
                        ),
                        metric=round(
                            lateness_change,
                            2,
                        ),
                    )
                )

            else:

                insights.append(
                    WorkforceInsight(
                        insight_type=(
                            "Lateness Decrease"
                        ),
                        severity="info",
                        title="Late arrivals decreased",
                        message=(
                            "Late arrivals decreased by "
                            f"{abs(lateness_change):.2f}% "
                            "compared with the previous "
                            "period."
                        ),
                        metric=round(
                            lateness_change,
                            2,
                        ),
                    )
                )

    return insights