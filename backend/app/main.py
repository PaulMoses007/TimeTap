
from fastapi import FastAPI
from starlette.routing import Match
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
# Trailing slash tolerance
# --------------------------------------------------
# The website reaches this API through a Vercel rewrite that does not forward
# addresses ending in "/". Accept "/dashboard" as well as "/dashboard/" so the
# same route answers either way, without a redirect (a redirect would drop the
# login header in the browser).

class TrailingSlashMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope["path"]

            if len(path) > 1 and not path.endswith("/"):
                routes = app.router.routes
                exact = any(r.matches(scope)[0] == Match.FULL for r in routes)

                if not exact:
                    probe = dict(scope, path=path + "/")
                    if any(r.matches(probe)[0] == Match.FULL for r in routes):
                        scope = dict(scope, path=path + "/")
                        if "raw_path" in scope and scope["raw_path"]:
                            scope["raw_path"] = scope["raw_path"] + b"/"

        await self.asgi_app(scope, receive, send)


app.add_middleware(TrailingSlashMiddleware)


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
