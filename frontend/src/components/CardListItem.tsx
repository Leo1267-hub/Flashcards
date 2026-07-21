import type { Card } from "../types/card";

type CardListItemProps = {
    card: Card;
    isDeleting: boolean;
    onEdit: (card: Card) => void;
    onDelete: (cardId: number) => void;
};

function CardListItem({ card, isDeleting, onEdit, onDelete }: CardListItemProps) {
    return (
        <li className="card-surface group flex flex-col gap-4 p-5 transition-colors hover:border-brand-200 dark:hover:border-brand-800 sm:flex-row sm:items-start">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Front
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{card.front}</p>
                </div>
                <div className="border-t border-slate-100 pt-3 dark:border-slate-800 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        Back
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{card.back}</p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <button type="button" className="btn-secondary" onClick={() => onEdit(card)}>
                    Edit
                </button>
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
