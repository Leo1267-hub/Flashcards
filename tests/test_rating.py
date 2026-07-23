import pytest
from sqlalchemy import select

from backend.models import ReviewEvent
from tests.conftest import TestSessionLocal
from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_review_card_updates_fsrs_state(auth_ac):
    deck = await create_deck(auth_ac, name="Algorithms", description=None)
    original_card = await create_card(
        auth_ac,
        deck["id"],
        front="What is a stack?",
        back="A LIFO data structure",
    )
    card_id = original_card["id"]

    review_response = await auth_ac.post(
        f"/cards/{card_id}/review",
        json={"rating": 3},
    )

    assert review_response.status_code == 200

    payload = review_response.json()
    reviewed_card = payload["card"]

    assert isinstance(payload["review_id"], int)
    assert reviewed_card["last_review"] is not None
    assert reviewed_card["stability"] is not None
    assert reviewed_card["difficulty"] is not None
    assert reviewed_card["due"] != original_card["due"]


@pytest.mark.asyncio
async def test_review_card_saves_review_event(auth_ac):
    deck = await create_deck(auth_ac, name="Algorithms", description=None)
    original_card = await create_card(
        auth_ac,
        deck["id"],
        front="What is a stack?",
        back="A LIFO data structure",
    )
    card_id = original_card["id"]

    review_response = await auth_ac.post(
        f"/cards/{card_id}/review",
        json={"rating": 3},
    )
    assert review_response.status_code == 200
    payload = review_response.json()
    reviewed_card = payload["card"]

    async with TestSessionLocal() as db:
        event = (
            await db.scalars(
                select(ReviewEvent).where(ReviewEvent.card_id == card_id)
            )
        ).one()

    assert event.id == payload["review_id"]
    assert event.rating == 3
    assert event.before_state == original_card["fsrs_state"]
    assert event.before_step == original_card["fsrs_step"]
    assert event.before_stability == original_card["stability"]
    assert event.before_difficulty == original_card["difficulty"]
    assert event.before_due.isoformat().replace("+00:00", "Z") == original_card["due"].replace(
        "+00:00", "Z"
    )
    assert event.before_last_review is None
    assert event.after_state == reviewed_card["fsrs_state"]
    assert event.after_step == reviewed_card["fsrs_step"]
    assert event.after_stability == reviewed_card["stability"]
    assert event.after_difficulty == reviewed_card["difficulty"]
    assert event.after_due.isoformat().replace("+00:00", "Z") == reviewed_card["due"].replace(
        "+00:00", "Z"
    )
    assert event.after_last_review is not None
    assert event.undone_at is None


@pytest.mark.asyncio
async def test_review_card_rejects_invalid_rating(auth_ac):
    deck = await create_deck(auth_ac, name="Algorithms", description=None)
    card = await create_card(
        auth_ac,
        deck["id"],
        front="What is a stack?",
        back="A LIFO data structure",
    )

    response = await auth_ac.post(
        f"/cards/{card['id']}/review",
        json={"rating": 10},
    )

    assert response.status_code == 422
