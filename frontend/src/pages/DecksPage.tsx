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
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);

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

    async function createDeck(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!name.trim()) {
            setMessage('Deck name is required');
            return;
        }

        setIsCreating(true);
        setMessage('');

        try {
            const newDeck = await apiFetch('/decks', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                }),
            });
            setDecks((currentDecks) => [...currentDecks, newDeck]);

            setName('');
            setDescription('');
        } catch {
            setMessage('Could not create a deck');
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <main>
            <h1>Your Decks</h1>
            {isLoggedIn && (
                <form onSubmit={createDeck}>
                    <h2>Create a deck</h2>

                    <div>
                        <label htmlFor="deck-name">Name</label>
                        <input
                            id="deck-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="For example: Data Structures"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label htmlFor="deck-description">Description</label>
                        <textarea
                            id="deck-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What will this deck contain?"
                            maxLength={500}
                        />
                    </div>

                    <button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create deck"}
                    </button>
                </form>
            )}
            {!isLoggedIn && (
                <button onClick={() => navigate('/login')}>
                    Login
                </button>)
            }
            {
                isLoggedIn &&
                <button onClick={logout}>Logout</button>
            }
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
