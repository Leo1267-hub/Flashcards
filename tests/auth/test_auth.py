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
async def test_signup_rejects_duplicate_username_or_email(ac):
    first_response = await signup(ac)
    duplicate_username = await signup(
        ac,
        email="different@example.com",
    )
    duplicate_email = await signup(
        ac,
        username="differentuser",
    )

    assert first_response.status_code == 200
    assert duplicate_username.status_code == 400
    assert duplicate_username.json() == {
        "detail": "Username or email already registered"
    }
    assert duplicate_email.status_code == 400
    assert duplicate_email.json() == {
        "detail": "Username or email already registered"
    }


@pytest.mark.asyncio
async def test_login_succeeds_with_correct_credentials(ac):
    await signup(ac)

    response = await ac.post(
        "/login",
        json={"username": USER["username"], "password": USER["password"]},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "successfully", "user_id": 1, "access_token": response.cookies.get("access_token")}
    assert response.cookies.get("access_token") is not None


@pytest.mark.asyncio
async def test_login_fails_with_wrong_password(ac):
    await signup(ac)

    response = await ac.post(
        "/login",
        json={"username": USER["username"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid credentials"}
    
