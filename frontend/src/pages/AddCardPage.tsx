import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import Navbar from "../components/Navbar";
import type { Deck } from "../types/deck";

function AddCardPage() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const isCardValid = front.trim().length > 0 && back.trim().length > 0;

    useEffect(() => {
        async function loadDeck() {
            if (!deckId) {
                setMessage("Invalid deck id");
                setIsLoading(false);
                return;
            }

            try {
                const deckData = await apiFetch(`/decks/${deckId}`);
                setDeck(deckData);
            } catch {
                setMessage("Could not load this deck");
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
        setMessage("");

        try {
            await apiFetch(`/decks/${deckId}/cards`, {
                method: "POST",
                body: JSON.stringify({
                    front: front.trim(),
                    back: back.trim(),
                }),
            });
            setFront("");
            setBack("");
            navigate(`/decks/${deckId}`);
        } catch {
            setMessage("Could not create the card");
        } finally {
            setIsCreating(false);
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
            <Navbar />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                <Link
                    to={`/decks/${deck.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Back to {deck.name}
                </Link>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Add card
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Create a new flashcard in {deck.name}.
                </p>

                <form
                    onSubmit={createCard}
                    className="mt-8 flex max-w-xl flex-col gap-5"
                >
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="card-front" className="field-label">Front</label>
                        <textarea
                            id="card-front"
                            className="field-input min-h-24 resize-y"
                            value={front}
                            onChange={(event) => setFront(event.target.value)}
                            placeholder="Question or prompt"
                            maxLength={500}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="card-back" className="field-label">Back</label>
                        <textarea
                            id="card-back"
                            className="field-input min-h-24 resize-y"
                            value={back}
                            onChange={(event) => setBack(event.target.value)}
                            placeholder="Answer"
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
                        <button type="submit" className="btn-primary" disabled={isCreating || !isCardValid}>
                            {isCreating ? "Creating…" : "Create card"}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddCardPage;
