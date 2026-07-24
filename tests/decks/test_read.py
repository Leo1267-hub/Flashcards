from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import update

from backend.models import Card
from tests.conftest import TestSessionLocal
from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_get_decks_returns_empty_list(auth_ac):
    response = await auth_ac.get("/decks")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_decks_returns_decks_and_honors_limit(auth_ac):
    first = await create_deck(auth_ac, "Python")
    await create_deck(auth_ac, "Networking")

    response = await auth_ac.get("/decks", params={"limit": 1})

    assert response.status_code == 200
    assert response.json() == [{**first, "card_count": 0, "due_count": 0}]


@pytest.mark.asyncio
async def test_get_decks_returns_card_and_due_counts(auth_ac):
    deck = await create_deck(auth_ac)
    cards = [
        await create_card(auth_ac, deck["id"], front="Card A"),
        await create_card(auth_ac, deck["id"], front="Card B"),
        await create_card(auth_ac, deck["id"], front="Card C"),
    ]
    now = datetime.now(timezone.utc)

    due_dates = {
        cards[0]["id"]: now - timedelta(days=1),
        cards[1]["id"]: now,
        cards[2]["id"]: now + timedelta(days=1),
    }
    async with TestSessionLocal() as db:
        for card_id, due in due_dates.items():
            await db.execute(
                update(Card).where(Card.id == card_id).values(due=due)
            )
        await db.commit()

    response = await auth_ac.get("/decks")

    assert response.status_code == 200
    assert response.json()[0]["card_count"] == 3
    assert response.json()[0]["due_count"] == 2


@pytest.mark.asyncio
async def test_get_decks_returns_zero_counts_for_empty_deck(auth_ac):
    await create_deck(auth_ac)

    response = await auth_ac.get("/decks")

    assert response.status_code == 200
    assert response.json()[0]["card_count"] == 0
    assert response.json()[0]["due_count"] == 0


@pytest.mark.asyncio
# parametrize is used to test multiple invalid limit values, when we run params = { "limit": limit } in the get request, it will test for each value in the list [0, -1, 101]
@pytest.mark.parametrize("limit", [0, -1, 101])
async def test_get_decks_rejects_invalid_limit(auth_ac, limit):
    response = await auth_ac.get("/decks", params={"limit": limit})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_one_deck_includes_card_and_due_counts(auth_ac):
    deck = await create_deck(auth_ac)
    await create_card(auth_ac, deck["id"])

    response = await auth_ac.get(f'/decks/{deck["id"]}')

    assert response.status_code == 200
    assert response.json() == {**deck, "card_count": 1, "due_count": 1}


@pytest.mark.asyncio
@pytest.mark.parametrize("rating", [1, 2, 3])
async def test_due_count_keeps_counting_cards_still_in_learning(auth_ac, rating):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    review = await auth_ac.post(
        f'/cards/{card["id"]}/review',
        json={"rating": rating},
    )
    assert review.status_code == 200

    reviewed_card = review.json()["card"]
    assert reviewed_card["fsrs_state"] in (1, 3)
    assert reviewed_card["due"] > card["due"]

    decks_response = await auth_ac.get("/decks")
    deck_response = await auth_ac.get(f'/decks/{deck["id"]}')
    study_response = await auth_ac.get(f'/decks/{deck["id"]}/study-cards')

    assert decks_response.json()[0]["due_count"] == 1
    assert deck_response.json()["due_count"] == 1
    assert len(study_response.json()) == 1


@pytest.mark.asyncio
async def test_get_missing_deck_returns_404(auth_ac):
    response = await auth_ac.get("/decks/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}
