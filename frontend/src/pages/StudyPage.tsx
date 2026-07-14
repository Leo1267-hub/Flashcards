import type { Card } from "../types/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";

function StudyPage() {

    const { deckId } = useParams<{ deckId: string }>();

    const [goodCount, setGoodCount] = useState(0);
    const [againCount, setAgainCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
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

    function rateCard(result: "good" | "again") {
        if (result === "good") {
            setGoodCount((count) => count + 1);
        } else {
            setAgainCount((count) => count + 1);
        }

        if (currentIndex === cards.length - 1) {
            setIsFinished(true);
            return;
        }
        setCurrentIndex((index) => index + 1);
        setIsAnswerVisible(false);
    }

    function resetStudy() {
        setCurrentIndex(0);
        setIsAnswerVisible(false);
        setGoodCount(0);
        setAgainCount(0);
        setIsFinished(false);
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

                <p>Remembered: {goodCount}</p>
                <p>Need review: {againCount}</p>
                <p>Total: {cards.length}</p>

                <button
                    type="button"
                    onClick={resetStudy}
                >
                    Study again
                </button>

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
                        <button
                            type="button"
                            onClick={() => rateCard("again")}
                        >
                            Again
                        </button>

                        <button
                            type="button"
                            onClick={() => rateCard("good")}
                        >
                            Good
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default StudyPage;