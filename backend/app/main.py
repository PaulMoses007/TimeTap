from fastapi import FastAPI

from app.core.database import Base, engine
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TimeTap",
    version="1.0.0"
)

# Routers
app.include_router(employee_router)
app.include_router(attendance_router)


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