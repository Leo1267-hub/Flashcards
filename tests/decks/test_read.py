import pytest

from tests.helpers import create_card, create_deck


@pytest.mark.asyncio
async def test_get_decks_returns_empty_list(auth_ac):
    response = await auth_ac.get("/decks")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_decks_returns_decks_and_honors_limit(auth_ac):
    first = await create_deck(auth_ac, "Python")
    await create_deck(auth_ac, "Networking")

    response = await auth_ac.get("/decks", params={"limit": 1})

    assert response.status_code == 200
    assert response.json() == [{**first, "card_count": 0, "due_count": 0}]


@pytest.mark.asyncio
# parametrize is used to test multiple invalid limit values, when we run params = { "limit": limit } in the get request, it will test for each value in the list [0, -1, 101]
@pytest.mark.parametrize("limit", [0, -1, 101])
async def test_get_decks_rejects_invalid_limit(auth_ac, limit):
    response = await auth_ac.get("/decks", params={"limit": limit})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_one_deck_includes_card_and_due_counts(auth_ac):
    deck = await create_deck(auth_ac)
    await create_card(auth_ac, deck["id"])

    response = await auth_ac.get(f'/decks/{deck["id"]}')

    assert response.status_code == 200
    assert response.json() == {**deck, "card_count": 1, "due_count": 1}


@pytest.mark.asyncio
async def test_get_missing_deck_returns_404(auth_ac):
    response = await auth_ac.get("/decks/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}
