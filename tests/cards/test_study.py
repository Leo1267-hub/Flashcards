from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import update

from backend.models import Card
from tests.conftest import TestSessionLocal
from tests.helpers import create_card, create_deck


REVIEW = 2
LEARNING = 1
RELEARNING = 3


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("fsrs_state", "due_in", "is_included"),
    [
        pytest.param(REVIEW, timedelta(0), True, id="review-due-now"),
        pytest.param(
            LEARNING,
            timedelta(minutes=10),
            True,
            id="learning-due-in-10-minutes",
        ),
        pytest.param(
            RELEARNING,
            timedelta(minutes=10),
            True,
            id="relearning-due-in-10-minutes",
        ),
        pytest.param(
            REVIEW,
            timedelta(minutes=10),
            False,
            id="review-due-in-10-minutes",
        ),
        pytest.param(
            LEARNING,
            timedelta(days=1),
            False,
            id="learning-due-tomorrow",
        ),
        pytest.param(
            REVIEW,
            timedelta(days=1),
            False,
            id="review-due-tomorrow",
        ),
        pytest.param(
            RELEARNING,
            timedelta(days=1),
            False,
            id="relearning-due-tomorrow",
        ),
    ],
)
async def test_get_study_cards_respects_due_time_and_learn_ahead(
    auth_ac,
    fsrs_state,
    due_in,
    is_included,
):
    deck = await create_deck(auth_ac)
    card = await create_card(auth_ac, deck["id"])
    due = datetime.now(timezone.utc) + due_in

    async with TestSessionLocal() as db:
        await db.execute(
            update(Card)
            .where(Card.id == card["id"])
            .values(fsrs_state=fsrs_state, due=due)
        )
        await db.commit()

    response = await auth_ac.get(f'/decks/{deck["id"]}/study-cards')

    assert response.status_code == 200
    returned_card_ids = {item["id"] for item in response.json()}
    assert (card["id"] in returned_card_ids) is is_included
