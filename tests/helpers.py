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
