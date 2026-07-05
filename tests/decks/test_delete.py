import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_delete_deck_and_its_cards(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await auth_ac.delete(f'/decks/{deck["id"]}')

    assert response.status_code == 204
    assert response.content == b""
    assert (await auth_ac.get(f'/decks/{deck["id"]}')).status_code == 404
    assert (await auth_ac.get(f'/cards/{card["id"]}')).status_code == 404


@pytest.mark.asyncio
async def test_delete_missing_deck_returns_404(auth_ac):
    response = await auth_ac.delete("/decks/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}
