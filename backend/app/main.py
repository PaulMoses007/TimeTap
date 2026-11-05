
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_EXTRA_ORIGINS
from app.core.database import Base, engine
from app.core.migrations import ensure_columns

from app.models.employee import Employee
from app.models.attendance import Attendance, ManualAttendanceRequest
from app.models.restaurant import Restaurant

from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router
from app.routers.manual_attendance import router as manual_attendance_router
from app.routers.restaurant import router as restaurant_router
from app.routers.report import router as report_router
from app.routers.register import router as register_router
from app.routers.dashboard import router as dashboard_router
from app.routers.analytics import router as analytics_router


# Create database tables
Base.metadata.create_all(bind=engine)

# Add columns introduced after the first deployment
ensure_columns(engine)


app = FastAPI(
    title="TimeTap",
    version="1.0.0",
    description="TimeTap - Restaurant Attendance Management System"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:8081",

        "https://timetap-mobile-chi.vercel.app",
        "https://timetap-system.vercel.app",
    ] + CORS_EXTRA_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# --------------------------------------------------
# API Routers
# --------------------------------------------------

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(attendance_router)
app.include_router(manual_attendance_router)
app.include_router(restaurant_router)
app.include_router(report_router)
app.include_router(register_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)


# --------------------------------------------------
# Basic Routes
# --------------------------------------------------

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
