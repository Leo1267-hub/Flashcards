from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Deck
from backend.schemas.decks import DeckCreate, DeckResponse, DeckUpdate
from backend.services.helpers import check_deck

router = APIRouter(prefix="/decks", tags=["Decks"])


@router.get("", response_model=list[DeckResponse])
def get_decks(
    limit: int | None = Query(default=None, gt=0, le=100),
    db: Session = Depends(get_db),
):
    query = select(Deck)
    if limit is not None:
        query = query.limit(limit)
    return db.scalars(query).all()


@router.get("/{deck_id}", response_model=DeckResponse)
def get_one_deck(deck_id: int, db: Session = Depends(get_db)):
    return check_deck(deck_id, db)


@router.post("", status_code=201, response_model=DeckResponse)
def create_deck(deck: DeckCreate, db: Session = Depends(get_db)):
    db_deck = Deck(name=deck.name, description=deck.description)
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck


@router.patch("/{deck_id}", response_model=DeckResponse)
def update_deck(
    deck_id: int,
    update: DeckUpdate,
    db: Session = Depends(get_db),
):
    deck = check_deck(deck_id, db)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(deck, field, value)
    db.commit()
    db.refresh(deck)
    return deck


@router.delete("/{deck_id}", status_code=204)
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = check_deck(deck_id, db)
    db.delete(deck)
    db.commit()
