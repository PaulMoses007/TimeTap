# TimeTap

Attendance management for restaurants (built for Chef Mezze). Employees check in and out with a QR code, a 15-second hold button, or a manual request that the manager approves later. Managers manage restaurants, employees and attendance from a website or from the mobile app.

| Part | Folder | Tech | Live |
| --- | --- | --- | --- |
| Manager website | `frontend/` | React 19, Vite, MUI | https://timetap-system.vercel.app |
| Mobile app (Android APK and mobile web) | `mobile/` | Expo, React Native, expo-router | https://timetap-mobile-chi.vercel.app |
| API | `backend/` | FastAPI, SQLAlchemy, JWT | https://timetap-backend.onrender.com/docs |
| Database | | PostgreSQL on Neon (SQLite for local work) | |

All three clients use the same API and database, so a change made in one shows up in the others.

## How attendance works

1. **Scan QR (main method).** The employee scans the restaurant's attendance QR code to check in and again to check out.
2. **Hold button.** The employee presses and holds a button for 15 seconds to check in, and again to check out.
3. **Manual request.** If the employee forgot or the phone was off, they send a request with a date, times and a reason. The manager approves or rejects it later, with a note. Approved requests become attendance records marked as manual.

Every record stores how it was made (`qr`, `button` or `manual`). The manager sees this next to each shift.

Employees join in one of two ways: the manager creates the account (approved at once), or the employee registers with the restaurant's invitation code and waits for the manager to approve.

The mobile app has no Reports section for managers; Reports are on the website.

## Run it locally (Windows PowerShell)

You need Python 3.11+ and Node 20+. If PowerShell blocks `npm`, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once.

**Backend**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=sqlite:///./local.db
SECRET_KEY=<a long random value>
```

Make the key with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Then:

```powershell
python -m uvicorn app.main:app --port 8000
```

Open http://localhost:8000/docs. Tables are created on first start.

**Website**

```powershell
cd frontend
npm install
```

Create `frontend/.env.local` with `BACKEND_URL=http://localhost:8000`, then `npm run dev` and open http://localhost:5173.

**Mobile app**

```powershell
cd mobile
npm install
```

Create `mobile/.env` with `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000`, then `npx expo start --web --clear` and open http://localhost:8081. The value is baked in when the bundle is built, so restart with `--clear` after changing it. Without `.env`, the app talks to the live backend.

Do not use another port for the mobile web app unless you add it to the CORS list (see below).

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | backend | Postgres URL (Neon) or `sqlite:///./local.db` |
| `SECRET_KEY` | backend | Signs login tokens. Required; the server will not start without it |
| `CORS_EXTRA_ORIGINS` | backend | Extra browser origins, comma separated. The localhost and Vercel origins are already allowed in `app/main.py` |
| `BACKEND_URL` | frontend (dev) | Where the Vite dev server proxies `/api` |
| `EXPO_PUBLIC_API_URL` | mobile | API address used by the app |

Never commit `.env` files. Use the Render and Vercel dashboards for real values.

## Deploy

- **Backend:** Render, from the `backend` folder, auto-deploys on push to `main`. Set `DATABASE_URL` and `SECRET_KEY` in Render's Environment tab. New columns are added automatically at startup (`app/core/migrations.py`). The free plan sleeps when idle, so the first request can take about a minute.
- **Website:** Vercel, `frontend` folder. `frontend/vercel.json` rewrites `/api/*` to the Render backend.
- **Mobile web:** Vercel, `mobile` folder (Expo web export).
- **Android APK:** `cd mobile`, then `eas build -p android --profile preview`. Keep `mobile/package-lock.json` as committed; a lockfile rewritten on Windows can break the EAS install step.

## Project layout

```
backend/   FastAPI app: routers/ (HTTP), services/ (rules), models/, schemas/, security/
frontend/  Manager website: pages/, services/ (API calls), utils/time.js
mobile/    Expo app: src/app/ (screens), src/lib/ (api, config, time, alert), src/components/
docs/      API.md (generated), SRS, database design, roadmap
```

## Checks

`backend/smoke_test.py` runs the whole flow against a temporary SQLite database (register manager, add restaurant and employee, check in and out, manual request and approval, delete rules):

```powershell
cd backend
$env:SECRET_KEY="test-key-test-key-test-key-test-key-1234"
$env:DATABASE_URL="sqlite:///./smoke.db"
pip install httpx
$env:PYTHONPATH="."; python smoke_test.py
```

## Known limits

- No GPS check yet. The stored `source` field is there so a location rule can be added later.
- The restaurant QR is static (`restaurant_id=N`), so a photo of it could be scanned from elsewhere. A rotating code or the GPS check would fix that.
- The website's employee page still has the old one-click check-in. Employees should use the mobile app.
