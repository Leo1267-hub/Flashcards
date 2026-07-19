import pytest


@pytest.mark.asyncio
async def test_create_deck(auth_ac):
    response = await auth_ac.post(
        "/decks",
        json={"name": "Python", "description": "Python flashcards"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data == {
        "id": data["id"],
        "name": "Python",
        "description": "Python flashcards",
    }
    assert isinstance(data["id"], int)


@pytest.mark.asyncio
async def test_create_deck_allows_omitted_description(auth_ac):
    response = await auth_ac.post("/decks", json={"name": "Python"})

    assert response.status_code == 201
    assert response.json()["description"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"name": ""},
        {"name": "x" * 101},
        {"name": "Valid", "description": ""},
        {"name": "Valid", "description": "x" * 501},
    ],
)
async def test_create_deck_rejects_invalid_data(auth_ac, payload):
    response = await auth_ac.post("/decks", json=payload)

    assert response.status_code == 422
