from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Card, Deck


async def check_deck(deck_id: int, db: AsyncSession) -> Deck:
    deck = await db.get(Deck, deck_id)
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


async def check_card(card_id: int, db: AsyncSession) -> Card:
    card = await db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card
