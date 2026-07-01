import pytest


async def create_deck(ac, name="Python", description="Python flashcards"):
    response = await ac.post(
        "/decks",
        json={"name": name, "description": description},
    )
    assert response.status_code == 201
    return response.json()


async def create_card(ac, deck_id, front="What is DNS?", back="Domain Name System"):
    response = await ac.post(
        f"/decks/{deck_id}/cards",
        json={"front": front, "back": back},
    )
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_root(ac):
    response = await ac.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Flashcards API"}


@pytest.mark.asyncio
async def test_health(ac):
    response = await ac.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "OK"}


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
async def test_create_deck(ac):
    response = await ac.post(
        "/decks",
        json={"name": "Python", "description": "Python flashcards"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data == {
        "id": data["id"],
        "name": "Python",
        "description": "Python flashcards",
        "card_count": 0,
    }
    assert isinstance(data["id"], int)


@pytest.mark.asyncio
async def test_create_deck_allows_omitted_description(ac):
    response = await ac.post("/decks", json={"name": "Python"})

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
async def test_create_deck_rejects_invalid_data(ac, payload):
    response = await ac.post("/decks", json=payload)

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


@pytest.mark.asyncio
async def test_update_deck_only_changes_provided_fields(ac):
    deck = await create_deck(ac)

    response = await ac.patch(
        f'/decks/{deck["id"]}',
        json={"name": "Advanced Python"},
    )

    assert response.status_code == 200
    assert response.json() == {
        **deck,
        "name": "Advanced Python",
    }


@pytest.mark.asyncio
async def test_update_missing_deck_returns_404(ac):
    response = await ac.patch("/decks/999999", json={"name": "New name"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
async def test_update_deck_rejects_invalid_data(ac):
    deck = await create_deck(ac)

    response = await ac.patch(f'/decks/{deck["id"]}', json={"name": ""})

    assert response.status_code == 422


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


@pytest.mark.asyncio
async def test_create_card(ac):
    deck = await create_deck(ac)

    response = await ac.post(
        f'/decks/{deck["id"]}/cards',
        json={"front": "What is DNS?", "back": "Domain Name System"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data == {
        "id": data["id"],
        "deck_id": deck["id"],
        "front": "What is DNS?",
        "back": "Domain Name System",
    }
    assert isinstance(data["id"], int)


@pytest.mark.asyncio
async def test_create_card_for_missing_deck_returns_404(ac):
    response = await ac.post(
        "/decks/999999/cards",
        json={"front": "What is HTTP?", "back": "Hypertext Transfer Protocol"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"front": "", "back": "answer"},
        {"front": "question", "back": ""},
        {"front": "x" * 501, "back": "answer"},
        {"front": "question", "back": "x" * 501},
    ],
)
async def test_create_card_rejects_invalid_data(ac, payload):
    deck = await create_deck(ac)

    response = await ac.post(f'/decks/{deck["id"]}/cards', json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_deck_cards_returns_only_cards_from_that_deck(ac):
    deck = await create_deck(ac, "Python")
    other_deck = await create_deck(ac, "Networking")
    card = await create_card(ac, deck["id"])
    await create_card(ac, other_deck["id"], "What is TCP?", "A protocol")

    response = await ac.get(f'/decks/{deck["id"]}/cards')

    assert response.status_code == 200
    assert response.json() == [card]


@pytest.mark.asyncio
async def test_get_cards_for_missing_deck_returns_404(ac):
    response = await ac.get("/decks/999999/cards")

    assert response.status_code == 404
    assert response.json() == {"detail": "Deck not found"}


@pytest.mark.asyncio
async def test_get_card(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])

    response = await ac.get(f'/cards/{card["id"]}')

    assert response.status_code == 200
    assert response.json() == card


@pytest.mark.asyncio
async def test_get_missing_card_returns_404(ac):
    response = await ac.get("/cards/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}


@pytest.mark.asyncio
async def test_update_card_only_changes_provided_fields(ac):
    deck = await create_deck(ac)
    card = await create_card(ac, deck["id"])

    response = await ac.patch(
        f'/cards/{card["id"]}',
        json={"back": "The Domain Name System"},
    )

    assert response.status_code == 200
    assert response.json() == {
        **card,
        "back": "The Domain Name System",
    }


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