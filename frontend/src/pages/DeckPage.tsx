import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import CardFormModal from "../components/CardFormModal";
import CardList from "../components/CardList";
import Navbar from "../components/Navbar";
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
            resetForm();
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
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                    <div className="mt-8 flex flex-col gap-3">
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                    </div>
                </main>
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{message || "Deck not found"}</p>
                    <Link to="/decks" className="btn-secondary mt-5">
                        Back to decks
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-svh">
            <Navbar
                right={
                    cards.length > 0 && (
                        <Link to={`/decks/${deck.id}/study`} className="btn-primary">
                            Study deck
                        </Link>
                    )
                }
            />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <Link
                    to="/decks"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to decks
                </Link>

                <div className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {deck.name}
                        </h1>
                        {deck.description && (
                            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{deck.description}</p>
                        )}
                        <p className="mt-3 text-sm font-medium text-slate-400 dark:text-slate-500">
                            {cards.length} {cards.length === 1 ? "card" : "cards"}
                        </p>
                    </div>
                    {cards.length > 0 && (
                        <Link to={`/decks/${deck.id}/study`} className="btn-primary shrink-0">
                            Study deck
                        </Link>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cards</h2>
                    <button type="button" className="btn-secondary" onClick={openCreateModal}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add card
                    </button>
                </div>

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

                {message && (
                    <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                        {message}
                    </p>
                )}
            </main>
        </div>
    );
}

export default DeckPage;
