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
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const isFrontValid = front.trim().length > 0;
    const isBackValid = back.trim().length > 0;

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

    async function createCard(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isBackValid || !isFrontValid) {
            return;
        }
        setIsCreating(true);
        setMessage('');

        try {
            const newCard = await apiFetch(`/decks/${deckId}/cards`, {
                method: 'POST',
                body: JSON.stringify({
                    front: front.trim(),
                    back: back.trim(),
                })
            });
            setCards((currentCards) => [...currentCards, newCard]);

            setFront('');
            setBack('');
            setIsCreateModalOpen(false);
        } catch {
            setMessage('Could not create the card');
        } finally {
            setIsCreating(false);
        }
    }

    function openCreateModal() {
        setEditingCard(null);
        setFront('');
        setBack('');
        setMessage('');
        setIsCreateModalOpen(true);
    }

    function closeCreateModal() {
        setIsCreateModalOpen(false);
        setFront('');
        setBack('');
        setMessage('');
    }

    async function updateCard(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingCard || !isFrontValid || !isBackValid) {
            return;
        }

        setIsUpdating(true);
        setMessage('');

        try {
            const updatedCard = await apiFetch(`/cards/${editingCard.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    front: front.trim(),
                    back: back.trim(),
                }),
            });
            setCards((currentCards) =>
                currentCards.map((card) =>
                    card.id === updatedCard.id ? updatedCard : card
                )
            );
            closeEditModal();
        } catch {
            setMessage('Could not update the card');
        } finally {
            setIsUpdating(false);
        }
    }

    function openEditModal(card: Card) {
        setIsCreateModalOpen(false);
        setEditingCard(card);
        setFront(card.front);
        setBack(card.back);
        setMessage('');
    }

    function closeEditModal() {
        setEditingCard(null);
        setFront('');
        setBack('');
        setMessage('');
    }

    async function deleteCard(cardId: number) {
        setDeletingCardId(cardId);
        setMessage('');

        try {
            await apiFetch(`/cards/${cardId}`, { method: 'DELETE' });
            setCards((currentCards) =>
                currentCards.filter((card) => card.id !== cardId)
            );
        } catch {
            setMessage('Could not delete the card');
        } finally {
            setDeletingCardId(null);
        }
    }

    return (
        <main>
            <Link to="/decks">← Back to decks</Link>

            <h1>{deck.name}</h1>

            {deck.description && (
                <p>{deck.description}</p>
            )}

            <h2>Cards</h2>

            <button type="button" onClick={openCreateModal}>
                Create card
            </button>

            {isCreateModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeCreateModal}
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <form onSubmit={createCard}>
                            <h2>Create a card</h2>

                            <div>
                                <label htmlFor="card-front">Front</label>
                                <textarea
                                    id="card-front"
                                    value={front}
                                    onChange={(event) => setFront(event.target.value)}
                                    placeholder="Question or prompt"
                                    maxLength={500}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="card-back">Back</label>
                                <textarea
                                    id="card-back"
                                    value={back}
                                    onChange={(event) => setBack(event.target.value)}
                                    placeholder="Answer"
                                    maxLength={500}
                                    required
                                />
                            </div>

                            {message && <p role="alert">{message}</p>}

                            <div className="modal-actions">
                                <button type="button" onClick={closeCreateModal}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !isFrontValid || !isBackValid}
                                >
                                    {isCreating ? "Creating..." : "Create card"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingCard && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <button
                            type="button"
                            className="modal-close"
                            onClick={closeEditModal}
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <form onSubmit={updateCard}>
                            <h2>Edit card</h2>

                            <div>
                                <label htmlFor="edit-card-front">Front</label>
                                <textarea
                                    id="edit-card-front"
                                    value={front}
                                    onChange={(event) => setFront(event.target.value)}
                                    maxLength={500}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="edit-card-back">Back</label>
                                <textarea
                                    id="edit-card-back"
                                    value={back}
                                    onChange={(event) => setBack(event.target.value)}
                                    maxLength={500}
                                    required
                                />
                            </div>

                            {message && <p role="alert">{message}</p>}

                            <div className="modal-actions">
                                <button type="button" onClick={closeEditModal}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating || !isFrontValid || !isBackValid}
                                >
                                    {isUpdating ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {cards.length === 0 ? (
                <p>This deck has no cards yet.</p>
            ) : (
                <ul>
                    {cards.map((card) => (
                        <li key={card.id}>
                            <strong>{card.front}</strong>
                            <p>{card.back}</p>
                            <button type="button" onClick={() => openEditModal(card)}>
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteCard(card.id)}
                                disabled={deletingCardId === card.id}
                            >
                                {deletingCardId === card.id ? "Deleting..." : "Delete"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <p>{message}</p>
        </main>
    );
}
export default DeckPage;
