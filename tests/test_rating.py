import pytest

@pytest.mark.asyncio
async def test_review_card_updates_fsrs_state(auth_ac):
    deck_response = await auth_ac.post(
        "/decks",
        json={
            "name": "Algorithms",
            "description": None,
        },
    )
    deck_id = deck_response.json()["id"]

    card_response = await auth_ac.post(
        f"/decks/{deck_id}/cards",
        json={
            "front": "What is a stack?",
            "back": "A LIFO data structure",
        },
    )

    original_card = card_response.json()
    card_id = original_card["id"]

    review_response = await auth_ac.post(
        f"/cards/{card_id}/review",
        json={"rating": 3},
    )

    assert review_response.status_code == 200

    reviewed_card = review_response.json()

    assert reviewed_card["last_review"] is not None
    assert reviewed_card["stability"] is not None
    assert reviewed_card["difficulty"] is not None
    assert reviewed_card["due"] != original_card["due"]
    

@pytest.mark.asyncio
async def test_review_card_rejects_invalid_rating(auth_ac):
    deck_response = await auth_ac.post(
        "/decks",
        json={
            "name": "Algorithms",
            "description": None,
        },
    )
    deck_id = deck_response.json()["id"]

    card_response = await auth_ac.post(
        f"/decks/{deck_id}/cards",
        json={
            "front": "What is a stack?",
            "back": "A LIFO data structure",
        },
    )
    card_id = card_response.json()["id"]

    response = await auth_ac.post(
        f"/cards/{card_id}/review",
        json={"rating": 10},
    )

    assert response.status_code == 422
