from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# Import models
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.restaurant import Restaurant

# Import routers
from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router
from app.routers.restaurant import router as restaurant_router
from app.routers.report import router as report_router
from app.routers.register import router as register_router
from app.routers.dashboard import router as dashboard_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TimeTap",
    version="1.0.0",
    description="TimeTap - Restaurant Attendance Management System"
)

# ----------------------------------------------------
# CORS Configuration
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://fuzzy-space-tribble-974vrjrxrxp9pfxjq4-5173.app.github.dev",
        "https://fuzzy-space-tribble-974vrjrxrxp9pfxjq4-5174.app.github.dev",
    ],
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ----------------------------------------------------
# Register Routers
# ----------------------------------------------------
app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(attendance_router)
app.include_router(restaurant_router)
app.include_router(report_router)
app.include_router(register_router)
app.include_router(dashboard_router)

# ----------------------------------------------------
# Root Endpoint
# ----------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Welcome to TimeTap API 🚀"
    }


# ----------------------------------------------------
# Health Check
# ----------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }