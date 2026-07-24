from __future__ import annotations

from sqlalchemy import ColumnElement, DateTime, Float, ForeignKey, Integer, String, Text, and_, or_
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base
from datetime import datetime, timedelta, timezone

FSRS_LEARNING = 1
FSRS_RELEARNING = 3
LEARN_AHEAD = timedelta(minutes=20)


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
        return sum(1 for card in self.cards if card.is_due)
        

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
    @hybrid_property
    def is_due(self) -> bool:
        now = datetime.now(timezone.utc)

        if self.due <= now:
            return True

        return (
            self.fsrs_state in (FSRS_LEARNING, FSRS_RELEARNING)
            and self.due <= now + LEARN_AHEAD
        )

    @is_due.inplace.expression
    @classmethod
    def _is_due_expression(cls) -> ColumnElement[bool]:
        now = datetime.now(timezone.utc)

        return or_(
            cls.due <= now,
            and_(
                cls.fsrs_state.in_((FSRS_LEARNING, FSRS_RELEARNING)),
                cls.due <= now + LEARN_AHEAD,
            ),
        )
    
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

class ReviewEvent(Base):
    __tablename__ = "review_events"

    id: Mapped[int] = mapped_column(primary_key=True)

    card_id: Mapped[int] = mapped_column(
        ForeignKey("cards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    rating: Mapped[int] = mapped_column(nullable=False)

    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    duration_ms: Mapped[int | None] = mapped_column(nullable=True)

    before_state: Mapped[int] = mapped_column(nullable=False)
    before_step: Mapped[int | None] = mapped_column(nullable=True)
    before_stability: Mapped[float | None] = mapped_column(nullable=True)
    before_difficulty: Mapped[float | None] = mapped_column(nullable=True)
    before_due: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    before_last_review: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    after_state: Mapped[int] = mapped_column(nullable=False)
    after_step: Mapped[int | None] = mapped_column(nullable=True)
    after_stability: Mapped[float | None] = mapped_column(nullable=True)
    after_difficulty: Mapped[float | None] = mapped_column(nullable=True)
    after_due: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    after_last_review: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    undone_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    
    
