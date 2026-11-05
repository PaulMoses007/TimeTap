# TimeTap Roadmap

## Done

- [x] FastAPI backend with JWT login, roles (Manager, Employee), PostgreSQL on Neon
- [x] Manager and employee registration, invitation codes, manager approval of new employees
- [x] Restaurants: create, delete (only when no staff), attendance QR, invitation code
- [x] Attendance by QR scan, by 15-second hold button, and by manual request with manager approval
- [x] Employee add, delete (soft delete) and individual account page, on website and mobile
- [x] Manager website: Dashboard, Employees, Attendance, Restaurants, Reports, Settings, Profile
- [x] Mobile app (Android APK and mobile web) for employees and managers
- [x] Shared API client and Europe/Riga time handling in all clients

## Next

- [ ] Website employee page: replace the one-click check-in with the same three methods as mobile
- [ ] GPS check at check-in (use the stored `source` and add a location rule per restaurant)
- [ ] Rotating or signed QR codes
- [ ] Login rate limiting and password reset
- [ ] Automated tests in CI (the smoke test is the starting point)
- [ ] Push notifications for manual requests

## Later

- [ ] Shift schedules and late or absent alerts
- [ ] Export reports to CSV or PDF
- [ ] Paid hosting (the free Render plan sleeps when idle)
