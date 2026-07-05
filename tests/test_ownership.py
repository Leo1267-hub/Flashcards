import pytest

from tests.helpers import create_card, create_deck


async def authenticate_as(client, username, email, password="password123"):
    response = await client.post(
        "/signup",
        json={"username": username, "email": email, "password": password},
    )

    assert response.status_code == 200

    token = response.cookies.get("access_token")
    assert token is not None

    client.headers.update({"Authorization": f"Bearer {token}"})


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_deck_or_card(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    await authenticate_as(
        auth_ac,
        username="otheruser",
        email="other@example.com",
    )

    decks_response = await auth_ac.get("/decks")
    deck_response = await auth_ac.get(f'/decks/{deck["id"]}')
    create_card_response = await auth_ac.post(
        f'/decks/{deck["id"]}/cards',
        json={"front": "Question", "back": "Answer"},
    )
    card_response = await auth_ac.get(f'/cards/{card["id"]}')

    assert decks_response.status_code == 200
    assert decks_response.json() == []

    assert deck_response.status_code == 404
    assert deck_response.json() == {"detail": "Deck not found"}

    assert create_card_response.status_code == 404
    assert create_card_response.json() == {"detail": "Deck not found"}

    assert card_response.status_code == 404
    assert card_response.json() == {"detail": "Card not found"}
