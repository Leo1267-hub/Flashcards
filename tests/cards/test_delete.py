import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_delete_card(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])
    response = await ac.delete(f'/cards/{card["id"]}')

    assert response.status_code == 204
    assert response.content == b""
    assert (await ac.get(f'/cards/{card["id"]}')).status_code == 404
    assert (await ac.get(f'/decks/{deck["id"]}')).json()["card_count"] == 0


@pytest.mark.asyncio
async def test_delete_missing_card_returns_404(ac):
    response = await ac.delete("/cards/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}
