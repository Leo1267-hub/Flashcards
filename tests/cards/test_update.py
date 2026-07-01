import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_update_card_only_changes_provided_fields(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])
    response = await ac.patch(
        f'/cards/{card["id"]}',
        json={"back": "The Domain Name System"},
    )

    assert response.status_code == 200
    assert response.json() == {**card, "back": "The Domain Name System"}


@pytest.mark.asyncio
async def test_update_missing_card_returns_404(ac):
    response = await ac.patch("/cards/999999", json={"front": "New question"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}


@pytest.mark.asyncio
async def test_update_card_rejects_invalid_data(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])
    response = await ac.patch(f'/cards/{card["id"]}', json={"front": ""})

    assert response.status_code == 422
