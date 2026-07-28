import pytest


USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
}


async def signup(ac, **overrides):
    payload = USER | overrides
    return await ac.post("/signup", json=payload)


@pytest.mark.asyncio
async def test_signup_creates_user(ac):
    response = await signup(ac)

    assert response.status_code == 200
    assert response.json() == {
        "message": "User created successfully",
        "user_id": 1,
        "access_token": response.cookies.get("access_token"),
    }
    assert response.cookies.get("access_token") is not None


@pytest.mark.asyncio
async def test_signup_rejects_duplicate_email(ac):
    first_response = await signup(ac)
    duplicate_email = await signup(
        ac,
        username="differentuser",
    )

    assert first_response.status_code == 200
    assert duplicate_email.status_code == 400
    assert duplicate_email.json() == {"detail": "Email already registered"}


@pytest.mark.asyncio
async def test_signup_allows_duplicate_username(ac):
    first_response = await signup(ac)
    duplicate_username = await signup(
        ac,
        email="different@example.com",
    )

    assert first_response.status_code == 200
    assert duplicate_username.status_code == 200
    assert duplicate_username.json()["user_id"] != first_response.json()["user_id"]


@pytest.mark.asyncio
async def test_login_succeeds_with_correct_credentials(ac):
    await signup(ac)

    response = await ac.post(
        "/login",
        json={"email": USER["email"], "password": USER["password"]},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "successfully", "user_id": 1, "access_token": response.cookies.get("access_token")}
    assert response.cookies.get("access_token") is not None


@pytest.mark.asyncio
async def test_login_picks_the_account_matching_the_email(ac):
    await signup(ac)
    second = await signup(ac, email="second@example.com", password="password456")

    response = await ac.post(
        "/login",
        json={"email": "second@example.com", "password": "password456"},
    )

    assert response.status_code == 200
    assert response.json()["user_id"] == second.json()["user_id"]


@pytest.mark.asyncio
async def test_login_fails_with_wrong_password(ac):
    await signup(ac)

    response = await ac.post(
        "/login",
        json={"email": USER["email"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}


@pytest.mark.asyncio
async def test_login_fails_with_unknown_email(ac):
    await signup(ac)

    response = await ac.post(
        "/login",
        json={"email": "nobody@example.com", "password": USER["password"]},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}

