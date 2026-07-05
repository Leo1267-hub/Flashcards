async def create_deck(auth_ac, name="Python", description="Python flashcards"):
    response = await auth_ac.post(
        "/decks",
        json={"name": name, "description": description},
    )
    assert response.status_code == 201
    return response.json()


async def create_card(auth_ac, deck_id, front="What is DNS?", back="Domain Name System"):
    response = await auth_ac.post(
        f"/decks/{deck_id}/cards",
        json={"front": front, "back": back},
    )
    assert response.status_code == 201
    return response.json()
