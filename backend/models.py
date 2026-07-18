from __future__ import annotations

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base
from datetime import datetime, timezone



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
    
    user_id :Mapped[int] = mapped_column(
        ForeignKey('users.id'),
        nullable=False,
        )
    user: Mapped["User"] = relationship(back_populates="decks")
    
    @property
    def card_count(self) -> int:
        return len(self.cards)
    
    @property
    def due_count(self) -> int:
        now = datetime.now(timezone.utc)

        return sum(
            1
            for card in self.cards
            if card.due <= now
        )
        

class Card(Base):
    __tablename__ = 'cards'
    
    id: Mapped[int] = mapped_column(primary_key = True)
    deck_id: Mapped[int] = mapped_column(ForeignKey('decks.id'),
                                         nullable=False
                                         )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    fsrs_state: Mapped[int] = mapped_column(
    Integer,
    nullable=False,
    default=1,
)

    fsrs_step: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=0,
    )

    stability: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    difficulty: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    due: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    last_review: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
        
    deck: Mapped[Deck] = relationship(back_populates='cards')
    
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    decks: Mapped[list["Deck"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        )
    
    
    
