import pytest
        
@pytest.mark.asyncio
async def test_get_decks(ac):
        response = await ac.get('/decks')
        assert response.status_code == 200
        assert isinstance(response.json(),list)
            

@pytest.mark.asyncio
async def test_create_deck(ac):
        response = await ac.post('/decks',
                           json={
                               "name": "Python",
                               "description": "Python flashcards"
                               }
                           )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Python"
        assert data["description"] == "Python flashcards"
        assert data["card_count"] == 0
        assert "id" in data

@pytest.mark.asyncio
async def test_create_card(ac):
    deck_response = await ac.post('/decks',
                                  json={
                                      "name": "Networking",
            "description": "Networking cards"
                                  })
    deck_id = deck_response.json()["id"]
    
    card_response = await ac.post(f'/decks/{deck_id}/cards',
                                  json={
                                      "front": "What is DNS?",
            "back": "Domain Name System"
                                  })
    assert card_response.status_code == 201
    data = card_response.json()
    assert data["deck_id"] == deck_id
    assert data["front"] == "What is DNS?"
    assert data["back"] == "Domain Name System"
    assert "id" in data
    

@pytest.mark.asyncio
async def test_get_missing_deck_returns_404(ac):
    response = await ac.get("/decks/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Deck not found"    

@pytest.mark.asyncio
async def test_create_card_for_missing_deck_returns_404(ac):
    response = await ac.post('decks/1/cards',
                       json={
                           'front': 'What is HTTP?',
                           'back': 'Hypertext Transfer Protocol'
                       })
    assert response.status_code == 404
    assert response.json() == {'detail': 'Deck not found'}