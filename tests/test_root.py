import pytest


@pytest.mark.asyncio
async def test_root(auth_ac):
    response = await auth_ac.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Flashcards API"}


@pytest.mark.asyncio
async def test_health(auth_ac):
    response = await auth_ac.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "OK"}
