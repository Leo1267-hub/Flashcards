from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Card, Deck
from backend.schemas.decks import DeckCreate, DeckResponse, DeckUpdate
from backend.services.helpers import check_deck, get_current_user

router = APIRouter(prefix="/decks", tags=["Decks"])


@router.get("", response_model=list[DeckResponse])
async def get_decks(
    limit: int | None = Query(default=None, gt=0, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = select(Deck).where(Deck.user_id == current_user.id)
    if limit is not None:
        query = query.limit(limit)
    return (await db.scalars(query)).all()


@router.get("/{deck_id}", response_model=DeckResponse)
async def get_one_deck(deck_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    return await check_deck(deck_id, db, current_user)

@router.get("", response_model=list[DeckResponse])
async def get_decks(
    limit: int | None = Query(default=None, gt=0, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    query = (
        select(
            Deck.id,
            Deck.name,
            Deck.description,
            func.count(Card.id).label("card_count"),
            func.count(
                case(
                    (Card.due <= now, 1),
                )
            ).label("due_count"),
        )
        .outerjoin(Card, Card.deck_id == Deck.id)
        .where(Deck.user_id == current_user.id)
        .group_by(
            Deck.id,
            Deck.name,
            Deck.description,
        )
        .order_by(Deck.id)
    )

    if limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)

    return [
        dict(row)
        for row in result.mappings().all()
    ]
@router.post("", status_code=201, response_model=DeckResponse)
async def create_deck(deck: DeckCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    db_deck = Deck(name=deck.name, description=deck.description, user_id=current_user.id)
    db.add(db_deck)
    await db.commit()
    await db.refresh(db_deck)
    return db_deck


@router.patch("/{deck_id}", response_model=DeckResponse)
async def update_deck(
    deck_id: int,
    update: DeckUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    deck = await check_deck(deck_id, db,current_user)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(deck, field, value)
    await db.commit()
    await db.refresh(deck)
    return deck


@router.delete("/{deck_id}", status_code=204)
async def delete_deck(deck_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    deck = await check_deck(deck_id, db, current_user)
    await db.delete(deck)
    await db.commit()
