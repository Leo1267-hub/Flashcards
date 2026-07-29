from pathlib import Path
from uuid import uuid4

from anyio import to_thread
from fastapi import HTTPException, UploadFile

from backend.config import settings


MEDIA_URL_PATH = "/media"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
CHUNK_BYTES = 64 * 1024

MEDIA_ROOT = Path(settings.media_root)

IMAGE_SIGNATURES: tuple[tuple[bytes, str], ...] = (
    (b"\xff\xd8\xff", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
)


def _detect_extension(data: bytes) -> str | None:
    for signature, extension in IMAGE_SIGNATURES:
        if data.startswith(signature):
            return extension

    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"

    return None


async def _read_within_limit(upload: UploadFile) -> bytes:
    chunks: list[bytes] = []
    total = 0

    while chunk := await upload.read(CHUNK_BYTES):
        total += len(chunk)
        if total > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Image must be 5 MB or smaller",
            )
        chunks.append(chunk)

    return b"".join(chunks)


def _write_file(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _remove_file(path: Path) -> None:
    path.unlink(missing_ok=True)


def build_image_url(key: str | None) -> str | None:
    if key is None:
        return None

    return f"{settings.media_base_url.rstrip('/')}/{key}"


async def save_card_image(upload: UploadFile, user_id: int) -> str:
    """Store an uploaded image and return its stable key."""
    data = await _read_within_limit(upload)
    extension = _detect_extension(data)

    if extension is None:
        raise HTTPException(
            status_code=400,
            detail="Image must be a JPEG, PNG, WebP, or GIF file",
        )

    key = f"users/{user_id}/cards/{uuid4()}.{extension}"
    await to_thread.run_sync(_write_file, MEDIA_ROOT / key, data)

    return key


async def delete_image(key: str | None) -> None:
    if key is None:
        return

    await to_thread.run_sync(_remove_file, MEDIA_ROOT / key)


async def delete_images(keys: list[str | None]) -> None:
    for key in keys:
        await delete_image(key)
