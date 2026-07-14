import type { Card } from "../types/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";

function StudyPage() {

    const { deckId } = useParams<{ deckId: string }>();


    const [cards, setCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

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

    function goToNextCard() {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex((index) => index + 1);
            setIsAnswerVisible(false);
        }
    }

    function goToPreviousCard() {
        if (currentIndex > 0) {
            setCurrentIndex((index) => index - 1);
            setIsAnswerVisible(false);
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
                <button
                    type="button"
                    onClick={goToPreviousCard}
                    disabled={currentIndex === 0}
                >
                    Previous
                </button>

                {!isAnswerVisible && (
                    <button
                        type="button"
                        onClick={() => setIsAnswerVisible(true)}
                    >
                        Show answer
                    </button>
                )}

                <button
                    type="button"
                    onClick={goToNextCard}
                    disabled={currentIndex === cards.length - 1}
                >
                    Next
                </button>
            </div>
        </main>
    );
}

export default StudyPage;