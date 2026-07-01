from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Card
from backend.schemas.cards import CardCreate, CardResponse, CardUpdate
from backend.services.helpers import check_card, check_deck

router = APIRouter(tags=["Cards"])


@router.post("/decks/{deck_id}/cards", status_code=201, response_model=CardResponse)
def create_card(
    deck_id: int,
    card: CardCreate,
    db: Session = Depends(get_db),
):
    check_deck(deck_id, db)
    db_card = Card(deck_id=deck_id, front=card.front, back=card.back)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


@router.get("/decks/{deck_id}/cards", response_model=list[CardResponse])
def get_deck_cards(deck_id: int, db: Session = Depends(get_db)):
    check_deck(deck_id, db)
    query = select(Card).where(Card.deck_id == deck_id)
    return db.scalars(query).all()


@router.get("/cards/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    return check_card(card_id, db)


@router.patch("/cards/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    updates: CardUpdate,
    db: Session = Depends(get_db),
):
    card = check_card(card_id, db)
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(card_id: int, db: Session = Depends(get_db)):
    card = check_card(card_id, db)
    db.delete(card)
    db.commit()
