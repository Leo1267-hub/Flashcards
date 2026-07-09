import { useState } from "react";
import { apiFetch } from "../api";


type Deck = {
    id: number,
    name: string,
    description: string | null;
    card_count: number;
};

function DecksPage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [message, setMessage] = useState('');

    async function loadDecks() {
        try {
            const data = await apiFetch('/decks')
            setDecks(data)
        } catch {
            setMessage("You need to log in first");
        }

    }
    return (
        <main>
            <h1>Your Decks</h1>

            <button onClick={loadDecks}>Load Decks</button>

            <p>{message}</p>

            <ul>
                {decks.map((deck) => (
                    <li key={deck.id}>
                        {deck.name} ({deck.card_count} cards)
                    </li>
                ))}
            </ul>
        </main>
    );
}

export default DecksPage;
