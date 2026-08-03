from datetime import datetime, timedelta, timezone

import pytest

from backend.models import ReviewEvent
from tests.conftest import TestSessionLocal
from tests.helpers import create_card, create_deck


async def add_review_event(
    *,
    card_id: int,
    user_id: int = 1,
    reviewed_at: datetime,
    undone_at: datetime | None = None,
    rating: int = 3,
):
    async with TestSessionLocal() as db:
        event = ReviewEvent(
            card_id=card_id,
            user_id=user_id,
            rating=rating,
            reviewed_at=reviewed_at,
            before_state=1,
            before_step=0,
            before_stability=None,
            before_difficulty=None,
            before_due=reviewed_at,
            before_last_review=None,
            after_state=2,
            after_step=None,
            after_stability=1.0,
            after_difficulty=5.0,
            after_due=reviewed_at + timedelta(days=1),
            after_last_review=reviewed_at,
            undone_at=undone_at,
        )
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event


@pytest.mark.asyncio
async def test_activity_requires_login(ac):
    response = await ac.get("/statistics/activity")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_activity_rejects_invalid_timezone(auth_ac):
    response = await auth_ac.get(
        "/statistics/activity",
        params={"timezone": "Not/AZone"},
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "Invalid timezone"}


@pytest.mark.asyncio
async def test_activity_empty_for_new_user(auth_ac):
    response = await auth_ac.get(
        "/statistics/activity",
        params={"timezone": "UTC"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "total_reviews": 0,
        "active_days": 0,
        "max_streak": 0,
        "days": [],
    }


@pytest.mark.asyncio
async def test_activity_counts_reviews_by_local_day(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    now = datetime.now(timezone.utc)
    today = now.replace(hour=12, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)
    two_days_ago = today - timedelta(days=2)

    await add_review_event(card_id=card["id"], reviewed_at=two_days_ago)
    await add_review_event(card_id=card["id"], reviewed_at=two_days_ago + timedelta(hours=1))
    await add_review_event(card_id=card["id"], reviewed_at=yesterday)
    await add_review_event(card_id=card["id"], reviewed_at=today)

    response = await auth_ac.get(
        "/statistics/activity",
        params={"timezone": "UTC"},
    )

    assert response.status_code == 200
    data = response.json()
    counts = {day["date"]: day["count"] for day in data["days"]}

    assert counts[two_days_ago.date().isoformat()] == 2
    assert counts[yesterday.date().isoformat()] == 1
    assert counts[today.date().isoformat()] == 1
    assert data["total_reviews"] == 4
    assert data["active_days"] == 3
    assert data["max_streak"] == 3


@pytest.mark.asyncio
async def test_activity_excludes_undone_reviews(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    now = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
    await add_review_event(card_id=card["id"], reviewed_at=now)
    await add_review_event(
        card_id=card["id"],
        reviewed_at=now + timedelta(hours=1),
        undone_at=now + timedelta(hours=2),
    )

    response = await auth_ac.get(
        "/statistics/activity",
        params={"timezone": "UTC"},
    )

    data = response.json()
    assert data["total_reviews"] == 1
    assert data["active_days"] == 1
    assert data["days"] == [{"date": now.date().isoformat(), "count": 1}]


@pytest.mark.asyncio
async def test_activity_max_streak(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    today = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
    # Streak of 3, gap, then streak of 2 → max 3
    for offset in (6, 5, 4, 2, 1):
        await add_review_event(
            card_id=card["id"],
            reviewed_at=today - timedelta(days=offset),
        )

    response = await auth_ac.get(
        "/statistics/activity",
        params={"timezone": "UTC"},
    )

    data = response.json()
    assert data["max_streak"] == 3
    assert data["active_days"] == 5
    assert data["total_reviews"] == 5
