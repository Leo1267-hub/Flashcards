import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import CardList from "../components/CardList";
import InlineEditableText from "../components/InlineEditableText";
import type { Card } from "../types/card";
import type { Deck } from "../types/deck";

const SAVE_DEBOUNCE_MS = 600;

type SaveState = "idle" | "saving" | "saved" | "error";

function DeckPage() {
    const { deckId } = useParams<{ deckId: string }>();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [searchQuery, setSearchQuery] = useState('');

    const savedDetailsRef = useRef({ name: '', description: '' });
    const saveTimerRef = useRef<number | undefined>(undefined);
    const saveSequenceRef = useRef(0);

    const trimmedQuery = searchQuery.trim();
    const isSearching = trimmedQuery.length > 0;

    const filteredCards = useMemo(() =>
    {
        const query = trimmedQuery.toLowerCase();
        if (!query) {
            return cards;
        }
        return cards.filter((card) =>
            card.front.toLowerCase().includes(query) ||
            card.back.toLowerCase().includes(query)
        );
    }, [trimmedQuery, cards]);

    useEffect(() => {
        async function loadDeck() {
            if (!deckId) {
                setMessage('Invalid deck id');
                setIsLoading(false);
                return;
            }

            try {
                const [deckData, cardsData]: [Deck, Card[]] = await Promise.all([
                    apiFetch(`/decks/${deckId}`),
                    apiFetch(`/decks/${deckId}/cards`),
                ]);
                setDeck(deckData);
                setCards(cardsData);
                setName(deckData.name);
                setDescription(deckData.description ?? '');
                savedDetailsRef.current = {
                    name: deckData.name,
                    description: deckData.description ?? '',
                };
            } catch {
                setMessage('Could not load this deck');
            } finally {
                setIsLoading(false);
            }
        }

        loadDeck();
    }, [deckId]);

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const isNameChanged = trimmedName.length > 0 && trimmedName !== savedDetailsRef.current.name;
    const isDescriptionChanged = trimmedDescription !== savedDetailsRef.current.description;
    const hasPendingChanges = deck !== null && (isNameChanged || isDescriptionChanged);

    const saveDetails = useCallback(async () => {
        const payload: { name?: string; description?: string | null } = {};

        if (trimmedName.length > 0 && trimmedName !== savedDetailsRef.current.name) {
            payload.name = trimmedName;
        }
        if (trimmedDescription !== savedDetailsRef.current.description) {
            payload.description = trimmedDescription.length > 0 ? trimmedDescription : null;
        }
        if (Object.keys(payload).length === 0) {
            return;
        }

        const sequence = ++saveSequenceRef.current;
        setSaveState("saving");

        try {
            const updatedDeck: Deck = await apiFetch(`/decks/${deckId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });

            if (sequence !== saveSequenceRef.current) {
                return;
            }

            savedDetailsRef.current = {
                name: updatedDeck.name,
                description: updatedDeck.description ?? '',
            };
            setDeck((currentDeck) =>
                currentDeck
                    ? { ...currentDeck, name: updatedDeck.name, description: updatedDeck.description }
                    : currentDeck
            );
            setSaveState("saved");
        } catch {
            if (sequence === saveSequenceRef.current) {
                setSaveState("error");
            }
        }
    }, [deckId, trimmedName, trimmedDescription]);

    useEffect(() => {
        if (!hasPendingChanges) {
            setSaveState((state) => (state === "saving" ? "idle" : state));
            return;
        }

        setSaveState("saving");
        saveTimerRef.current = window.setTimeout(saveDetails, SAVE_DEBOUNCE_MS);

        return () => window.clearTimeout(saveTimerRef.current);
    }, [hasPendingChanges, saveDetails]);

    function saveDetailsNow() {
        if (trimmedName.length === 0) {
            setName(savedDetailsRef.current.name);
        }
        if (!hasPendingChanges) {
            return;
        }

        window.clearTimeout(saveTimerRef.current);
        saveDetails();
    }

    function handleNameKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
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

    if (isLoading) {
        return (
            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="mt-8 flex flex-col gap-3">
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                    <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                </div>
            </main>
        );
    }

    if (!deck) {
        return (
            <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">{message || "Deck not found"}</p>
                <Link to="/decks" className="btn-secondary mt-5">
                    Back to decks
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <Link
                    to="/decks"
                    className="inline-flex items-center gap-2 text-base font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to decks
                </Link>

                <div className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="-mx-2.5 min-w-0 flex-1">
                        <InlineEditableText
                            value={name}
                            onChange={setName}
                            onBlur={saveDetailsNow}
                            onKeyDown={handleNameKeyDown}
                            maxLength={100}
                            ariaLabel="Deck name"
                            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
                        />
                        <InlineEditableText
                            value={description}
                            onChange={setDescription}
                            onBlur={saveDetailsNow}
                            placeholder="Add a description"
                            maxLength={500}
                            ariaLabel="Deck description"
                            className="mt-1 text-sm leading-relaxed text-slate-500 placeholder:text-slate-400 dark:text-slate-400 dark:placeholder:text-slate-500"
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-3 px-2.5">
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                {cards.length} {cards.length === 1 ? "card" : "cards"}
                            </p>
                            {deck.due_count > 0 ? (
                                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/25">
                                    {deck.due_count} due
                                </span>
                            ) : cards.length > 0 ? (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                                    All caught up
                                </span>
                            ) : null}

                            {trimmedName.length === 0 ? (
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    Name cannot be empty
                                </span>
                            ) : saveState === "saving" ? (
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Saving…</span>
                            ) : saveState === "saved" ? (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved</span>
                            ) : saveState === "error" ? (
                                <span role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                    Could not save changes
                                </span>
                            ) : null}
                        </div>
                    </div>
                    {cards.length > 0 && (
                        <Link to={`/decks/${deck.id}/study`} className="btn-primary shrink-0 self-start">
                            Study deck
                        </Link>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Cards
                        {isSearching && (
                            <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                                {filteredCards.length} of {cards.length}
                            </span>
                        )}
                    </h2>

                    <div className="flex items-center gap-2">
                        {cards.length > 0 && (
                            <div className="relative flex-1 sm:w-64 sm:flex-none">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="M20 20l-3.6-3.6" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape") {
                                            setSearchQuery('');
                                        }
                                    }}
                                    placeholder="Search cards"
                                    aria-label="Search cards"
                                    className="field-input pl-9 pr-9"
                                />
                                {isSearching && (
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 grid w-9 place-items-center text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Clear search"
                                    >
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}

                        <Link to={`/decks/${deck.id}/cards/new`} className="btn-secondary shrink-0">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add card
                        </Link>
                    </div>
                </div>

                <CardList
                    cards={filteredCards}
                    deletingCardId={deletingCardId}
                    onDelete={deleteCard}
                    emptyMessage={isSearching ? `No cards match "${trimmedQuery}".` : undefined}
                    emptyHint={isSearching ? "Try a different word or clear the search." : undefined}
                />

                {message && (
                    <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                        {message}
                    </p>
                )}
        </main>
    );
}

export default DeckPage;
