import { useState } from "react";
import { apiFetch } from "../api";
import { useNavigate } from "react-router-dom";

type Deck = {
    id: number,
    name: string,
    description: string | null;
    card_count: number;
};

function DecksPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem('access_token') !== null
    );
    const [decks, setDecks] = useState<Deck[]>([]);
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    async function loadDecks() {
        try {
            const data = await apiFetch('/decks')
            setDecks(data)
        } catch {
            setMessage("You need to log in first");
        }
    }

    async function logout() {
        try {
            await apiFetch('/logout', { method: 'POST' });
        } finally {
            localStorage.removeItem('access_token');
            setDecks([]);
            navigate('/login');
        }
    }

    return (
        <main>
            <h1>Your Decks</h1>
            {isLoggedIn && (
                <button onClick={loadDecks}>
                    Load Decks
                </button>)
            }
            {!isLoggedIn && (
                <button onClick={() => navigate('/login')}>
                    Login
                </button>)
            }
            <button onClick={logout}>Logout</button>

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
