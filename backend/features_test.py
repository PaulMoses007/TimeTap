"""Checks for manager corrections, password reset, employee hours and login limits.

Run like smoke_test.py (SECRET_KEY and DATABASE_URL set, from the backend folder).
"""
import io
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import openpyxl
from fastapi.testclient import TestClient

from app.main import app
from app.security import login_limiter

c = TestClient(app)
RIGA = ZoneInfo("Europe/Riga")


def ok(r, code=200):
    assert r.status_code == code, (r.request.url, r.status_code, r.text[:300])
    return r.json() if r.content else None


def login(email, password):
    return c.post("/auth/login", json={"email": email, "password": password})


def auth(email, password="Passw0rd!x"):
    return {"Authorization": "Bearer " + ok(login(email, password))["access_token"]}


ok(c.post("/register/manager", json={"first_name": "Man", "last_name": "Ager", "email": "m@test.com", "phone": "+37120000001", "password": "Passw0rd!x"}))
H = auth("m@test.com")
rid = ok(c.post("/restaurants/", headers=H, json={"name": "Bistro", "address": "Riga", "phone": "+37120000002", "email": "b@test.com"}))["id"]
emp = ok(c.post("/employees/", headers=H, json={"first_name": "Em", "last_name": "Ployee", "email": "e@test.com", "phone": "+37120000003", "role": "Chef", "restaurant_id": rid, "password": "Passw0rd!x"}))
EH = auth("e@test.com")

# second manager with their own restaurant (must not touch the first one's staff)
ok(c.post("/register/manager", json={"first_name": "Oth", "last_name": "Er", "email": "o@test.com", "phone": "+37120000009", "password": "Passw0rd!x"}))
OH = auth("o@test.com")
ok(c.post("/restaurants/", headers=OH, json={"name": "Other", "address": "Riga", "phone": "+37120000008", "email": "o2@test.com"}))

# ---------------------------------------------------------- add a record
today = datetime.now(RIGA).date()
day = (today - timedelta(days=2)).isoformat()
rec = ok(c.post(f"/attendance/for-employee/{emp['id']}", headers=H, json={"check_in": f"{day}T09:00", "check_out": f"{day}T17:30", "note": "Forgot to scan"}))
assert rec["worked_minutes"] == 510 and rec["worked_hours"] == 8.5, rec
assert rec["source"] == "manual" and rec["check_out_source"] == "manual" and rec["edit_note"] == "Forgot to scan", rec
assert rec["work_date"] == day, rec
# stored as UTC: 09:00 Riga in winter/summer -> check it round-trips to the same local time
stored = datetime.fromisoformat(rec["check_in"]).replace(tzinfo=timezone.utc).astimezone(RIGA)
assert stored.strftime("%H:%M") == "09:00", stored

# ---------------------------------------------------------- edit it
upd = ok(c.put(f"/attendance/{rec['id']}", headers=H, json={"check_in": f"{day}T08:00", "check_out": f"{day}T16:00", "note": "Wrong times"}))
assert upd["worked_minutes"] == 480 and upd["edit_note"] == "Wrong times", upd

# ---------------------------------------------------------- rules
def bad(body, path=f"/attendance/for-employee/{emp['id']}", method="post", headers=H):
    r = getattr(c, method)(path, headers=headers, json=body)
    assert r.status_code == 400, (body, r.status_code, r.text)

bad({"check_in": f"{day}T08:00", "check_out": f"{day}T07:00", "note": "x1x"})                       # end before start
bad({"check_in": f"{day}T08:30", "check_out": f"{day}T12:00", "note": "overlap"})                    # overlaps edited record
bad({"check_in": f"{day}T05:00", "check_out": f"{day}T06:00", "note": ""})                           # no reason
bad({"check_in": f"{day}T05:00", "check_out": f"{(today + timedelta(days=3)).isoformat()}T06:00", "note": "far"})  # >24h / future
bad({"check_in": f"{(today + timedelta(days=1)).isoformat()}T05:00", "check_out": None, "note": "future"})        # future

# another manager cannot touch it; an employee cannot either
assert c.put(f"/attendance/{rec['id']}", headers=OH, json={"check_in": f"{day}T08:00", "check_out": f"{day}T16:00", "note": "hack"}).status_code == 404
assert c.put(f"/attendance/{rec['id']}", headers=EH, json={"check_in": f"{day}T08:00", "check_out": f"{day}T16:00", "note": "hack"}).status_code == 403
assert c.post(f"/attendance/for-employee/{emp['id']}", headers=OH, json={"check_in": f"{day}T01:00", "check_out": f"{day}T02:00", "note": "hack"}).status_code == 404
assert c.put("/attendance/99999", headers=H, json={"check_in": f"{day}T08:00", "check_out": f"{day}T16:00", "note": "nope"}).status_code == 404

# the manager list only holds the manager's own restaurant
assert any(a["id"] == rec["id"] for a in ok(c.get("/attendance/", headers=H)))
assert ok(c.get("/attendance/", headers=OH)) == []

# it shows up in the employee's history and the Excel export
hist = ok(c.get(f"/attendance/employee/{emp['id']}", headers=H))
assert any(h["id"] == rec["id"] and h["edit_note"] == "Wrong times" for h in hist)

# ---------------------------------------------------------- employee hours
summary = ok(c.get(f"/attendance/my-summary?on={day}", headers=EH))
assert summary["week"]["total_hours"] >= 8 and summary["month"]["days_worked"] >= 1, summary
export = c.get(f"/attendance/my-export?period=month&on={day}", headers=EH)
assert export.status_code == 200 and "spreadsheetml" in export.headers["content-type"]
wb = openpyxl.load_workbook(io.BytesIO(export.content))
rows = [r for r in wb["Summary"].iter_rows(min_row=7, values_only=True) if r[0]]
assert rows[0][0] == "Em Ployee" and len(rows) == 2, rows       # only themselves + TOTAL
assert c.get("/attendance/my-export?period=year", headers=EH).status_code == 400

# ---------------------------------------------------------- password reset
assert c.post(f"/employees/{emp['id']}/reset-password", headers=EH).status_code == 403
assert c.post(f"/employees/{emp['id']}/reset-password", headers=OH).status_code == 404
reset = ok(c.post(f"/employees/{emp['id']}/reset-password", headers=H))
temp = reset["temporary_password"]
assert len(temp) == 10 and reset["email"] == "e@test.com"
assert login("e@test.com", "Passw0rd!x").status_code == 401
ok(login("e@test.com", temp))
assert c.post(f"/employees/{rid}/reset-password", headers=H).status_code in (403, 404)

# ---------------------------------------------------------- login protection
login_limiter.reset_all()
for _ in range(5):
    assert login("e@test.com", "wrong-password").status_code == 401
blocked = login("e@test.com", temp)           # even the right password waits
assert blocked.status_code == 429 and "Try again in" in blocked.json()["detail"], blocked.text
assert login("m@test.com", "Passw0rd!x").status_code == 200   # other accounts unaffected
login_limiter.reset_all()
ok(login("e@test.com", temp))                 # a good login clears the counter
for _ in range(4):
    login("e@test.com", "wrong-password")
ok(login("e@test.com", temp))
for _ in range(4):
    assert login("e@test.com", "wrong-password").status_code == 401
ok(login("e@test.com", temp))

print("FEATURES OK")
