import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import Navbar from "../components/Navbar";
import type { Card } from "../types/card";
import type { Deck } from "../types/deck";

function EditCardPage() {
    const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const isCardValid = front.trim().length > 0 && back.trim().length > 0;

    useEffect(() => {
        async function loadCard() {
            if (!deckId || !cardId) {
                setMessage("Invalid card");
                setIsLoading(false);
                return;
            }

            try {
                const [deckData, cardData]: [Deck, Card] = await Promise.all([
                    apiFetch(`/decks/${deckId}`),
                    apiFetch(`/cards/${cardId}`),
                ]);

                if (cardData.deck_id !== Number(deckId)) {
                    setMessage("Card not found in this deck");
                    return;
                }

                setDeck(deckData);
                setFront(cardData.front);
                setBack(cardData.back);
            } catch {
                setMessage("Could not load this card");
            } finally {
                setIsLoading(false);
            }
        }

        loadCard();
    }, [deckId, cardId]);

    async function updateCard(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isCardValid) {
            return;
        }

        setIsUpdating(true);
        setMessage("");

        try {
            await apiFetch(`/cards/${cardId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    front: front.trim(),
                    back: back.trim(),
                }),
            });
            navigate(`/decks/${deckId}`);
        } catch {
            setMessage("Could not update the card");
        } finally {
            setIsUpdating(false);
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
                    <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                </main>
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{message || "Card not found"}</p>
                    <Link to={deckId ? `/decks/${deckId}` : "/decks"} className="btn-secondary mt-5">
                        {deckId ? "Back to deck" : "Back to decks"}
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-svh">
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <Link
                    to={`/decks/${deck.id}`}
                    className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="truncate">Back to {deck.name}</span>
                </Link>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Edit card
                </h1>
                <p className="mt-2 text-sm break-all text-slate-500 dark:text-slate-400">
                    Update this flashcard in {deck.name}.
                </p>

                <form
                    onSubmit={updateCard}
                    className="mt-8 flex max-w-xl flex-col gap-5"
                >
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="edit-card-front" className="field-label">Front</label>
                        <textarea
                            id="edit-card-front"
                            className="field-input min-h-24 resize-y"
                            value={front}
                            onChange={(event) => setFront(event.target.value)}
                            maxLength={500}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="edit-card-back" className="field-label">Back</label>
                        <textarea
                            id="edit-card-back"
                            className="field-input min-h-24 resize-y"
                            value={back}
                            onChange={(event) => setBack(event.target.value)}
                            maxLength={500}
                            required
                        />
                    </div>

                    {message && (
                        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            {message}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Link to={`/decks/${deck.id}`} className="btn-secondary">
                            Cancel
                        </Link>
                        <button type="submit" className="btn-primary" disabled={isUpdating || !isCardValid}>
                            {isUpdating ? "Saving…" : "Save changes"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default EditCardPage;
