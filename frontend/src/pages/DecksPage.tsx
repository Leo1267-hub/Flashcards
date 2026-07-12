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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isDeckNameValid = name.trim().length > 0;

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

        if (!isDeckNameValid) {
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
            setIsModalOpen(false);
        } catch {
            setMessage('Could not create a deck');
        } finally {
            setIsCreating(false);
        }
    }
    function closeModal() {
        setIsModalOpen(false);
        setName("");
        setDescription("");
        setMessage("");
    }

    return (
        <main>
            <h1>Your Decks</h1>
            {isLoggedIn && (
                <button onClick={() => setIsModalOpen(true)}>
                    Create deck
                </button>
            )}

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setIsModalOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>

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
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="deck-description">
                                    Description
                                </label>

                                <textarea
                                    id="deck-description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="What will this deck contain?"
                                    maxLength={500}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isCreating || !isDeckNameValid}
                                >
                                    {isCreating ? "Creating..." : "Create deck"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
