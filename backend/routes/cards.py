from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from backend.database import get_db
from backend.models import Card
from backend.schemas.cards import CardCreate, CardResponse, CardUpdate,CardReview, CardReviewOptions
from backend.services.helpers import check_card, check_deck, get_current_user
from fsrs import Rating
from backend.services.fsrs_service import (
    apply_fsrs_card,
    scheduler,
    to_fsrs_card,
    get_review_options
)

router = APIRouter(tags=["Cards"])


@router.post("/decks/{deck_id}/cards", status_code=201, response_model=CardResponse,)
async def create_card(
    deck_id: int,
    card: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    await check_deck(deck_id, db, current_user)
    db_card = Card(deck_id=deck_id, front=card.front, back=card.back)
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card


@router.get("/decks/{deck_id}/cards/due", response_model=list[CardResponse])
async def get_deck_cards(deck_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_deck(deck_id, db, current_user)
    query = (
    select(Card)
    .where(
        Card.deck_id == deck_id,
        Card.due <= datetime.now(timezone.utc),
    )
    .order_by(Card.due)
)
    return (await db.scalars(query)).all()

@router.get("/decks/{deck_id}/cards", response_model=list[CardResponse])
async def get_deck_cards(
    deck_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await check_deck(deck_id, db, current_user)

    query = (
        select(Card)
        .where(Card.deck_id == deck_id)
        .order_by(Card.id)
    )

    return (await db.scalars(query)).all()


@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(card_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await check_card(card_id, db, current_user)


@router.patch("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: int,
    updates: CardUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    card = await check_card(card_id, db, current_user)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    await db.commit()
    await db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=204)
async def delete_card(card_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    card = await check_card(card_id, db, current_user)
    await db.delete(card)
    await db.commit()
    
    

@router.post("/cards/{card_id}/review", response_model=CardResponse)
async def review_card(
    card_id: int,
    review: CardReview,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await check_card(card_id, db, current_user)
    fsrs_card = to_fsrs_card(card)

    updated_fsrs_card, review_log = scheduler.review_card(
        fsrs_card,
        Rating(review.rating),
    )

    apply_fsrs_card(card, updated_fsrs_card)

    await db.commit()
    await db.refresh(card)

    return card


@router.get(
    "/cards/{card_id}/review-options",
    response_model=CardReviewOptions,
)
async def get_card_review_options(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await check_card(card_id, db, current_user)

    options = get_review_options(card)

    return {
        "again": options[Rating.Again],
        "hard": options[Rating.Hard],
        "good": options[Rating.Good],
        "easy": options[Rating.Easy],
    }