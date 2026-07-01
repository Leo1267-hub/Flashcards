from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.models import Card, Deck


def check_deck(deck_id: int, db: Session) -> Deck:
    deck = db.get(Deck, deck_id)
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


def check_card(card_id: int, db: Session) -> Card:
    card = db.get(Card, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card
