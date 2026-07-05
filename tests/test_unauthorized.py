import pytest


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "path", "kwargs"),
    [
        ("post", "/decks", {"json": {"name": "Python"}}),
        ("get", "/decks", {}),
        (
            "post",
            "/decks/1/cards",
            {"json": {"front": "Question", "back": "Answer"}},
        ),
        ("get", "/cards/1", {}),
    ],
)
async def test_protected_routes_require_login(ac, method, path, kwargs):
    response = await getattr(ac, method)(path, **kwargs)

    assert response.status_code == 401
