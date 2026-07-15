from fastapi import FastAPI

from app.core.database import Base, engine
from app.routers.auth import router as auth_router

# Import models
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.restaurant import Restaurant

# Import routers
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router
from app.routers.restaurant import router as restaurant_router
from app.routers.report import router as report_router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TimeTap",
    version="1.0.0",
    description="TimeTap - Restaurant Attendance Management System"
)

# Register API routers
app.include_router(employee_router)
app.include_router(attendance_router)
app.include_router(restaurant_router)
app.include_router(auth_router)
app.include_router(report_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to TimeTap API 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }