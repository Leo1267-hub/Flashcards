import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import { deleteCardImage, uploadCardImage } from "../cardImages";
import CardImageInput from "../components/CardImageInput";
import Navbar from "../components/Navbar";
import type { Card, CardSide } from "../types/card";
import type { Deck } from "../types/deck";

type ImageEdit = {
    file: File | null;
    isRemoved: boolean;
};

const NO_IMAGE_EDIT: ImageEdit = { file: null, isRemoved: false };

function EditCardPage() {
    const { deckId, cardId } = useParams<{ deckId: string; cardId: string }>();
    const navigate = useNavigate();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [front, setFront] = useState("");
    const [back, setBack] = useState("");
    const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null);
    const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
    const [frontImageEdit, setFrontImageEdit] = useState<ImageEdit>(NO_IMAGE_EDIT);
    const [backImageEdit, setBackImageEdit] = useState<ImageEdit>(NO_IMAGE_EDIT);
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
                setFrontImageUrl(cardData.front_image_url);
                setBackImageUrl(cardData.back_image_url);
            } catch {
                setMessage("Could not load this card");
            } finally {
                setIsLoading(false);
            }
        }

        loadCard();
    }, [deckId, cardId]);

    async function applyImageEdit(side: CardSide, edit: ImageEdit) {
        if (edit.file) {
            await uploadCardImage(Number(cardId), side, edit.file);
            return;
        }

        if (edit.isRemoved) {
            await deleteCardImage(Number(cardId), side);
        }
    }

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
            await applyImageEdit("front", frontImageEdit);
            await applyImageEdit("back", backImageEdit);
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
                    className="inline-flex max-w-full items-center gap-2 text-base font-medium text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="truncate">Back to {deck.name}</span>
                </Link>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Edit card
                </h1>
                <p className="mt-2 text-sm wrap-break-word text-slate-500 dark:text-slate-400">
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

                    <CardImageInput
                        id="edit-card-front-image"
                        label="Front image"
                        file={frontImageEdit.file}
                        existingUrl={frontImageEdit.isRemoved ? null : frontImageUrl}
                        onFileSelect={(file) => setFrontImageEdit({ file, isRemoved: false })}
                        onRemove={() => setFrontImageEdit({ file: null, isRemoved: true })}
                        disabled={isUpdating}
                    />

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

                    <CardImageInput
                        id="edit-card-back-image"
                        label="Back image"
                        file={backImageEdit.file}
                        existingUrl={backImageEdit.isRemoved ? null : backImageUrl}
                        onFileSelect={(file) => setBackImageEdit({ file, isRemoved: false })}
                        onRemove={() => setBackImageEdit({ file: null, isRemoved: true })}
                        disabled={isUpdating}
                    />

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
