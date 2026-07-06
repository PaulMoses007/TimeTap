from fastapi import FastAPI

from app.core.config import APP_NAME, APP_VERSION
from app.core.database import Base, engine

# Import models
from app.models.employee import Employee

# Import routers
from app.routers.employee import router as employee_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION
)

# Register routers
app.include_router(employee_router)


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