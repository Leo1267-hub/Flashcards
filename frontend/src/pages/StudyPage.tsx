import type { Card } from "../types/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import type { ReviewOptions, Rating } from "../types/rating";

function StudyPage() {

    const { deckId } = useParams<{ deckId: string }>();

    const [isFinished, setIsFinished] = useState(false);
    const [remainingCards, setRemainingCards] = useState<Card[]>([]);
    const [learningQueue, setLearningQueue] =
        useState<LearningQueueItem[]>([]);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRating, setIsRating] = useState(false);
    const [message, setMessage] = useState("");
    const [reviewOptions, setReviewOptions] =
        useState<ReviewOptions | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] =
        useState(false);

    type LearningQueueItem = {
        card: Card;
        dueAt: number;
    };

    useEffect(() => {
        async function loadCards() {
            if (!deckId) {
                setMessage("Invalid deck ID");
                setIsLoading(false);
                return;
            }

            try {
                const cardsData: Card[] = await apiFetch(
                    `/decks/${deckId}/cards/due`
                );

                if (cardsData.length === 0) {
                    setRemainingCards([]);
                    setCurrentCard(null);
                    return;
                }

                const [firstCard, ...rest] = cardsData;

                setCurrentCard(firstCard);
                setRemainingCards(rest);
            } catch {
                setMessage("Failed to load cards");
            } finally {
                setIsLoading(false);
            }
        }
        loadCards();
    }, [deckId]
    );

    async function showAnswer() {
        if (!currentCard) return;

        setIsAnswerVisible(true);
        setIsLoadingOptions(true);
        setMessage("");

        try {
            const options = await apiFetch(
                `/cards/${currentCard.id}/review-options`
            );

            setReviewOptions(options);
        } catch {
            setMessage("Could not calculate review intervals");
        } finally {
            setIsLoadingOptions(false);
        }
    }

    async function rateCard(rating: Rating) {
        if (isRating) return;

        const currentCard = cards[currentIndex];
        if (!currentCard) return;

        setIsRating(true);
        try {
            await apiFetch(`/cards/${currentCard.id}/review`, {
                method: "POST",
                body: JSON.stringify({ rating }),
            });

            moveToNextCard();
        } catch {
            setMessage("Could not save review");
        } finally {
            setIsRating(false);
        }
    }

    function moveToNextCard() {
        setReviewOptions(null);
        if (currentIndex + 1 < cards.length) {
            setCurrentIndex(currentIndex + 1);
            setIsAnswerVisible(false);
        } else {
            setIsFinished(true);
        }
    }

    useEffect(() => {
        function handleRatingKey(event: KeyboardEvent) {
            const target = event.target;
            if (
                event.repeat ||
                isFinished ||
                isRating ||
                (target instanceof HTMLElement && target.isContentEditable) ||
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement
            ) {
                return;
            }

            if (event.code === "Space" && !isAnswerVisible) {
                event.preventDefault();
                showAnswer();
                return;
            }

            if (!isAnswerVisible) return;

            if (["1", "2", "3", "4"].includes(event.key)) {
                event.preventDefault();
                void rateCard(Number(event.key) as Rating);
            }
        }

        window.addEventListener("keydown", handleRatingKey);
        return () => window.removeEventListener("keydown", handleRatingKey);
    }, [cards, currentIndex, isAnswerVisible, isFinished, isRating]);

    function formatInterval(totalSeconds: number): string {
        const minute = 60;
        const hour = 60 * minute;
        const day = 24 * hour;
        const month = 30 * day;
        const year = 365 * day;

        if (totalSeconds < minute) {
            return "<1m";
        }

        if (totalSeconds < hour) {
            return `${Math.round(totalSeconds / minute)}m`;
        }

        if (totalSeconds < day) {
            return `${Math.round(totalSeconds / hour)}h`;
        }

        if (totalSeconds < month) {
            return `${Math.round(totalSeconds / day)}d`;
        }

        if (totalSeconds < year) {
            return `${Math.round(totalSeconds / month)}mo`;
        }

        return `${Math.round(totalSeconds / year)}y`;
    }

    if (isLoading) {
        return (
            <main>
                <p>Loading Cards...</p>
            </main>
        );
    }
    if (message) {
        return (
            <main>
                <p>{message}</p>
                <Link to="/decks">Back to Decks</Link>
            </main>
        );
    }
    if (!currentCard && remainingCards.length === 0) {
        return (
            <main>
                <h1>Study deck</h1>

                <p>This deck has no available cards to study yet.</p>

                <Link to={`/decks/${deckId}`}>
                    Back to deck
                </Link>
            </main>
        );
    }

    if (isFinished) {
        return (
            <main>
                <h1>Study complete</h1>
                <Link to={`/decks/${deckId}`}>
                    Back to deck
                </Link>
            </main>
        );
    }
    if (!currentCard) {
        return null;
    }
    return (
        <main>
            <Link to={`/decks/${deckId}`}>
                ← Back to deck
            </Link>

            <p>
                Remaining: {remainingCards.length + 1}
            </p>

            <section>
                <h2>{currentCard.front}</h2>

                {isAnswerVisible && (
                    <p>{currentCard.back}</p>
                )}
            </section>

            <div>
                {!isAnswerVisible ? (
                    <button
                        type="button"
                        onClick={showAnswer}
                    >
                        Show answer (Space)
                    </button>
                ) : (
                    <div>
                        {isLoadingOptions && (
                            <p>Calculating intervals...</p>
                        )}

                        {reviewOptions && (
                            <div>
                                <button
                                    type="button"
                                    onClick={() => rateCard(1)}
                                >
                                    Again ({formatInterval(
                                        reviewOptions.again.interval_seconds
                                    )})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => rateCard(2)}
                                >
                                    Hard ({formatInterval(
                                        reviewOptions.hard.interval_seconds
                                    )})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => rateCard(3)}
                                >
                                    Good ({formatInterval(
                                        reviewOptions.good.interval_seconds
                                    )})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => rateCard(4)}
                                >
                                    Easy ({formatInterval(
                                        reviewOptions.easy.interval_seconds
                                    )})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default StudyPage;
