from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict, computed_field
from enum import Enum, IntEnum

from backend.services.storage import build_image_url


class CardSide(str, Enum):
    FRONT = "front"
    BACK = "back"


class CardRating(IntEnum):
    AGAIN = 1
    HARD = 2
    GOOD = 3
    EASY = 4


class CardReview(BaseModel):
    rating: CardRating


class CardCreate(BaseModel):
    front: str = Field(min_length=1, max_length=500)
    back: str = Field(min_length=1, max_length=500)


class CardUpdate(BaseModel):
    front: str | None = Field(default=None, min_length=1, max_length=500)
    back: str | None = Field(default=None, min_length=1, max_length=500)


class CardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    deck_id: int
    front: str
    back: str
    fsrs_state: int
    fsrs_step: int | None
    stability: float | None
    difficulty: float | None
    due: datetime
    last_review: datetime | None

    front_image_key: str | None = Field(default=None, exclude=True)
    back_image_key: str | None = Field(default=None, exclude=True)

    @computed_field
    @property
    def front_image_url(self) -> str | None:
        return build_image_url(self.front_image_key)

    @computed_field
    @property
    def back_image_url(self) -> str | None:
        return build_image_url(self.back_image_key)


class CardReviewResponse(BaseModel):
    card: CardResponse
    review_id: int


class RatingPreview(BaseModel):
    rating: CardRating
    due: datetime
    interval_seconds: int


class CardReviewOptions(BaseModel):
    again: RatingPreview
    hard: RatingPreview
    good: RatingPreview
    easy: RatingPreview
