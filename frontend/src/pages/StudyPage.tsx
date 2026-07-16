import type { Card } from "../types/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";

function StudyPage() {

    const { deckId } = useParams<{ deckId: string }>();

    const [isFinished, setIsFinished] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRating, setIsRating] = useState(false);
    const [message, setMessage] = useState("");


    type Rating = 1 | 2 | 3 | 4;

    useEffect(() => {
        async function loadCards() {
            if (!deckId) {
                setMessage("Invalid deck ID");
                setIsLoading(false);
                return;
            }

            try {
                const cardsData = await apiFetch(`/decks/${deckId}/cards/due`);
                setCards(cardsData);
            } catch {
                setMessage("Failed to load cards");
            } finally {
                setIsLoading(false);
            }
        }
        loadCards();
    }, [deckId]
    );

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
                setIsAnswerVisible(true);
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
    if (cards.length === 0) {
        return (
            <main>
                <h1>Study deck</h1>

                <p>This deck has no available cards to study yet.</p>

                <Link to={`/decks/${deckId}`}>
                    Add cards to this deck
                </Link>
            </main>
        );
    }

    if (isFinished) {
        return (
            <main>
                <h1>Study complete</h1>

                <p>Total: {cards.length}</p>

                <Link to={`/decks/${deckId}`}>
                    Back to deck
                </Link>
            </main>
        );
    }
    const currentCard = cards[currentIndex];

    return (
        <main>
            <Link to={`/decks/${deckId}`}>
                ← Back to deck
            </Link>

            <p>
                Card {currentIndex + 1} of {cards.length}
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
                        onClick={() => setIsAnswerVisible(true)}
                    >
                        Show answer (Space)
                    </button>
                ) : (
                    <div>
                        <button disabled={isRating} onClick={() => rateCard(1)}>Again</button>
                        <button disabled={isRating} onClick={() => rateCard(2)}>Hard</button>
                        <button disabled={isRating} onClick={() => rateCard(3)}>Good</button>
                        <button disabled={isRating} onClick={() => rateCard(4)}>Easy</button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default StudyPage;
