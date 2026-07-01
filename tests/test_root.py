import pytest


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
