from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base

class Deck(Base):
    __tablename__ = 'decks'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name:Mapped[str] = mapped_column(String(100),nullable = False)
    
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable = True
    )
    
    cards: Mapped[list[Card]] = relationship(
        back_populates='deck',
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    @property
    def card_count(self) -> int:
        return len(self.cards)
        

class Card(Base):
    __tablename__ = 'cards'
    
    id: Mapped[int] = mapped_column(primary_key = True)
    deck_id: Mapped[int] = mapped_column(ForeignKey('decks.id'),
                                         nullable=False
                                         )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    
    deck: Mapped[Deck] = relationship(back_populates='cards')
    
    
    
