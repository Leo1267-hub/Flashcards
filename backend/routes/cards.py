from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from backend.database import get_db
from backend.models import Card, ReviewEvent
from backend.schemas.cards import (
    CardCreate,
    CardResponse,
    CardUpdate,
    CardReview,
    CardReviewOptions,
    CardReviewResponse,
)
from backend.services.helpers import check_card, check_deck, get_current_user
from fsrs import Rating
from backend.services.fsrs_service import (
    apply_fsrs_card,
    scheduler,
    to_fsrs_card,
    get_review_options,
)

FSRS_LEARNING = 1
FSRS_RELEARNING = 3
LEARN_AHEAD_MINUTES = 20

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
    
    

@router.post("/cards/{card_id}/review", response_model=CardReviewResponse)
async def review_card(
    card_id: int,
    review: CardReview,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await check_card(card_id, db, current_user)

    reviewed_at = datetime.now(timezone.utc)

    before_state = card.fsrs_state
    before_step = card.fsrs_step
    before_stability = card.stability
    before_difficulty = card.difficulty
    before_due = card.due
    before_last_review = card.last_review

    updated_fsrs_card, _fsrs_review_log = scheduler.review_card(
        to_fsrs_card(card),
        Rating(review.rating),
        reviewed_at,
    )

    event = ReviewEvent(
        card_id=card.id,
        user_id=current_user.id,
        rating=review.rating.value,
        reviewed_at=reviewed_at,
        before_state=before_state,
        before_step=before_step,
        before_stability=before_stability,
        before_difficulty=before_difficulty,
        before_due=before_due,
        before_last_review=before_last_review,
        after_state=updated_fsrs_card.state.value,
        after_step=updated_fsrs_card.step,
        after_stability=updated_fsrs_card.stability,
        after_difficulty=updated_fsrs_card.difficulty,
        after_due=updated_fsrs_card.due,
        after_last_review=updated_fsrs_card.last_review,
    )

    apply_fsrs_card(card, updated_fsrs_card)
    db.add(event)

    await db.commit()
    await db.refresh(card)
    await db.refresh(event)

    return CardReviewResponse(
        card=card,
        review_id=event.id,
    )


@router.post("/reviews/{review_id}/undo", response_model=CardResponse)
async def undo_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = await db.get(ReviewEvent, review_id)
    if event is None or event.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review not found")

    if event.undone_at is not None:
        raise HTTPException(status_code=409, detail="Review already undone")

    latest_active_id = await db.scalar(
        select(ReviewEvent.id)
        .where(
            ReviewEvent.card_id == event.card_id,
            ReviewEvent.undone_at.is_(None),
        )
        .order_by(ReviewEvent.reviewed_at.desc(), ReviewEvent.id.desc())
        .limit(1)
    )
    if latest_active_id != event.id:
        raise HTTPException(
            status_code=409,
            detail="Only the latest review for this card can be undone",
        )

    card = await db.get(Card, event.card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    card.fsrs_state = event.before_state
    card.fsrs_step = event.before_step
    card.stability = event.before_stability
    card.difficulty = event.before_difficulty
    card.due = event.before_due
    card.last_review = event.before_last_review

    event.undone_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(card)

    return card


@router.post("/reviews/{review_id}/redo", response_model=CardResponse)
async def redo_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    event = await db.get(ReviewEvent, review_id)
    if event is None or event.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review not found")

    if event.undone_at is  None:
        raise HTTPException(status_code=409, detail="Review not undone")

    latest_undone_id = await db.scalar(
        select(ReviewEvent.id)
        .where(
            ReviewEvent.card_id == event.card_id,
            ReviewEvent.undone_at.is_not(None),
        )
        .order_by(ReviewEvent.reviewed_at.desc(), ReviewEvent.id.desc())
        .limit(1)
    )
    if latest_undone_id != event.id:
        raise HTTPException(
            status_code=409,
            detail="Only the latest undone review for this card can be redone",
        )

    card = await db.get(Card, event.card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    card.fsrs_state = event.after_state
    card.fsrs_step = event.after_step
    card.stability = event.after_stability
    card.difficulty = event.after_difficulty
    card.due = event.after_due
    card.last_review = event.after_last_review

    event.undone_at = None

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
    
@router.get('/decks/{deck_id}/study-cards', response_model=list[CardResponse],)
async def get_study_cards(
    deck_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await check_deck(deck_id, db, current_user)

    now = datetime.now(timezone.utc)
    learn_ahead_time = now + timedelta(minutes=LEARN_AHEAD_MINUTES)

    query = (
        select(Card).where(
            Card.deck_id == deck_id,
            or_(
                Card.due <= now,
                and_(
                    Card.fsrs_state.in_([FSRS_LEARNING, FSRS_RELEARNING]),
                    Card.due <= learn_ahead_time,
                ),
            ),
        ).order_by(Card.due)
    )
    

    return (await db.scalars(query)).all()