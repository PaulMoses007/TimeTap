from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics_service import get_attendance_analytics
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
    """
    Process attendance data from the last 30 days.

    Only managers can access analytics.
    """

    return get_attendance_analytics(
        db,
        days=30
    )