from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.schemas.analytics import (
    AnalyticsSummary,
    AttendanceTrend,
)

from app.services.analytics_service import (
    get_attendance_analytics,
    get_attendance_trend,
)

from app.security.roles import require_manager


# ============================================================
# ANALYTICS ROUTER
# ============================================================

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# ATTENDANCE ANALYTICS
# ============================================================

@router.get(
    "/attendance",
    response_model=AnalyticsSummary
)
def attendance_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Process attendance data from the last 30 days.

    Only managers can access analytics.
    """

    return get_attendance_analytics(
        db,
        days=30
    )


# ============================================================
# DAILY ATTENDANCE TREND
# ============================================================

@router.get(
    "/attendance-trend",
    response_model=list[AttendanceTrend]
)
def attendance_trend(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    """
    Process attendance history day by day.

    Returns daily:
    - attendance count
    - total worked hours
    - average worked hours
    - late arrivals

    Only managers can access attendance trends.
    """

    return get_attendance_trend(
        db,
        days=30
    )