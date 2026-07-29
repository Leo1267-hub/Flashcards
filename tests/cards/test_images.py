import base64

import pytest

from backend.config import settings
from backend.services.storage import MAX_IMAGE_BYTES
from tests.helpers import create_card, create_deck
from tests.test_ownership import authenticate_as


PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)
GIF_BYTES = b"GIF89a" + b"\x00" * 16
WEBP_BYTES = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 16


def key_from_url(url: str) -> str:
    return url.removeprefix(settings.media_base_url.rstrip("/") + "/")


async def upload_image(
    auth_ac,
    card_id,
    side="front",
    content=PNG_BYTES,
    filename="photo.png",
    content_type="image/png",
):
    return await auth_ac.put(
        f"/cards/{card_id}/images/{side}",
        files={"image": (filename, content, content_type)},
    )


@pytest.mark.asyncio
async def test_card_without_images_has_null_image_urls(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    assert card["front_image_url"] is None
    assert card["back_image_url"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize("side", ["front", "back"])
async def test_upload_image_stores_file_and_returns_url(auth_ac, media_root, side):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(auth_ac, card["id"], side=side)

    assert response.status_code == 200
    data = response.json()

    other_side = "back" if side == "front" else "front"
    assert data[f"{other_side}_image_url"] is None

    key = key_from_url(data[f"{side}_image_url"])
    assert key.startswith("users/1/cards/")
    assert key.endswith(".png")
    assert (media_root / key).read_bytes() == PNG_BYTES


@pytest.mark.asyncio
async def test_upload_image_keeps_card_text_untouched(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(auth_ac, card["id"])

    assert response.json()["front"] == card["front"]
    assert response.json()["back"] == card["back"]


@pytest.mark.asyncio
async def test_both_sides_can_hold_different_images(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    await upload_image(auth_ac, card["id"], side="front")
    response = await upload_image(auth_ac, card["id"], side="back")

    data = response.json()
    front_key = key_from_url(data["front_image_url"])
    back_key = key_from_url(data["back_image_url"])

    assert front_key != back_key
    assert (media_root / front_key).exists()
    assert (media_root / back_key).exists()


@pytest.mark.asyncio
async def test_upload_ignores_the_uploaded_filename(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(
        auth_ac,
        card["id"],
        filename="../../../etc/passwd.png",
    )

    key = key_from_url(response.json()["front_image_url"])
    assert ".." not in key
    assert "passwd" not in key


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("content", "extension"),
    [
        (PNG_BYTES, ".png"),
        (GIF_BYTES, ".gif"),
        (WEBP_BYTES, ".webp"),
    ],
)
async def test_extension_comes_from_file_contents(auth_ac, content, extension):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(
        auth_ac,
        card["id"],
        content=content,
        filename="upload.txt",
        content_type="text/plain",
    )

    assert response.status_code == 200
    assert key_from_url(response.json()["front_image_url"]).endswith(extension)


@pytest.mark.asyncio
async def test_replacing_an_image_deletes_the_previous_file(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    first = await upload_image(auth_ac, card["id"])
    first_key = key_from_url(first.json()["front_image_url"])

    second = await upload_image(auth_ac, card["id"], content=GIF_BYTES)
    second_key = key_from_url(second.json()["front_image_url"])

    assert first_key != second_key
    assert not (media_root / first_key).exists()
    assert (media_root / second_key).exists()


@pytest.mark.asyncio
async def test_delete_image_clears_url_and_removes_file(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    upload = await upload_image(auth_ac, card["id"])
    key = key_from_url(upload.json()["front_image_url"])

    response = await auth_ac.delete(f'/cards/{card["id"]}/images/front')

    assert response.status_code == 200
    assert response.json()["front_image_url"] is None
    assert not (media_root / key).exists()

    fetched = await auth_ac.get(f'/cards/{card["id"]}')
    assert fetched.json()["front_image_url"] is None


@pytest.mark.asyncio
async def test_delete_image_when_none_exists_succeeds(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await auth_ac.delete(f'/cards/{card["id"]}/images/back')

    assert response.status_code == 200
    assert response.json()["back_image_url"] is None


@pytest.mark.asyncio
async def test_delete_image_leaves_the_other_side_alone(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    await upload_image(auth_ac, card["id"], side="front")
    back = await upload_image(auth_ac, card["id"], side="back")
    back_key = key_from_url(back.json()["back_image_url"])

    response = await auth_ac.delete(f'/cards/{card["id"]}/images/front')

    assert response.json()["front_image_url"] is None
    assert response.json()["back_image_url"] is not None
    assert (media_root / back_key).exists()


@pytest.mark.asyncio
async def test_upload_rejects_a_non_image_file(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(
        auth_ac,
        card["id"],
        content=b"just some text",
        filename="notes.png",
        content_type="image/png",
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Image must be a JPEG, PNG, WebP, or GIF file"
    }


@pytest.mark.asyncio
async def test_upload_rejects_an_oversized_image(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(
        auth_ac,
        card["id"],
        content=PNG_BYTES + b"0" * MAX_IMAGE_BYTES,
    )

    assert response.status_code == 413
    assert response.json() == {"detail": "Image must be 5 MB or smaller"}


@pytest.mark.asyncio
async def test_upload_rejects_an_unknown_side(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await upload_image(auth_ac, card["id"], side="middle")

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_requires_a_file(auth_ac):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    response = await auth_ac.put(f'/cards/{card["id"]}/images/front')

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upload_to_a_missing_card_returns_404(auth_ac):
    response = await upload_image(auth_ac, 999999)

    assert response.status_code == 404
    assert response.json() == {"detail": "Card not found"}


@pytest.mark.asyncio
async def test_upload_to_another_users_card_returns_404(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    await authenticate_as(auth_ac, username="otheruser", email="other@example.com")

    upload_response = await upload_image(auth_ac, card["id"])
    delete_response = await auth_ac.delete(f'/cards/{card["id"]}/images/front')

    assert upload_response.status_code == 404
    assert delete_response.status_code == 404
    assert list(media_root.rglob("*.png")) == []


@pytest.mark.asyncio
async def test_deleting_a_card_removes_its_image_files(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])

    front = await upload_image(auth_ac, card["id"], side="front")
    back = await upload_image(auth_ac, card["id"], side="back")
    front_key = key_from_url(front.json()["front_image_url"])
    back_key = key_from_url(back.json()["back_image_url"])

    response = await auth_ac.delete(f'/cards/{card["id"]}')

    assert response.status_code == 204
    assert not (media_root / front_key).exists()
    assert not (media_root / back_key).exists()


@pytest.mark.asyncio
async def test_deleting_a_deck_removes_its_card_image_files(auth_ac, media_root):
    deck = await create_deck(auth_ac)
    first = await create_card(auth_ac, deck["id"])
    second = await create_card(auth_ac, deck["id"], front="Second", back="Card")

    first_upload = await upload_image(auth_ac, first["id"])
    second_upload = await upload_image(auth_ac, second["id"], side="back")
    keys = [
        key_from_url(first_upload.json()["front_image_url"]),
        key_from_url(second_upload.json()["back_image_url"]),
    ]

    response = await auth_ac.delete(f'/decks/{deck["id"]}')

    assert response.status_code == 204
    for key in keys:
        assert not (media_root / key).exists()


@pytest.mark.asyncio
async def test_image_endpoints_require_login(ac):
    upload_response = await ac.put(
        "/cards/1/images/front",
        files={"image": ("photo.png", PNG_BYTES, "image/png")},
    )
    delete_response = await ac.delete("/cards/1/images/front")

    assert upload_response.status_code == 401
    assert delete_response.status_code == 401
