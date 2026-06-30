import pytest

@pytest.mark.asyncio
async def test_health(ac):
        response = await ac.get('/health')
        assert response.status_code == 200
        assert response.json() == {'status': 'OK'}
        
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
