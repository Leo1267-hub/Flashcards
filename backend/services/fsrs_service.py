from fsrs import Card as FSRSCard
from fsrs import Rating, Scheduler, State

from backend.models import Card


scheduler = Scheduler()


def to_fsrs_card(card: Card) -> FSRSCard:
    return FSRSCard(
        card_id=card.id,
        state=State(card.fsrs_state),
        step=card.fsrs_step,
        stability=card.stability,
        difficulty=card.difficulty,
        due=card.due,
        last_review=card.last_review,
    )
    
def apply_fsrs_card(
    database_card: Card,
    fsrs_card: FSRSCard,
) -> None:
    database_card.fsrs_state = fsrs_card.state.value
    database_card.fsrs_step = fsrs_card.step
    database_card.stability = fsrs_card.stability
    database_card.difficulty = fsrs_card.difficulty
    database_card.due = fsrs_card.due
    database_card.last_review = fsrs_card.last_review