# TimeTap API

Generated from the running FastAPI app (`app.openapi()`). The live, interactive version is at `/docs` on the backend (for example https://timetap-backend.onrender.com/docs).

- Base URL: the backend root, with **no** `/api/v1` prefix. The website reaches it through the `/api` rewrite in `frontend/vercel.json`.
- Authentication: `POST /auth/login` returns a bearer token. Send it as `Authorization: Bearer <token>`. Tokens last 60 minutes.
- Times are stored as UTC and returned without a trailing `Z`. Clients parse them as UTC and show Europe/Riga time.
- Roles: `Manager` and `Employee`. Manager-only endpoints return 403 for employees.

## Authentication

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/auth/login` | Login |

## Employees

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/employees/` | Get All Employees |
| POST | `/employees/` | Create Employee |
| GET | `/employees/pending` | Get Pending Employees |
| PUT | `/employees/{employee_id}/approve` | Approve Employee |
| PUT | `/employees/{employee_id}/reject` | Reject Employee |
| GET | `/employees/me` | Get Current Employee |
| PUT | `/employees/me/profile` | Update My Profile |
| PUT | `/employees/me/password` | Change My Password |
| GET | `/employees/{employee_id}` | Get Employee |
| PUT | `/employees/{employee_id}` | Update Employee |
| DELETE | `/employees/{employee_id}` | Delete Employee |

## Attendance

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/attendance/today` | Get Today Attendance |
| GET | `/attendance/weekly` | Get Weekly Attendance |
| GET | `/attendance/monthly` | Get Monthly Attendance |
| POST | `/attendance/check-in` | Employee Check In |
| POST | `/attendance/check-out` | Employee Check Out |
| GET | `/attendance/my` | My Attendance History |
| GET | `/attendance/` | Attendance History |
| GET | `/attendance/employee/{employee_id}` | Employee Attendance History |

## Manual Attendance

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/attendance/manual-requests/` | Create Manual Request |
| GET | `/attendance/manual-requests/` | List Manual Requests |
| GET | `/attendance/manual-requests/my` | My Manual Requests |
| PUT | `/attendance/manual-requests/{request_id}/approve` | Approve Manual Request |
| PUT | `/attendance/manual-requests/{request_id}/reject` | Reject Manual Request |

## Restaurants

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/restaurants/` | Get All Restaurants |
| POST | `/restaurants/` | Create Restaurant |
| GET | `/restaurants/{restaurant_id}` | Get Restaurant |
| PUT | `/restaurants/{restaurant_id}` | Update Restaurant |
| DELETE | `/restaurants/{restaurant_id}` | Delete Restaurant |
| GET | `/restaurants/{restaurant_id}/employees` | Get Restaurant Employees |
| GET | `/restaurants/{restaurant_id}/qr` | Get Restaurant Qr |

## Reports

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/reports/attendance` | Attendance Report |

## Registration

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/register/` | Register Employee |
| POST | `/register/manager` | Register Manager |

## Dashboard

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/dashboard/` | Dashboard |

## Analytics

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/analytics/attendance` | Attendance Analytics |
| GET | `/analytics/attendance-trend` | Attendance Trend |
| GET | `/analytics/workforce-insights` | Workforce Insights |

## Other

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/` | Root |
| GET | `/health` | Health |
