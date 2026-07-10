import { useState, useEffect } from "react";
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

    useEffect(() => {
        async function loadDecks() {
            if (!isLoggedIn) {
                setMessage("Please log in to see your decks");
                return;
            }
            try {
                const data = await apiFetch('/decks')
                setDecks(data);
                setMessage('');
            } catch {
                setMessage("Your session expired. Please log in again.");
                setIsLoggedIn(false);
                localStorage.removeItem("access_token");
            }
        }
        loadDecks();
    }, [isLoggedIn]);

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
            {!isLoggedIn && (
                <button onClick={() => navigate('/login')}>
                    Login
                </button>)
            }
            <button onClick={logout}>Logout</button>

            <p>{message}</p>
            {isLoggedIn && decks.length === 0 && (
                <p>You have no decks</p>
            )}
            {
                decks.length !== 0 &&
                <ul>
                    {decks.map((deck) => (
                        <li key={deck.id}>
                            {deck.name} ({deck.card_count} cards)
                        </li>
                    ))}
                </ul>
            }
        </main>
    );
}

export default DecksPage;
