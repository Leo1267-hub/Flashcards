import pytest

from tests.helpers import create_deck


@pytest.mark.asyncio
async def test_update_deck_only_changes_provided_fields(auth_ac):
    deck = await create_deck(auth_ac)

    response = await auth_ac.patch(
        f'/decks/{deck["id"]}',
        json={"name": "Advanced Python"},
    )

    assert response.status_code == 200
    assert response.json() == {**deck, "name": "Advanced Python"}


@pytest.mark.asyncio
async def test_update_missing_deck_returns_404(auth_ac):
    response = await auth_ac.patch("/decks/999999", json={"name": "New name"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
async def test_update_deck_rejects_invalid_data(auth_ac):
    deck = await create_deck(auth_ac)
    response = await auth_ac.patch(f'/decks/{deck["id"]}', json={"name": ""})

    assert response.status_code == 422
