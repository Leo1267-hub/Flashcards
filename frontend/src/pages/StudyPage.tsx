import type { Card, CardReviewResponse } from "../types/card";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import type { ReviewOptions, Rating } from "../types/rating";
import { getNextCard, type LearningQueueItem } from "./studyQueue";
import Navbar from "../components/Navbar";

const FSRS_LEARNING = 1;
const FSRS_RELEARNING = 3;
const LEARN_AHEAD_MS = 20 * 60 * 1000; // 20 minutes

type ReviewSnapshot = {
    reviewId: number;
    learningQueue: LearningQueueItem[];
    remainingCards: Card[];
    isFinished: boolean;
};

function StudyPage() {

    const { deckId } = useParams<{ deckId: string }>();

    const [isFinished, setIsFinished] = useState(false);
    const [remainingCards, setRemainingCards] = useState<Card[]>([]);
    const [learningQueue, setLearningQueue] =
        useState<LearningQueueItem[]>([]);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [isAnswerVisible, setIsAnswerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRating, setIsRating] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const [isRedoing, setIsRedoing] = useState(false);
    const [reviewHistory, setReviewHistory] = useState<ReviewSnapshot[]>([]);
    const [redoHistory, setRedoHistory] = useState<ReviewSnapshot[]>([]);
    const [message, setMessage] = useState("");
    const [reviewOptions, setReviewOptions] =
        useState<ReviewOptions | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] =
        useState(false);
    const [totalToStudy, setTotalToStudy] = useState(0);


    useEffect(() => {
        async function loadCards() {
            if (!deckId) {
                setMessage("Invalid deck ID");
                setIsLoading(false);
                return;
            }

            try {
                const cardsData: Card[] = await apiFetch(
                    `/decks/${deckId}/study-cards`
                );

                setTotalToStudy(cardsData.length);

                if (cardsData.length === 0) {
                    setRemainingCards([]);
                    setCurrentCard(null);
                    return;
                }

                const now = Date.now();

                const dueCards: Card[] = [];
                const restoredLearningQueue: LearningQueueItem[] = [];

                for (const card of cardsData) {
                    const dueAt = new Date(card.due).getTime();
                    if (
                        (card.fsrs_state === FSRS_LEARNING ||
                            card.fsrs_state === FSRS_RELEARNING) &&
                        dueAt <= now + LEARN_AHEAD_MS
                    ) {
                        restoredLearningQueue.push({ card, dueAt });
                    } else {
                        dueCards.push(card);
                    }
                }

                restoredLearningQueue.sort(
                    (first, second) => first.dueAt - second.dueAt
                );

                const next = getNextCard(
                    restoredLearningQueue,
                    dueCards,
                    null,
                    now,
                );

                setLearningQueue(next.learningQueue);
                setRemainingCards(next.remainingCards);
                setCurrentCard(next.card);
                setIsFinished(next.isFinished);
            } catch {
                setMessage("Failed to load cards");
            } finally {
                setIsLoading(false);
            }
        }
        loadCards();
    }, [deckId]
    );

    async function showAnswer() {
        if (!currentCard) return;

        setIsAnswerVisible(true);
        setIsLoadingOptions(true);
        setMessage("");

        try {
            const options = await apiFetch(
                `/cards/${currentCard.id}/review-options`
            );

            setReviewOptions(options);
        } catch {
            setMessage("Could not calculate review intervals");
        } finally {
            setIsLoadingOptions(false);
        }
    }

    async function rateCard(rating: Rating) {
        if (isRating || isUndoing || isRedoing || !currentCard) return;

        setIsRating(true);
        try {
            const snapshot: Omit<ReviewSnapshot, "reviewId"> = {
                learningQueue,
                remainingCards,
                isFinished,
            };
            const { card, review_id }: CardReviewResponse = await apiFetch(
                `/cards/${currentCard.id}/review`,
                {
                    method: "POST",
                    body: JSON.stringify({ rating }),
                }
            );
            setReviewHistory((history) => [
                ...history,
                { ...snapshot, reviewId: review_id },
            ]);
            setRedoHistory([]);
            moveAfterReview(card);
        } catch {
            setMessage("Could not save review");
        } finally {
            setIsRating(false);
        }
    }

    async function undoLastReview() {
        if (reviewHistory.length === 0 || isUndoing || isRedoing || isRating) return;

        const snapshot = reviewHistory[reviewHistory.length - 1];

        setIsUndoing(true);
        setMessage("");
        try {
            const restoredCard: Card = await apiFetch(
                `/reviews/${snapshot.reviewId}/undo`,
                { method: "POST" }
            );

            setReviewHistory((history) => history.slice(0, -1));
            setRedoHistory((history) => [...history, snapshot]);
            setLearningQueue(snapshot.learningQueue);
            setRemainingCards(snapshot.remainingCards);
            setIsFinished(snapshot.isFinished);
            setCurrentCard(restoredCard);
            setReviewOptions(null);
            setIsAnswerVisible(false);
        } catch {
            setMessage("Could not undo review");
        } finally {
            setIsUndoing(false);
        }
    }

    async function redoLastReview() {
        if (redoHistory.length === 0 || isUndoing || isRedoing || isRating) return;

        const snapshot = redoHistory[redoHistory.length - 1];

        setIsRedoing(true);
        setMessage("");
        try {
            const redoneCard: Card = await apiFetch(
                `/reviews/${snapshot.reviewId}/redo`,
                { method: "POST" }
            );

            setRedoHistory((history) => history.slice(0, -1));
            setReviewHistory((history) => [...history, snapshot]);
            moveAfterReview(redoneCard);
        } catch {
            setMessage("Could not redo review");
        } finally {
            setIsRedoing(false);
        }
    }

    function moveAfterReview(reviewedCard: Card) {
        setReviewOptions(null);
        setIsAnswerVisible(false);

        let updatedLearningQueue = [...learningQueue];

        const shouldEnterLearningQueue =
            reviewedCard.fsrs_state === FSRS_LEARNING ||
            reviewedCard.fsrs_state === FSRS_RELEARNING;

        if (shouldEnterLearningQueue) {
            updatedLearningQueue.push({
                card: reviewedCard,
                dueAt: new Date(reviewedCard.due).getTime(),
            });

            updatedLearningQueue.sort(
                (first, second) => first.dueAt - second.dueAt
            );
        }

        const next = getNextCard(updatedLearningQueue, remainingCards, reviewedCard.id);

        setLearningQueue(next.learningQueue);
        setRemainingCards(next.remainingCards);
        setCurrentCard(next.card);
        setIsFinished(next.isFinished);
    }

    useEffect(() => {
        function handleRatingKey(event: KeyboardEvent) {
            const target = event.target;
            if (
                event.repeat ||
                isRating ||
                isUndoing ||
                isRedoing ||
                (target instanceof HTMLElement && target.isContentEditable) ||
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement
            ) {
                return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
                event.preventDefault();
                if (event.shiftKey) {
                    if (redoHistory.length === 0) return;
                    void redoLastReview();
                } else if (reviewHistory.length > 0) {
                    void undoLastReview();
                }
                return;
            }

            if (isFinished) return;

            if (event.code === "Space" && !isAnswerVisible) {
                event.preventDefault();
                showAnswer();
                return;
            }

            if (!isAnswerVisible) return;

            if (["1", "2", "3", "4"].includes(event.key)) {
                event.preventDefault();
                void rateCard(Number(event.key) as Rating);
            }
        }

        window.addEventListener("keydown", handleRatingKey);
        return () => window.removeEventListener("keydown", handleRatingKey);
    }, [
        currentCard,
        isAnswerVisible,
        isFinished,
        isRating,
        isUndoing,
        isRedoing,
        reviewHistory,
        redoHistory,
        reviewOptions,
    ]);

    function formatInterval(totalSeconds: number): string {
        const minute = 60;
        const hour = 60 * minute;
        const day = 24 * hour;
        const month = 30 * day;
        const year = 365 * day;

        if (totalSeconds < minute) {
            return "<1m";
        }

        if (totalSeconds < hour) {
            return `${Math.round(totalSeconds / minute)}m`;
        }

        if (totalSeconds < day) {
            return `${Math.round(totalSeconds / hour)}h`;
        }

        if (totalSeconds < month) {
            return `${Math.round(totalSeconds / day)}d`;
        }

        if (totalSeconds < year) {
            return `${Math.round(totalSeconds / month)}mo`;
        }

        return `${Math.round(totalSeconds / year)}y`;
    }

    const canUndo = reviewHistory.length > 0;
    const canRedo = redoHistory.length > 0;
    const historyBusy = isUndoing || isRedoing || isRating;

    const undoIcon = (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 13" />
        </svg>
    );

    const redoIcon = (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" />
        </svg>
    );

    const undoButton = (
        <button
            type="button"
            className="btn-ghost"
            onClick={() => void undoLastReview()}
            disabled={!canUndo || historyBusy}
            aria-disabled={!canUndo || historyBusy}
        >
            {undoIcon}
            {isUndoing ? "Undoing…" : "Undo"}
            <kbd className="ml-0.5 rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                ⌘Z
            </kbd>
        </button>
    );

    const redoButton = (
        <button
            type="button"
            className="btn-ghost"
            onClick={() => void redoLastReview()}
            disabled={!canRedo || historyBusy}
            aria-disabled={!canRedo || historyBusy}
        >
            {redoIcon}
            {isRedoing ? "Redoing…" : "Redo"}
            <kbd className="ml-0.5 rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                ⇧⌘Z
            </kbd>
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 sm:px-6">
                    <div className="h-72 w-full animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800/60" />
                </main>
            </div>
        );
    }
    if (message) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
                    <div className="mt-5 flex items-center gap-3">
                        {undoButton}
                        {redoButton}
                        <Link to="/decks" className="btn-secondary">Back to decks</Link>
                    </div>
                </main>
            </div>
        );
    }
    if (isFinished) {
        return (
            <div className="min-h-svh">
                <Navbar
                    right={
                        <div className="flex items-center gap-2">
                            {undoButton}
                            {redoButton}
                        </div>
                    }
                />
                <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Study complete</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        You reviewed every due card in this deck. Great job!
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => void undoLastReview()}
                            disabled={!canUndo || historyBusy}
                        >
                            {undoIcon}
                            {isUndoing ? "Undoing…" : "Undo last review"}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => void redoLastReview()}
                            disabled={!canRedo || historyBusy}
                        >
                            {redoIcon}
                            {isRedoing ? "Redoing…" : "Redo"}
                        </button>
                        <Link to={`/decks/${deckId}`} className="btn-primary">
                            Back to deck
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (
        !currentCard &&
        remainingCards.length === 0 &&
        learningQueue.length === 0
    ) {
        return (
            <div className="min-h-svh">
                <Navbar />
                <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Nothing to study</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        This deck has no available cards to study yet.
                    </p>
                    <Link to={`/decks/${deckId}`} className="btn-secondary mt-6">
                        Back to deck
                    </Link>
                </main>
            </div>
        );
    }
    if (!currentCard) {
        return null;
    }

    const remaining = remainingCards.length + learningQueue.length + 1;
    const reviewed = Math.max(0, totalToStudy - remaining);
    const progress = totalToStudy > 0 ? (reviewed / totalToStudy) * 100 : 0;

    const ratingButtons: {
        rating: Rating;
        label: string;
        seconds: number;
        classes: string;
    }[] = reviewOptions
        ? [
            { rating: 1, label: "Again", seconds: reviewOptions.again.interval_seconds, classes: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60" },
            { rating: 2, label: "Hard", seconds: reviewOptions.hard.interval_seconds, classes: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60" },
            { rating: 3, label: "Good", seconds: reviewOptions.good.interval_seconds, classes: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60" },
            { rating: 4, label: "Easy", seconds: reviewOptions.easy.interval_seconds, classes: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60" },
        ]
        : [];

    return (
        <div className="min-h-svh">
            <Navbar
                right={
                    <div className="flex items-center gap-2">
                        {undoButton}
                        {redoButton}
                        <Link
                            to={`/decks/${deckId}`}
                            className="btn-ghost"
                        >
                            Exit
                        </Link>
                    </div>
                }
            />

            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span>Progress</span>
                    <span>{remaining} left</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flip-scene mt-8">
                    <div className={`flip-card ${isAnswerVisible ? "is-flipped" : ""}`}>
                        <div className="flip-face card-surface flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center sm:px-10">
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Question
                            </span>
                            <p className="text-2xl font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-3xl">
                                {currentCard.front}
                            </p>
                        </div>

                        <div className="flip-face flip-face--back card-surface flex min-h-72 flex-col items-center justify-center gap-4 bg-gradient-to-br from-white to-brand-50 dark:from-slate-900 dark:to-slate-800 px-6 py-12 text-center sm:px-10">
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500 dark:text-brand-400">
                                Answer
                            </span>
                            <p className="text-2xl font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-3xl">
                                {currentCard.back}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    {!isAnswerVisible ? (
                        <button
                            type="button"
                            className="btn-primary mx-auto flex w-full max-w-xs"
                            onClick={showAnswer}
                        >
                            Show answer
                            <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
                                Space
                            </kbd>
                        </button>
                    ) : (
                        <div>
                            {isLoadingOptions && (
                                <p className="text-center text-sm text-slate-400 dark:text-slate-500">Calculating intervals…</p>
                            )}

                            {reviewOptions && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {ratingButtons.map((option, index) => (
                                        <button
                                            key={option.rating}
                                            type="button"
                                            onClick={() => rateCard(option.rating)}
                                            disabled={isRating || isUndoing || isRedoing}
                                            className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${option.classes}`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <kbd className="rounded bg-white/70 px-1.5 py-0.5 text-xs dark:bg-black/35 dark:text-inherit">
                                                    {index + 1}
                                                </kbd>
                                                {option.label}
                                            </span>
                                            <span className="text-xs font-medium opacity-80">
                                                {formatInterval(option.seconds)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default StudyPage;
