# TimeTap API Documentation

## Authentication

### Employee Registration

POST /api/v1/auth/register

Registers a new employee account.

---

### Employee Login

POST /api/v1/auth/login

Authenticates an employee.

---

### Employee Logout

POST /api/v1/auth/logout

Logs out the employee.

---

## Employee

### View Profile

GET /api/v1/employees/profile

---

### Update Profile

PUT /api/v1/employees/profile

---

### Attendance History

GET /api/v1/attendance/history

---

## Attendance

### Scan QR

POST /api/v1/attendance/check

Creates either a Check In or Check Out record.

---

## Manager

### Login

POST /api/v1/manager/login

---

### View Pending Employees

GET /api/v1/manager/pending

---

### Approve Employee

PUT /api/v1/manager/approve/{employee_id}

---

### Reject Employee

PUT /api/v1/manager/reject/{employee_id}

---

### View Attendance

GET /api/v1/manager/attendance

---

### Edit Attendance

PUT /api/v1/manager/attendance/{attendance_id}