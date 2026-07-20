import type { Card } from "../types/card";

export type LearningQueueItem = {
    card: Card;
    dueAt: number;
};

const LEARN_AHEAD_MS = 20 * 60 * 1000;

export type NextCardResult = {
    card: Card | null;
    learningQueue: LearningQueueItem[];
    remainingCards: Card[];
    isFinished: boolean;
};

function findLearningCardIndex(
    queue: LearningQueueItem[],
    latestAllowedTime: number,
    previousCardId: number | null,
): number {
    const differentCardIndex = queue.findIndex(
        (item) =>
            item.dueAt <= latestAllowedTime &&
            item.card.id !== previousCardId
    );

    if (differentCardIndex !== -1) {
        return differentCardIndex;
    }

    return queue.findIndex((item) => item.dueAt <= latestAllowedTime);
}

export function getNextCard(
    learningQueue: LearningQueueItem[],
    remainingCards: Card[],
    previousCardId: number | null = null,
    now = Date.now(),
): NextCardResult {
    const dueLearningIndex = findLearningCardIndex(
        learningQueue,
        now,
        previousCardId,
    );

    if (dueLearningIndex !== -1) {
        const nextItem = learningQueue[dueLearningIndex];
        return {
            card: nextItem.card,
            learningQueue: learningQueue.filter(
                (_, index) => index !== dueLearningIndex
            ),
            remainingCards,
            isFinished: false,
        };
    }

    if (remainingCards.length > 0) {
        const [nextCard, ...rest] = remainingCards;
        return {
            card: nextCard,
            learningQueue,
            remainingCards: rest,
            isFinished: false,
        };
    }

    const learnAheadIndex = findLearningCardIndex(
        learningQueue,
        now + LEARN_AHEAD_MS,
        previousCardId,
    );

    if (learnAheadIndex !== -1) {
        const nextItem = learningQueue[learnAheadIndex];
        return {
            card: nextItem.card,
            learningQueue: learningQueue.filter(
                (_, index) => index !== learnAheadIndex
            ),
            remainingCards,
            isFinished: false,
        };
    }

    return {
        card: null,
        learningQueue,
        remainingCards,
        isFinished: true,
    };
}
