import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import DeckFormModal from "../components/DeckFormModal";
import DeckListItem from "../components/DeckListItem";
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

    return (
        <main>
            <h1>Your Decks</h1>

            {isLoggedIn && (
                <button type="button" onClick={openCreateModal}>
                    Create deck
                </button>
            )}

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

            {!isLoggedIn && (
                <button type="button" onClick={() => navigate('/login')}>
                    Login
                </button>
            )}
            {isLoggedIn && <button onClick={logout}>Logout</button>}

            <p>{message}</p>

            {isLoggedIn && decks.length === 0 && <p>You have no decks</p>}
            {decks.length > 0 && (
                <ul>
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
    );
}

export default DecksPage;
