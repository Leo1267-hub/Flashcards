import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import CardFormModal from "../components/CardFormModal";
import CardList from "../components/CardList";
import type { Card } from "../types/card";
import type { Deck } from "../types/deck";

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
    const isCardValid = front.trim().length > 0 && back.trim().length > 0;

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
                ]);
                setDeck(deckData);
                setCards(cardsData);
            } catch {
                setMessage('Could not load this deck');
            } finally {
                setIsLoading(false);
            }
        }

        loadDeck();
    }, [deckId]);

    async function createCard(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isCardValid) {
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
                }),
            });
            setCards((currentCards) => [...currentCards, newCard]);
            closeCreateModal();
        } catch {
            setMessage('Could not create the card');
        } finally {
            setIsCreating(false);
        }
    }

    async function updateCard(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingCard || !isCardValid) {
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

    function openCreateModal() {
        setEditingCard(null);
        setFront('');
        setBack('');
        setMessage('');
        setIsCreateModalOpen(true);
    }

    function closeCreateModal() {
        setIsCreateModalOpen(false);
        resetForm();
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
        resetForm();
    }

    function resetForm() {
        setFront('');
        setBack('');
        setMessage('');
    }

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
            {deck.description && <p>{deck.description}</p>}
            {cards.length > 0 && (
                <Link to={`/decks/${deck.id}/study`}>
                    Study deck
                </Link>
            )}
            <h2>Cards</h2>
            <button type="button" onClick={openCreateModal}>
                Create card
            </button>

            {isCreateModalOpen && (
                <CardFormModal
                    mode="create"
                    front={front}
                    back={back}
                    isSubmitting={isCreating}
                    isValid={isCardValid}
                    message={message}
                    onFrontChange={setFront}
                    onBackChange={setBack}
                    onSubmit={createCard}
                    onClose={closeCreateModal}
                />
            )}

            {editingCard && (
                <CardFormModal
                    mode="edit"
                    front={front}
                    back={back}
                    isSubmitting={isUpdating}
                    isValid={isCardValid}
                    message={message}
                    onFrontChange={setFront}
                    onBackChange={setBack}
                    onSubmit={updateCard}
                    onClose={closeEditModal}
                />
            )}

            <CardList
                cards={cards}
                deletingCardId={deletingCardId}
                onEdit={openEditModal}
                onDelete={deleteCard}
            />

            <p>{message}</p>
        </main>
    );
}

export default DeckPage;
