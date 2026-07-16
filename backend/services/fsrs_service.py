from fsrs import Card as FSRSCard
from fsrs import Rating, Scheduler, State
from datetime import datetime, timezone
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
    

def get_review_options(card: Card) -> dict[Rating,dict]:
    fsrs_card = to_fsrs_card(card)
    options = {}
    review_time = datetime.now(timezone.utc)
    for rating in Rating:
        review_card,_ = scheduler.review_card(fsrs_card, rating, review_time)
        interval_seconds = max(0,  (review_card.due - review_time).total_seconds())
        options[rating] = {
            'rating': rating.value,
            'due': review_card.due,
            'interval_seconds': interval_seconds
        }
    return options