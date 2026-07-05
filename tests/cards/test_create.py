import pytest

from tests.helpers import create_deck


@pytest.mark.asyncio
async def test_create_card(auth_ac):
    deck = await create_deck(auth_ac)
    response = await auth_ac.post(
        f'/decks/{deck["id"]}/cards',
        json={"front": "What is DNS?", "back": "Domain Name System"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data == {
        "id": data["id"],
        "deck_id": deck["id"],
        "front": "What is DNS?",
        "back": "Domain Name System",
    }
    assert isinstance(data["id"], int)


@pytest.mark.asyncio
async def test_create_card_for_missing_deck_returns_404(auth_ac):
    response = await auth_ac.post(
        "/decks/999999/cards",
        json={"front": "What is HTTP?", "back": "Hypertext Transfer Protocol"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"front": "", "back": "answer"},
        {"front": "question", "back": ""},
        {"front": "x" * 501, "back": "answer"},
        {"front": "question", "back": "x" * 501},
    ],
)
async def test_create_card_rejects_invalid_data(auth_ac, payload):
    deck = await create_deck(auth_ac)
    response = await auth_ac.post(f'/decks/{deck["id"]}/cards', json=payload)

    assert response.status_code == 422
