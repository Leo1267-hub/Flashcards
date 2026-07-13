import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";

type Deck = {
    id: number;
    name: string;
    description: string | null;
    card_count: number;
};

type Card = {
    id: number;
    front: string;
    back: string;
    deck_id: number;
};

function DeckPage() {
    const { deckId } = useParams<{ deckId: string }>();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDeck() {
            if (!deckId) {
                setMessage('Invalid deck id');
                setIsLoading(false);
                return;
            }
            try {
                const [deckData, cardsData] = await Promise.all([
                    apiFetch(`/decks/${deckId}`),
                    apiFetch(`/decks/${deckId}/cards`),
                ])
                setDeck(deckData);
                setCards(cardsData);
            } catch {
                setMessage('Could not load this deck');
            } finally {
                setIsLoading(false);
            }
        }
        loadDeck();
    }, [deckId])

    if (isLoading) {
        return <p>Loading deck...</p>;
    }

    if (!deck) {
        return (
            <main>
                <p>{message || "Deck not found"}</p>
                <Link to="/decks">Back to decks</Link>
            </main>
        );
    }
    return (
        <main>
            <Link to="/decks">← Back to decks</Link>

            <h1>{deck.name}</h1>

            {deck.description && (
                <p>{deck.description}</p>
            )}

            <h2>Cards</h2>

            {cards.length === 0 ? (
                <p>This deck has no cards yet.</p>
            ) : (
                <ul>
                    {cards.map((card) => (
                        <li key={card.id}>
                            <strong>{card.front}</strong>
                            <p>{card.back}</p>
                        </li>
                    ))}
                </ul>
            )}

            <p>{message}</p>
        </main>
    );
}
export default DeckPage;
