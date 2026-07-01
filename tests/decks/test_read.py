import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_get_decks_returns_empty_list(ac):
    response = await ac.get("/decks")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_decks_returns_decks_and_honors_limit(ac):
    first = await create_deck(ac, "Python")
    await create_deck(ac, "Networking")

    response = await ac.get("/decks", params={"limit": 1})

    assert response.status_code == 200
    assert response.json() == [first]


@pytest.mark.asyncio
@pytest.mark.parametrize("limit", [0, -1, 101])
async def test_get_decks_rejects_invalid_limit(ac, limit):
    response = await ac.get("/decks", params={"limit": limit})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_one_deck_includes_card_count(ac):
    deck = await create_deck(ac)
    await create_card(ac, deck["id"])

    response = await ac.get(f'/decks/{deck["id"]}')

    assert response.status_code == 200
    assert response.json() == {**deck, "card_count": 1}


@pytest.mark.asyncio
async def test_get_missing_deck_returns_404(ac):
    response = await ac.get("/decks/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}
