from pydantic import BaseModel, Field


class ActivityDay(BaseModel):
    date: str = Field(description="Local calendar date as YYYY-MM-DD")
    count: int


class ActivityResponse(BaseModel):
    total_reviews: int
    active_days: int
    max_streak: int
    days: list[ActivityDay]
