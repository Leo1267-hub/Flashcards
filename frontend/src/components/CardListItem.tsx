import { Link } from "react-router-dom";
import type { Card } from "../types/card";

type CardListItemProps = {
    card: Card;
    isDeleting: boolean;
    onDelete: (cardId: number) => void;
};

function CardListItem({ card, isDeleting, onDelete }: CardListItemProps) {
    return (
        <li className="card-surface group grid gap-3 p-5 transition-colors hover:border-brand-200 dark:hover:border-brand-800 sm:grid-cols-[1fr_1fr_auto] sm:items-stretch">
            <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Front
                </p>
                <p className="text-sm font-medium wrap-break-word text-slate-900 dark:text-slate-100">{card.front}</p>
            </div>

            <div className="min-w-0 border-t border-slate-100 pt-3 dark:border-slate-800 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Back
                </p>
                <p className="text-sm wrap-break-word text-slate-600 dark:text-slate-300">{card.back}</p>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <Link
                    to={`/decks/${card.deck_id}/cards/${card.id}/edit`}
                    className="btn-secondary"
                >
                    Edit
                </Link>
                <button
                    type="button"
                    className="btn-danger"
                    onClick={() => onDelete(card.id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting…" : "Delete"}
                </button>
            </div>
        </li>
    );
}

export default CardListItem;
