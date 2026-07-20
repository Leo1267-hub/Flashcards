import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Card } from "../types/card";
import { getNextCard, type LearningQueueItem } from "./studyQueue.ts";

const NOW = 1_000_000;
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

function makeCard(id: number): Card {
    return {
        id,
        deck_id: 1,
        front: `Card ${id}`,
        back: `Answer ${id}`,
        fsrs_state: 2,
        fsrs_step: null,
        stability: null,
        difficulty: null,
        due: new Date(NOW).toISOString(),
        last_review: null,
    };
}

function learningItem(card: Card, dueAt: number): LearningQueueItem {
    return { card, dueAt };
}

describe("getNextCard", () => {
    it("chooses a due learning card", () => {
        const card = makeCard(1);

        const result = getNextCard(
            [learningItem(card, NOW)],
            [makeCard(2)],
            null,
            NOW,
        );

        assert.equal(result.card?.id, card.id);
        assert.equal(result.isFinished, false);
    });

    it("chooses a normal card when no learning card is due", () => {
        const normalCard = makeCard(2);

        const result = getNextCard(
            [learningItem(makeCard(1), NOW + TEN_MINUTES)],
            [normalCard],
            null,
            NOW,
        );

        assert.equal(result.card?.id, normalCard.id);
    });

    it("chooses a learning card early when no normal cards remain", () => {
        const learningCard = makeCard(1);

        const result = getNextCard(
            [learningItem(learningCard, NOW + TEN_MINUTES)],
            [],
            null,
            NOW,
        );

        assert.equal(result.card?.id, learningCard.id);
    });

    it("chooses A instead of the previous card C when both are eligible", () => {
        const cardA = makeCard(1);
        const cardC = makeCard(3);

        const result = getNextCard(
            [learningItem(cardC, NOW), learningItem(cardA, NOW)],
            [],
            cardC.id,
            NOW,
        );

        assert.equal(result.card?.id, cardA.id);
    });

    it("allows C to repeat when no alternative exists", () => {
        const cardC = makeCard(3);

        const result = getNextCard(
            [learningItem(cardC, NOW)],
            [],
            cardC.id,
            NOW,
        );

        assert.equal(result.card?.id, cardC.id);
    });

    it("finishes when no card is eligible", () => {
        const result = getNextCard(
            [learningItem(makeCard(1), NOW + THIRTY_MINUTES)],
            [],
            null,
            NOW,
        );

        assert.equal(result.card, null);
        assert.equal(result.isFinished, true);
    });
});
