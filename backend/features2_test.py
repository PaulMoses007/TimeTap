"""Checks for leave requests, the weekly roster and dashboard alerts."""
import io
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import openpyxl
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
RIGA = ZoneInfo("Europe/Riga")
now = datetime.now(RIGA)
today = now.date()


def ok(r, code=200):
    assert r.status_code == code, (r.request.method, r.request.url, r.status_code, r.text[:300])
    return r.json() if r.content else None


def auth(email, password="Passw0rd!x"):
    r = c.post("/auth/login", json={"email": email, "password": password})
    return {"Authorization": "Bearer " + ok(r)["access_token"]}


def register_manager(email, restaurant):
    ok(c.post("/register/manager", json={"first_name": "M", "last_name": restaurant, "email": email, "phone": "+37120000001", "password": "Passw0rd!x"}))
    h = auth(email)
    rid = ok(c.post("/restaurants/", headers=h, json={"name": restaurant, "address": "Riga", "phone": "+37120000002", "email": restaurant.lower() + "@t.com"}))["id"]
    return h, rid


def add_employee(h, rid, email, name, **extra):
    body = {"first_name": name, "last_name": "Test", "email": email, "phone": "+37120000003", "role": "Waiter", "restaurant_id": rid, "password": "Passw0rd!x"}
    body.update(extra)
    return ok(c.post("/employees/", headers=h, json=body))


H, rid = register_manager("m@test.com", "Bistro")
OH, _ = register_manager("o@test.com", "Other")
ann = add_employee(H, rid, "ann@test.com", "Ann")
bob = add_employee(H, rid, "bob@test.com", "Bob")
AH, BH = auth("ann@test.com"), auth("bob@test.com")

d = lambda n: (today + timedelta(days=n)).isoformat()

# ============================================================ LEAVE
def ask(body, headers=AH):
    return c.post("/leave/", headers=headers, json=body)

leave = ok(ask({"leave_type": "Vacation", "start_date": d(3), "end_date": d(5), "reason": "Trip"}))
assert leave["status"] == "Pending" and leave["days"] == 3 and leave["employee_name"] == "Ann Test", leave

assert ask({"leave_type": "Vacation", "start_date": d(5), "end_date": d(6)}).status_code == 400      # overlaps
assert ask({"leave_type": "Sick", "start_date": d(9), "end_date": d(8)}).status_code == 422          # backwards
assert ask({"leave_type": "Sick", "start_date": d(-30), "end_date": d(-29)}).status_code == 400      # too old
assert ask({"leave_type": "Sick", "start_date": d(10), "end_date": d(100)}).status_code == 400       # too long
assert ask({"leave_type": "Holiday", "start_date": d(10), "end_date": d(10)}).status_code == 422     # unknown type
assert ask({"leave_type": "Day off", "start_date": d(10), "end_date": d(10)}, headers=H).status_code == 403  # manager

assert [x["id"] for x in ok(c.get("/leave/my", headers=AH))] == [leave["id"]]
assert ok(c.get("/leave/my", headers=BH)) == []
assert [x["id"] for x in ok(c.get("/leave/?status=Pending", headers=H))] == [leave["id"]]
assert ok(c.get("/leave/", headers=OH)) == []
assert c.get("/leave/", headers=AH).status_code == 403

# only the right manager can answer
assert c.put(f"/leave/{leave['id']}/approve", headers=OH).status_code == 404
assert c.put(f"/leave/{leave['id']}/approve", headers=AH).status_code == 403
approved = ok(c.put(f"/leave/{leave['id']}/approve", headers=H, json={"note": "Enjoy"}))
assert approved["status"] == "Approved" and approved["review_note"] == "Enjoy"
assert c.put(f"/leave/{leave['id']}/approve", headers=H).status_code == 400          # already answered
assert c.delete(f"/leave/{leave['id']}", headers=AH).status_code == 400               # approved: cannot withdraw
assert c.delete(f"/leave/{leave['id']}", headers=BH).status_code == 404               # not Bob's

# withdraw a pending one
second = ok(ask({"leave_type": "Sick", "start_date": d(20), "end_date": d(20)}))
ok(c.delete(f"/leave/{second['id']}", headers=AH))
assert [x["id"] for x in ok(c.get("/leave/my", headers=AH))] == [leave["id"]]

# reject a pending one, and revoke an approved one
third = ok(ask({"leave_type": "Other", "start_date": d(30), "end_date": d(31)}, headers=BH))
assert ok(c.put(f"/leave/{third['id']}/reject", headers=H, json={"note": "Busy week"}))["status"] == "Rejected"
assert c.put(f"/leave/{third['id']}/reject", headers=H).status_code == 400

# ============================================================ ROSTER
week = (today - timedelta(days=today.weekday())).isoformat()
next_week = (today - timedelta(days=today.weekday()) + timedelta(days=7)).isoformat()


def shift(emp, day, start, end, headers=H):
    return c.put("/roster/shift", headers=headers, json={"employee_id": emp["id"], "work_date": day, "start_time": start, "end_time": end})


s1 = ok(shift(bob, d(0), "9:00", "17:00"))
assert (s1["start_time"], s1["end_time"]) == ("09:00", "17:00"), s1
s1b = ok(shift(bob, d(0), "10:00", "18:00"))               # same day again: updates, no duplicate
assert s1b["id"] == s1["id"] and s1b["start_time"] == "10:00"

