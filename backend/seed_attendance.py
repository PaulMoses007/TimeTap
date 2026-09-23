from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.attendance import Attendance


# ============================================================
# SETTINGS
# ============================================================

RIGA_TIMEZONE = ZoneInfo("Europe/Riga")

# Number of previous days to generate
HISTORY_DAYS = 15


# ============================================================
# CONVERT RIGA LOCAL TIME TO NAIVE UTC
# ============================================================

def riga_to_utc_naive(
    work_date,
    hour,
    minute
):
    """
    Create a Riga-local datetime and convert it to
    naive UTC because SQLite stores our attendance
    timestamps as naive UTC values.
    """

    local_datetime = datetime(
        work_date.year,
        work_date.month,
        work_date.day,
        hour,
        minute,
        tzinfo=RIGA_TIMEZONE,
    )

    utc_datetime = local_datetime.astimezone(
        timezone.utc
    )

    return utc_datetime.replace(
        tzinfo=None
    )


# ============================================================
# CREATE ATTENDANCE RECORD
# ============================================================

def create_attendance(
    db,
    employee,
    work_date,
    check_in_hour,
    check_in_minute,
    check_out_hour,
    check_out_minute,
):
    """
    Create one attendance record if one does not
    already exist for this employee/date.
    """

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.work_date == work_date,
        )
        .first()
    )

    if existing:
        return False

    check_in = riga_to_utc_naive(
        work_date,
        check_in_hour,
        check_in_minute,
    )

    check_out = riga_to_utc_naive(
        work_date,
        check_out_hour,
        check_out_minute,
    )

    worked_minutes = int(
        (check_out - check_in).total_seconds()
        / 60
    )

    worked_hours = round(
        worked_minutes / 60,
        2
    )

    attendance = Attendance(
        employee_id=employee.id,
        work_date=work_date,
        check_in=check_in,
        check_out=check_out,
        worked_minutes=worked_minutes,
        worked_hours=worked_hours,
        status="Present",
    )

    db.add(attendance)

    return True


# ============================================================
# MAIN
# ============================================================

def main():

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Find our test employees
        # ----------------------------------------------------

        anna = (
            db.query(Employee)
            .filter(
                Employee.employee_id == "W001"
            )
            .first()
        )

        flexible = (
            db.query(Employee)
            .filter(
                Employee.employee_id == "W002"
            )
            .first()
        )

        fixed = (
            db.query(Employee)
            .filter(
                Employee.employee_id == "W003"
            )
            .first()
        )

        if not anna:
            print("ERROR: Employee W001 not found.")
            return

        if not flexible:
            print("ERROR: Employee W002 not found.")
            return

        if not fixed:
            print("ERROR: Employee W003 not found.")
            return

        print("=" * 60)
        print("TimeTap Attendance History Generator")
        print("=" * 60)

        print(
            f"Employees found:"
        )

        print(
            f"  W001: {anna.first_name} "
            f"{anna.last_name}"
        )

        print(
            f"  W002: {flexible.first_name} "
            f"{flexible.last_name}"
        )

        print(
            f"  W003: {fixed.first_name} "
            f"{fixed.last_name}"
        )

        print()

        today = datetime.now(
            RIGA_TIMEZONE
        ).date()

        created_count = 0

        # ====================================================
        # GENERATE PREVIOUS 15 DAYS
        # ====================================================

        for days_ago in range(
            HISTORY_DAYS,
            0,
            -1
        ):

            work_date = (
                today
                - timedelta(days=days_ago)
            )

            day_number = (
                HISTORY_DAYS
                - days_ago
                + 1
            )

            # =================================================
            # EMPLOYEE W001 - ANNA SILVA
            #
            # Flexible schedule
            # Good attendance
            # Variable working times
            # =================================================

            # Miss attendance on days 5, 10 and 14
            if day_number not in [5, 10, 14]:

                # Different check-in times
                anna_checkins = [
                    (10, 5),
                    (10, 20),
                    (9, 50),
                    (10, 35),
                    (9, 45),
                    (10, 10),
                    (10, 25),
                    (9, 55),
                    (10, 15),
                    (10, 40),
                    (9, 50),
                    (10, 30),
                ]

                index = (
                    (day_number - 1)
                    % len(anna_checkins)
                )

                check_in_hour, check_in_minute = (
                    anna_checkins[index]
                )

                create_attendance(
                    db,
                    anna,
                    work_date,
                    check_in_hour,
                    check_in_minute,
                    18,
                    0,
                )

                created_count += 1

            # =================================================
            # EMPLOYEE W002 - TEST FLEXIBLE
            #
            # Flexible schedule
            # Lower attendance
            # Variable check-in pattern
            # =================================================

            # Only attend on 6 of 15 days
            flexible_days = [
                1,
                3,
                6,
                9,
                12,
                15,
            ]

            if day_number in flexible_days:

                flexible_checkins = {
                    1: (12, 10),
                    3: (11, 45),
                    6: (13, 5),
                    9: (12, 30),
                    12: (11, 55),
                    15: (12, 20),
                }

                (
                    check_in_hour,
                    check_in_minute,
                ) = flexible_checkins[
                    day_number
                ]

                create_attendance(
                    db,
                    flexible,
                    work_date,
                    check_in_hour,
                    check_in_minute,
                    19,
                    0,
                )

                created_count += 1

            # =================================================
            # EMPLOYEE W003 - TEST FIXED
            #
            # Fixed schedule: 11:00 - 19:00
            #
            # Several late arrivals intentionally created
            # so the adaptive system can detect the pattern.
            # =================================================

            fixed_schedule = {
                1: (11, 0),
                2: (11, 20),   # late
                3: (11, 0),
                4: (11, 35),   # late
                5: (11, 10),   # late
                6: (11, 0),
                7: (11, 15),   # late
                8: (11, 0),
                9: (11, 25),   # late
                10: (11, 0),
                11: (11, 5),   # late
                12: (11, 0),
                13: (11, 30),  # late
                14: (11, 0),
                15: (11, 10),  # late
            }

            (
                check_in_hour,
                check_in_minute,
            ) = fixed_schedule[
                day_number
            ]

            create_attendance(
                db,
                fixed,
                work_date,
                check_in_hour,
                check_in_minute,
                19,
                0,
            )

            created_count += 1

        db.commit()

        print()
        print("=" * 60)
        print(
            f"Attendance records processed: "
            f"{created_count}"
        )
        print("=" * 60)

        print()
        print("Historical attendance generated successfully.")
        print()
        print("Existing attendance records were NOT deleted.")
        print("Today's Test Fixed attendance was preserved.")
        print()

    except Exception as error:

        db.rollback()

        print()
        print("ERROR:")
        print(error)

    finally:

        db.close()


if __name__ == "__main__":
    main()
