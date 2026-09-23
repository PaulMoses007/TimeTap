from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.schemas.analytics import (
    AnalyticsSummary,
    AttendanceTrend,
    WorkforceInsight,
)

from app.services.analytics_service import (
    get_attendance_analytics,
    get_attendance_trend,
    get_workforce_insights,
)

from app.security.roles import require_manager


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


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
    return get_attendance_analytics(
        db,
        days=30
    )


# ============================================================
# ATTENDANCE TREND
# ============================================================

@router.get(
    "/attendance-trend",
    response_model=list[AttendanceTrend]
)
def attendance_trend(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    return get_attendance_trend(
        db,
        days=30
    )


# ============================================================
# ADAPTIVE WORKFORCE INSIGHTS
# ============================================================

@router.get(
    "/workforce-insights",
    response_model=list[WorkforceInsight]
)
def workforce_insights(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    return get_workforce_insights(
        db,
        days=14
    )