import { Link, useNavigate } from "react-router-dom";
import type { Deck } from "../types/deck";

type DeckListItemProps = {
    deck: Deck;
    onEdit: (deck: Deck) => void;
    onDelete: (deckId: number) => void;
};

function DeckListItem({
    deck,
    onEdit,
    onDelete,
}: DeckListItemProps) {
    const navigate = useNavigate();
    const hasDue = deck.due_count > 0;

    return (
        <li className="group card-surface flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-brand-700" />

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <Link
                        to={`/decks/${deck.id}`}
                        className="text-left text-lg font-semibold text-slate-900 transition-colors hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                    >
                        {deck.name}
                    </Link>
                    {hasDue ? (
                        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-400/25">
                            {deck.due_count} due
                        </span>
                    ) : (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/25">
                            All caught up
                        </span>
                    )}
                </div>

                {deck.description && (
                    <p className="line-clamp-2 text-left text-sm text-slate-500 dark:text-slate-400">
                        {deck.description}
                    </p>
                )}

                <div className="mt-auto flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="14" height="14" rx="2" />
                        <path d="M7 8h6M7 12h6" />
                    </svg>
                    {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                        type="button"
                        className="btn-primary flex-1"
                        onClick={() => navigate(`/decks/${deck.id}/study`)}
                        disabled={deck.card_count === 0}
                    >
                        Study
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onEdit(deck)}
                        aria-label={`Edit ${deck.name}`}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="btn-danger"
                        onClick={() => onDelete(deck.id)}
                        aria-label={`Delete ${deck.name}`}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </li>
    );
}

export default DeckListItem;
