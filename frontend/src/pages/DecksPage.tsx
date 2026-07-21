import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import DeckFormModal from "../components/DeckFormModal";
import DeckListItem from "../components/DeckListItem";
import Navbar from "../components/Navbar";
import type { Deck } from "../types/deck";

function DecksPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem('access_token') !== null
    );
    const [decks, setDecks] = useState<Deck[]>([]);
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const isDeckNameValid = name.trim().length > 0;
    const navigate = useNavigate();

    useEffect(() => {
        async function loadDecks() {
            if (!isLoggedIn) {
                setMessage('Please log in to see your decks');
                return;
            }

            try {
                const data = await apiFetch('/decks');
                setDecks(data);
                setMessage('');
            } catch {
                setMessage('Your session expired. Please log in again.');
                setIsLoggedIn(false);
                localStorage.removeItem('access_token');
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

    async function deleteDeck(deckId: number) {
        try {
            await apiFetch(`/decks/${deckId}`, { method: 'DELETE' });
            setDecks((currentDecks) =>
                currentDecks.filter((deck) => deck.id !== deckId)
            );
        } catch {
            setMessage('Not able to delete');
        }
    }

    async function createDeck(event: FormEvent<HTMLFormElement>) {
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
            closeCreateModal();
        } catch {
            setMessage('Could not create a deck');
        } finally {
            setIsCreating(false);
        }
    }

    async function updateDeck(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingDeck || !isDeckNameValid) {
            return;
        }

        setIsUpdating(true);
        setMessage('');

        try {
            const updatedDeck = await apiFetch(`/decks/${editingDeck.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                }),
            });
            setDecks((currentDecks) =>
                currentDecks.map((deck) =>
                    deck.id === updatedDeck.id ? updatedDeck : deck
                )
            );
            closeEditModal();
        } catch {
            setMessage('Could not update the deck');
        } finally {
            setIsUpdating(false);
        }
    }

    function openCreateModal() {
        setEditingDeck(null);
        resetForm();
        setIsCreateModalOpen(true);
    }

    function closeCreateModal() {
        setIsCreateModalOpen(false);
        resetForm();
    }

    function openEditModal(deck: Deck) {
        setIsCreateModalOpen(false);
        setEditingDeck(deck);
        setName(deck.name);
        setDescription(deck.description ?? '');
        setMessage('');
    }

    function closeEditModal() {
        setEditingDeck(null);
        resetForm();
    }

    function resetForm() {
        setName('');
        setDescription('');
        setMessage('');
    }

    const totalDue = decks.reduce((sum, deck) => sum + deck.due_count, 0);

    return (
        <div className="min-h-svh">
            <Navbar
                right={
                    isLoggedIn ? (
                        <button type="button" className="btn-ghost" onClick={logout}>
                            Log out
                        </button>
                    ) : (
                        <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
                            Log in
                        </button>
                    )
                }
            />

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Your decks
                        </h1>
                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                            {isLoggedIn && decks.length > 0
                                ? totalDue > 0
                                    ? `You have ${totalDue} ${totalDue === 1 ? "card" : "cards"} due for review.`
                                    : "You're all caught up. Nice work!"
                                : "Organize what you're learning into decks."}
                        </p>
                    </div>

                    {isLoggedIn && (
                        <button type="button" className="btn-primary" onClick={openCreateModal}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            New deck
                        </button>
                    )}
                </div>

                {isCreateModalOpen && (
                    <DeckFormModal
                        mode="create"
                        name={name}
                        description={description}
                        isSubmitting={isCreating}
                        isValid={isDeckNameValid}
                        message={message}
                        onNameChange={setName}
                        onDescriptionChange={setDescription}
                        onSubmit={createDeck}
                        onClose={closeCreateModal}
                    />
                )}

                {editingDeck && (
                    <DeckFormModal
                        mode="edit"
                        name={name}
                        description={description}
                        isSubmitting={isUpdating}
                        isValid={isDeckNameValid}
                        message={message}
                        onNameChange={setName}
                        onDescriptionChange={setDescription}
                        onSubmit={updateDeck}
                        onClose={closeEditModal}
                    />
                )}

                {message && (
                    <p role="alert" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50">
                        {message}
                    </p>
                )}

                {isLoggedIn && decks.length === 0 && !message && (
                    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="14" height="14" rx="2" />
                                <path d="M7 9h6M7 13h6" />
                            </svg>
                        </div>
                        <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">No decks yet</h2>
                        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Create your first deck and start adding cards to study.
                        </p>
                        <button type="button" className="btn-primary mt-6" onClick={openCreateModal}>
                            Create your first deck
                        </button>
                    </div>
                )}

                {decks.length > 0 && (
                    <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {decks.map((deck) => (
                            <DeckListItem
                                key={deck.id}
                                deck={deck}
                                onEdit={openEditModal}
                                onDelete={deleteDeck}
                            />
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}

export default DecksPage;
