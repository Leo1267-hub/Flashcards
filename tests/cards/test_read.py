import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_get_deck_cards_returns_only_cards_from_that_deck(auth_ac):
    deck = await create_deck(auth_ac, "Python")
    other_deck = await create_deck(auth_ac, "Networking")
    card = await create_card(auth_ac, deck["id"])
    await create_card(auth_ac, other_deck["id"], "What is TCP?", "A protocol")

    response = await auth_ac.get(f'/decks/{deck["id"]}/cards')

    assert response.status_code == 200
    assert response.json() == [card]


@pytest.mark.asyncio
async def test_get_cards_for_missing_deck_returns_404(auth_ac):
    response = await auth_ac.get("/decks/999999/cards")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
async def test_get_card(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])
    response = await auth_ac.get(f'/cards/{card["id"]}')

    assert response.status_code == 200
    assert response.json() == card


@pytest.mark.asyncio
async def test_get_missing_card_returns_404(auth_ac):
    response = await auth_ac.get("/cards/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}
