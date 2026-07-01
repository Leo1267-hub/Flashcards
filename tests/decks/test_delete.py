import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_delete_deck_and_its_cards(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])

    response = await ac.delete(f'/decks/{deck["id"]}')

    assert response.status_code == 204
    assert response.content == b""
    assert (await ac.get(f'/decks/{deck["id"]}')).status_code == 404
    assert (await ac.get(f'/cards/{card["id"]}')).status_code == 404


@pytest.mark.asyncio
async def test_delete_missing_deck_returns_404(ac):
    response = await ac.delete("/decks/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}
