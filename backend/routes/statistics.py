from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import ReviewEvent, User
from backend.schemas.statistics import ActivityDay, ActivityResponse
from backend.services.helpers import get_current_user

router = APIRouter(prefix="/statistics", tags=["Statistics"])

ACTIVITY_WINDOW_DAYS = 365


def _resolve_timezone(name: str) -> ZoneInfo:
    try:
        return ZoneInfo(name)
    except ZoneInfoNotFoundError as exc:
        raise HTTPException(status_code=422, detail="Invalid timezone") from exc


def _max_streak(counts_by_date: dict[date, int], start: date, end: date) -> int:
    best = 0
    current = 0
    day = start
    while day <= end:
        if counts_by_date.get(day, 0) > 0:
            current += 1
            best = max(best, current)
        else:
            current = 0
        day += timedelta(days=1)
    return best


@router.get("/activity", response_model=ActivityResponse)
async def get_activity(
    timezone_name: str = Query("UTC", alias="timezone"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tz = _resolve_timezone(timezone_name)
    today = datetime.now(tz).date()
    start_date = today - timedelta(days=ACTIVITY_WINDOW_DAYS - 1)
    start_at = datetime.combine(start_date, datetime.min.time(), tzinfo=tz).astimezone(
        timezone.utc
    )

    local_date = cast(func.timezone(timezone_name, ReviewEvent.reviewed_at), Date)

    rows = (
        await db.execute(
            select(local_date.label("day"), func.count().label("count"))
            .where(
                ReviewEvent.user_id == current_user.id,
                ReviewEvent.undone_at.is_(None),
                ReviewEvent.reviewed_at >= start_at,
            )
            .group_by(local_date)
            .order_by(local_date)
        )
    ).all()

    counts_by_date = {row.day: int(row.count) for row in rows}
    days = [
        ActivityDay(date=day.isoformat(), count=count)
        for day, count in sorted(counts_by_date.items())
        if count > 0
    ]

    return ActivityResponse(
        total_reviews=sum(counts_by_date.values()),
        active_days=len(days),
        max_streak=_max_streak(counts_by_date, start_date, today),
        days=days,
    )
