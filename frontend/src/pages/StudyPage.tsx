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
                const cardsData = await apiFetch(`/decks/${deckId}/cards`);
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
        const currentCard = cards[currentIndex];

        try {
            await apiFetch(`/cards/${currentCard.id}/review`, {
                method: "POST",
                body: JSON.stringify({ rating }),
            });

            moveToNextCard();
        } catch {
            setMessage("Could not save review");
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

                <p>This deck has no cards yet.</p>

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
                        Show answer
                    </button>
                ) : (
                    <div>
                        <button onClick={() => rateCard(1)}>Again</button>
                        <button onClick={() => rateCard(2)}>Hard</button>
                        <button onClick={() => rateCard(3)}>Good</button>
                        <button onClick={() => rateCard(4)}>Easy</button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default StudyPage;