assert shift(bob, d(0), "25:00", "17:00").status_code == 400
assert shift(bob, d(0), "09:00", "09:00").status_code == 400
assert shift(ann, d(4), "09:00", "17:00").status_code == 400      # Ann is on approved leave then
assert shift(bob, d(0), "09:00", "17:00", headers=OH).status_code == 404     # other manager's restaurant
assert shift(bob, d(0), "09:00", "17:00", headers=AH).status_code == 403

night = ok(shift(bob, d(1), "18:00", "02:00"))             # overnight is allowed
assert night["end_time"] == "02:00"

view = ok(c.get(f"/roster/?week_start={week}", headers=H))
assert view["week_start"] == week and len(view["employees"]) == 2
assert any(s["employee_id"] == bob["id"] and s["work_date"] == d(0) for s in view["shifts"])
other_view = ok(c.get("/roster/", headers=OH))
assert other_view["employees"] == [] and other_view["shifts"] == []

# Ann's approved leave shows up in the week of d(4)
view4 = ok(c.get(f"/roster/?week_start={d(4)}", headers=H))
assert any(x["employee_id"] == ann["id"] and x["work_date"] == d(4) for x in view4["leave"]), view4["leave"]

# copy this week to next week
copied = ok(c.post("/roster/copy-week", headers=H, json={"from_week_start": week, "to_week_start": next_week}))
assert copied["copied"] >= 1, copied
again = ok(c.post("/roster/copy-week", headers=H, json={"from_week_start": week, "to_week_start": next_week}))
assert again["copied"] == 0 and again["skipped"] >= 1, again      # nothing doubled
assert c.post("/roster/copy-week", headers=H, json={"from_week_start": week, "to_week_start": week}).status_code == 400

mine = ok(c.get("/roster/my", headers=BH))
assert len(mine) >= 2 and mine == sorted(mine, key=lambda s: s["work_date"])
assert ok(c.get("/roster/my", headers=AH)) == []

assert c.delete(f"/roster/shift/{night['id']}", headers=OH).status_code == 404
ok(c.delete(f"/roster/shift/{night['id']}", headers=H))
assert c.delete(f"/roster/shift/{night['id']}", headers=H).status_code == 404

# ============================================================ DASHBOARD + ALERTS
before = ok(c.get("/dashboard/", headers=H))
assert before["on_leave_today"] == 0 and before["absent_today"] == 2, before

ok(c.put(f"/employees/{ann['id']}", headers=H, json={**{k: ann[k] for k in ("first_name", "last_name", "email", "phone", "role")},
   "is_active": True, "restaurant_id": rid, "schedule_type": "Fixed", "shift_start": "00:00", "shift_end": "23:00"}))

alerts = ok(c.get("/dashboard/alerts", headers=H))["items"]
titles = [a["title"] for a in alerts]
print("alerts now:", titles)

minutes_since_midnight = now.hour * 60 + now.minute
# Bob has shifts this week, so the roster rules (not fixed schedules) apply
assert not any("Ann" in t and "checked in" in t for t in titles), titles    # roster in use -> Ann has no shift today
assert any("leave request" in t for t in titles) is False                   # none pending now

# a forgotten check-out from two days ago
ok(c.post(f"/attendance/for-employee/{bob['id']}", headers=H, json={"check_in": f"{d(-2)}T08:00", "check_out": None, "note": "test"}))
alerts = ok(c.get("/dashboard/alerts", headers=H))["items"]
assert any(a["type"] == "open_shift" and "Bob" in a["title"] for a in alerts), alerts

# pending things are listed
ok(ask({"leave_type": "Day off", "start_date": d(40), "end_date": d(40)}, headers=BH))
alerts = ok(c.get("/dashboard/alerts", headers=H))["items"]
assert any(a["type"] == "waiting" and "leave request" in a["title"] for a in alerts), alerts

# lateness (skipped in the first 40 minutes after midnight, when 'late' cannot be true yet)
if minutes_since_midnight >= 40:
    ok(shift(bob, d(0), "00:00", "23:00"))
    # Bob has an open old shift, so a third employee is used for the late test
    cy = add_employee(H, rid, "cy@test.com", "Cy")
    ok(shift(cy, d(0), "00:00", "23:00"))
    alerts = ok(c.get("/dashboard/alerts", headers=H))["items"]
    assert any(a["type"] == "late" and "Cy" in a["title"] for a in alerts), alerts
    # approved leave today removes the alert
    day0 = ok(c.post("/leave/", headers=auth("cy@test.com"), json={"leave_type": "Sick", "start_date": d(0), "end_date": d(0)}))
    ok(c.put(f"/leave/{day0['id']}/approve", headers=H))
    alerts = ok(c.get("/dashboard/alerts", headers=H))["items"]
    assert not any(a["type"] == "late" and "Cy" in a["title"] for a in alerts), alerts
    after = ok(c.get("/dashboard/", headers=H))
    assert after["on_leave_today"] == 1, after

# the other manager sees none of this
assert ok(c.get("/dashboard/alerts", headers=OH))["items"] == []
assert c.get("/dashboard/alerts", headers=AH).status_code == 403

# ============================================================ EXPORT
wb = openpyxl.load_workbook(io.BytesIO(c.get(f"/reports/export?period=month&on={d(4)}", headers=H).content))
header = [x.value for x in wb["Summary"][6]]
assert header[-1] == "Leave days", header
ann_row = next(r for r in wb["Summary"].iter_rows(min_row=7, values_only=True) if r[0] == "Ann Test")
assert ann_row[8] >= 1, ann_row
grid = wb["Daily hours"]
flat = [cell.value for row in grid.iter_rows() for cell in row]
assert "L" in flat, "leave days should be marked L in the daily grid"

print("FEATURES2 OK")
