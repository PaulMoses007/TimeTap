"""Checks that every route answers with and without a trailing slash.

Run like smoke_test.py (see README).
"""
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)
def ok(r, code=200): assert r.status_code == code, (r.request.url, r.status_code, r.text[:200]); return r.json() if r.content else None
ok(c.post("/register/manager", json={"first_name":"M","last_name":"M","email":"m@t.com","phone":"+37120000001","password":"Passw0rd!x"}))
H={"Authorization":"Bearer "+ok(c.post("/auth/login", json={"email":"m@t.com","password":"Passw0rd!x"}))["access_token"]}
r=ok(c.post("/restaurants", headers=H, json={"name":"B","address":"R","phone":"+37120000002","email":"b@t.com"}, follow_redirects=False))   # no slash POST
rid=r["id"]
for u in ["/restaurants","/restaurants/","/dashboard","/dashboard/","/employees","/employees/","/employees/me","/attendance/manual-requests","/attendance/manual-requests/", f"/restaurants/{rid}", "/attendance/today"]:
    resp=c.get(u,headers=H,follow_redirects=False); assert resp.status_code==200,(u,resp.status_code,resp.text[:150]); print("ok",u)
e=ok(c.post("/employees", headers=H, json={"first_name":"E","last_name":"E","email":"e@t.com","phone":"+37120000003","role":"Chef","restaurant_id":rid,"password":"Passw0rd!x","schedule_type":"Flexible"}, follow_redirects=False))
print("dashboard:", ok(c.get("/dashboard",headers=H)))
assert c.get("/nope",headers=H).status_code==404
assert c.get("/docs").status_code==200
ok(c.post("/register", json={"first_name":"X","last_name":"X","email":"x@t.com","phone":"+37120000009","role":"Chef","invitation_code":r["invitation_code"],"password":"Passw0rd!x","schedule_type":"Flexible"}, follow_redirects=False))
print("SLASH OK")
