# Database Design

## Project

**TimeTap – Attendance Management System for Chef Mezze**

---

# Database Overview

Version: **1.0**

The TimeTap database is designed to manage employee registration, manager authentication, and attendance tracking for Chef Mezze Restaurant.

---

# Table 1 - Employees

Stores all employee accounts.

| Column | Type | Description |
|---------|------|-------------|
| employee_id | Integer (PK) | Unique employee ID |
| employee_code | String | Unique code (EMP001, EMP002...) |
| first_name | String | Employee first name |
| last_name | String | Employee last name |
| mobile_number | String | Login mobile number |
| email | String | Optional email |
| password_hash | String | Encrypted password |
| position | String | Waiter, Chef, Cashier, Manager, etc. |
| approval_status | Enum | Pending, Approved, Rejected |
| is_active | Boolean | Active / Disabled |
| created_at | Timestamp | Registration time |
| updated_at | Timestamp | Last update time |

---

# Table 2 - Managers

Stores manager accounts.

| Column | Type | Description |
|---------|------|-------------|
| manager_id | Integer (PK) | Unique manager ID |
| first_name | String | Manager first name |
| last_name | String | Manager last name |
| mobile_number | String | Login mobile number |
| email | String | Email address |
| password_hash | String | Encrypted password |
| created_at | Timestamp | Account creation date |
| updated_at | Timestamp | Last update |

---

# Table 3 - Attendance

Stores employee attendance records.

| Column | Type | Description |
|---------|------|-------------|
| attendance_id | Integer (PK) | Unique attendance record |
| employee_id | Integer (FK) | Employee reference |
| attendance_date | Date | Attendance date |
| check_in | Timestamp | Check-in time |
| check_out | Timestamp | Check-out time |
| total_hours | Decimal | Calculated working hours |
| attendance_status | Enum | Present, Late, Half Day, Absent |
| created_at | Timestamp | Record creation time |
| updated_at | Timestamp | Last update |

---

# Relationships

Employees (1)

↓

Attendance (Many)

One employee can have many attendance records.

Managers manage:

- Employee approvals
- Attendance records
- Reports

---

# Approval Workflow

Employee Registers

↓

approval_status = Pending

↓

Manager Reviews

↓

Approved

↓

Employee Can Login

OR

Rejected

↓

Employee Cannot Login

---

# Attendance Workflow

Employee Login

↓

Scan Chef Mezze QR

↓

Confirm Attendance

↓

System Checks

Already Checked In?

↓

No → Save Check In

Yes

↓

Already Checked Out?

↓

No → Save Check Out

Yes

↓

Show

"Attendance already completed."

---

# Future Database Expansion

The following tables may be added in future versions:

- Shift Schedule
- Payroll
- Notifications
- Leave Requests
- Audit Logs
- Restaurant Settings

---

# Database Version

Version 1.0