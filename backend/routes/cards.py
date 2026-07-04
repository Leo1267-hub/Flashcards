from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Card
from backend.schemas.cards import CardCreate, CardResponse, CardUpdate
from backend.services.helpers import check_card, check_deck, get_current_user

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


@router.get("/decks/{deck_id}/cards", response_model=list[CardResponse])
async def get_deck_cards(deck_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_deck(deck_id, db, current_user)
    query = select(Card).where(Card.deck_id == deck_id)
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
