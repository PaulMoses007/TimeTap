"""Full-flow check of the API against a temporary database.

Run from the backend folder with SECRET_KEY and DATABASE_URL set (see README).
"""
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)

def ok(r, code=200):
    assert r.status_code == code, (r.request.url, r.status_code, r.text[:300])
    return r.json() if r.content else None

m = {"first_name":"Man","last_name":"Ager","email":"m@test.com","phone":"+37120000001","password":"Passw0rd!x"}
ok(c.post("/register/manager", json=m))
tok = ok(c.post("/auth/login", json={"email":"m@test.com","password":"Passw0rd!x"}))["access_token"]
H = {"Authorization": f"Bearer {tok}"}
r = ok(c.post("/restaurants/", headers=H, json={"name":"Test Bistro","address":"Riga","phone":"+37120000002","email":"b@test.com"}))
rid = r["id"]
assert c.get(f"/restaurants/{rid}/qr", headers=H).status_code == 200
e = ok(c.post("/employees/", headers=H, json={"first_name":"Em","last_name":"Ployee","email":"e@test.com","phone":"+37120000003","role":"Chef","restaurant_id":rid,"password":"Passw0rd!x","schedule_type":"Flexible"}))
et = ok(c.post("/auth/login", json={"email":"e@test.com","password":"Passw0rd!x"}))["access_token"]
EH = {"Authorization": f"Bearer {et}"}
ok(c.post("/attendance/check-in", headers=EH, json={"restaurant_id":rid,"source":"button"}))
ok(c.post("/attendance/check-out", headers=EH, json={"restaurant_id":rid,"source":"qr"}))
from datetime import date, timedelta
d = (date.today()-timedelta(days=1)).isoformat()
req = ok(c.post("/attendance/manual-requests/", headers=EH, json={"check_in":f"{d}T09:00:00","check_out":f"{d}T17:00:00","reason":"Phone off"}))
ok(c.put(f"/attendance/manual-requests/{req['id']}/approve", headers=H, json={"note":"OK"}))
assert any(x["status"]=="Approved" for x in ok(c.get("/attendance/manual-requests/my", headers=EH)))
# --- schedule rules when a manager adds or edits an employee
def new_employee(email, **extra):
    body = {"first_name":"Sch","last_name":"Edule","email":email,"phone":"+37120000004","role":"Waiter",
            "restaurant_id":rid,"password":"Passw0rd!x"}
    body.update(extra)
    return c.post("/employees/", headers=H, json=body)

fixed = ok(new_employee("fixed@test.com", schedule_type="Fixed", shift_start="9:00", shift_end="17:30"))
assert (fixed["schedule_type"], fixed["shift_start"], fixed["shift_end"]) == ("Fixed", "09:00", "17:30"), fixed
assert new_employee("bad1@test.com", schedule_type="Fixed", shift_start="17:00", shift_end="09:00").status_code == 400
assert new_employee("bad2@test.com", schedule_type="Fixed").status_code == 400
assert new_employee("bad3@test.com", schedule_type="Fixed", shift_start="25:00", shift_end="26:00").status_code == 400
assert new_employee("bad4@test.com", schedule_type="Sometimes").status_code == 400
flex = ok(new_employee("flex@test.com", schedule_type="Flexible", shift_start="09:00", shift_end="17:00"))
assert (flex["schedule_type"], flex["shift_start"], flex["shift_end"]) == ("Flexible", None, None), flex

changed = ok(c.put(f"/employees/{flex['id']}", headers=H, json={
    "first_name":"Sch","last_name":"Edule","email":"flex@test.com","phone":"+37120000004","role":"Waiter",
    "is_active":True,"restaurant_id":rid,"schedule_type":"Fixed","shift_start":"10:00","shift_end":"18:00"}))
assert (changed["schedule_type"], changed["shift_start"]) == ("Fixed", "10:00"), changed
assert c.put(f"/employees/{flex['id']}", headers=H, json={
    "first_name":"Sch","last_name":"Edule","email":"flex@test.com","phone":"+37120000004","role":"Waiter",
    "is_active":True,"restaurant_id":rid,"schedule_type":"Fixed","shift_start":"18:00","shift_end":"10:00"}).status_code == 400
ok(c.delete(f"/employees/{fixed['id']}", headers=H))
ok(c.delete(f"/employees/{flex['id']}", headers=H))

# --- manager edits own profile
me = ok(c.put("/employees/me/profile", headers=H, json={"first_name":"Mia","last_name":"Manager","email":"m@test.com","phone":"+37120009999"}))
assert (me["first_name"], me["phone"]) == ("Mia", "+37120009999"), me
assert ok(c.get("/employees/me", headers=H))["last_name"] == "Manager"
assert c.put("/employees/me/profile", headers=H, json={"first_name":"Mia","last_name":"Manager","email":"e@test.com","phone":"+37120009999"}).status_code == 400  # email taken
assert c.put("/employees/me/profile", headers=EH, json={"first_name":"X","last_name":"Y","email":"e@test.com","phone":"1"}).status_code == 403  # employees cannot use it

# --- a manager has one restaurant: a second one is refused with a clear message
second = c.post("/restaurants/", headers=H, json={"name":"Second","address":"Riga","phone":"+37120000005","email":"s@test.com"})
assert second.status_code == 400 and "already have a restaurant" in second.json()["detail"], second.text

# --- Excel export of working hours
import io, openpyxl
for period in ("week", "month"):
    r = c.get(f"/reports/export?period={period}", headers=H)
    assert r.status_code == 200 and "spreadsheetml" in r.headers["content-type"], r.text[:200]
    assert "attachment" in r.headers["content-disposition"] and ".xlsx" in r.headers["content-disposition"]
    wb = openpyxl.load_workbook(io.BytesIO(r.content))
    assert wb.sheetnames == ["Summary", "Daily hours", "Details"], wb.sheetnames
    rows = [[v for v in row] for row in wb["Summary"].iter_rows(min_row=7, values_only=True)]
    assert any(row[0] for row in rows), rows          # at least the employee row
assert c.get("/reports/export?period=year", headers=H).status_code == 400
import zipfile
emp_id = c.get("/employees/", headers=H).json()[0]["id"]
one = c.get(f"/reports/export?period=month&employee_id={emp_id}", headers=H)
assert one.status_code == 200 and one.headers["content-disposition"].count("_") >= 4, one.headers["content-disposition"]
assert c.get("/reports/export?period=month&employee_id=99999", headers=H).status_code == 404
zp = c.get("/reports/export?period=week&separate=true", headers=H)
assert zp.status_code == 200 and zp.headers["content-type"] == "application/zip"
assert all(n.endswith(".xlsx") for n in zipfile.ZipFile(io.BytesIO(zp.content)).namelist())
assert c.get("/reports/export?period=week&on=2026-11-04", headers=H).status_code == 200
assert c.get("/reports/export?period=week", headers=EH).status_code == 403
assert len(wb["Daily hours"][1]) >= 30 + 2 or period == "week"

assert c.delete(f"/restaurants/{rid}", headers=H).status_code == 400   # still has an employee
ok(c.delete(f"/employees/{e['id']}", headers=H))
ok(c.delete(f"/restaurants/{rid}", headers=H))
assert c.get("/docs").status_code == 200
print("SMOKE OK")
