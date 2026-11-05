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
assert c.delete(f"/restaurants/{rid}", headers=H).status_code == 400   # still has an employee
ok(c.delete(f"/employees/{e['id']}", headers=H))
ok(c.delete(f"/restaurants/{rid}", headers=H))
assert c.get("/docs").status_code == 200
print("SMOKE OK")
