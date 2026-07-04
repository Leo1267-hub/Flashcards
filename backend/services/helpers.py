from fastapi import HTTPException,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth import auth
from backend.models import Card, Deck, User
from backend.database import get_db
from sqlalchemy import select

async def check_deck(deck_id: int, db: AsyncSession, current_user: User) -> Deck:
    deck = await db.get(Deck, deck_id).where(Deck.user_id == current_user.id)
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


async def check_card(card_id: int, db: AsyncSession) -> Card:
    card = await db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

async def get_current_user(
    payload=Depends(auth.access_token_required),
    db: AsyncSession = Depends(get_db),
) -> User:
    username = payload.sub

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return user