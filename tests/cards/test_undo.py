import pytest
from sqlalchemy import select

from backend.models import ReviewEvent
from tests.conftest import TestSessionLocal
from tests.helpers import create_card, create_deck
from tests.test_ownership import authenticate_as


async def review_card(client, card_id, rating=3):
    response = await client.post(
        f"/cards/{card_id}/review",
        json={"rating": rating},
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.asyncio
async def test_undo_review_restores_card_state(auth_ac):
    deck = await create_deck(auth_ac)
    original_card = await create_card(auth_ac, deck["id"])

    review = await review_card(auth_ac, original_card["id"])
    reviewed_card = review["card"]
    assert reviewed_card["due"] != original_card["due"]

    undo_response = await auth_ac.post(f'/reviews/{review["review_id"]}/undo')
    assert undo_response.status_code == 200

    restored = undo_response.json()
    assert restored["fsrs_state"] == original_card["fsrs_state"]
    assert restored["fsrs_step"] == original_card["fsrs_step"]
    assert restored["stability"] == original_card["stability"]
    assert restored["difficulty"] == original_card["difficulty"]
    assert restored["due"] == original_card["due"]
    assert restored["last_review"] == original_card["last_review"]

    async with TestSessionLocal() as db:
        event = await db.get(ReviewEvent, review["review_id"])

    assert event is not None
    assert event.undone_at is not None


@pytest.mark.asyncio
async def test_undo_review_restores_deck_due_count(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    before = await auth_ac.get("/decks")
    assert before.json()[0]["due_count"] == 1

    review = await review_card(auth_ac, card["id"], rating=4)
    after_review = await auth_ac.get("/decks")
    assert after_review.json()[0]["due_count"] == 0
    assert review["card"]["due"] != card["due"]

    undo = await auth_ac.post(f'/reviews/{review["review_id"]}/undo')
    assert undo.status_code == 200

    after_undo = await auth_ac.get("/decks")
    assert after_undo.json()[0]["due_count"] == 1

    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])
    review = await review_card(auth_ac, card["id"])

    first = await auth_ac.post(f'/reviews/{review["review_id"]}/undo')
    assert first.status_code == 200

    second = await auth_ac.post(f'/reviews/{review["review_id"]}/undo')
    assert second.status_code == 409
    assert second.json() == {"detail": "Review already undone"}


@pytest.mark.asyncio
async def test_undo_review_rejects_when_not_latest_active(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    first_review = await review_card(auth_ac, card["id"], rating=3)
    second_review = await review_card(auth_ac, card["id"], rating=2)

    response = await auth_ac.post(f'/reviews/{first_review["review_id"]}/undo')
    assert response.status_code == 409
    assert response.json() == {
        "detail": "Only the latest review for this card can be undone"
    }

    latest = await auth_ac.post(f'/reviews/{second_review["review_id"]}/undo')
    assert latest.status_code == 200


@pytest.mark.asyncio
async def test_undo_review_rejects_other_users_review(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])
    review = await review_card(auth_ac, card["id"])

    await authenticate_as(
        auth_ac,
        username="otheruser",
        email="other@example.com",
    )

    response = await auth_ac.post(f'/reviews/{review["review_id"]}/undo')
    assert response.status_code == 404
    assert response.json() == {"detail": "Review not found"}


@pytest.mark.asyncio
async def test_undo_missing_review_returns_404(auth_ac):
    response = await auth_ac.post("/reviews/999999/undo")
    assert response.status_code == 404
    assert response.json() == {"detail": "Review not found"}


@pytest.mark.asyncio
async def test_undo_allows_previous_review_after_latest_is_undone(auth_ac):
    deck = await create_deck(auth_ac)
    original_card = await create_card(auth_ac, deck["id"])

    first_review = await review_card(auth_ac, original_card["id"], rating=3)
    after_first = first_review["card"]
    second_review = await review_card(auth_ac, original_card["id"], rating=4)

    undo_second = await auth_ac.post(f'/reviews/{second_review["review_id"]}/undo')
    assert undo_second.status_code == 200
    assert undo_second.json()["due"] == after_first["due"]

    undo_first = await auth_ac.post(f'/reviews/{first_review["review_id"]}/undo')
    assert undo_first.status_code == 200
    assert undo_first.json()["due"] == original_card["due"]

    async with TestSessionLocal() as db:
        events = (
            await db.scalars(
                select(ReviewEvent)
                .where(ReviewEvent.card_id == original_card["id"])
                .order_by(ReviewEvent.id)
            )
        ).all()

    assert all(event.undone_at is not None for event in events)
