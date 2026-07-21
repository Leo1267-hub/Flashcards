import type { Card } from "../types/card";
import CardListItem from "./CardListItem";

type CardListProps = {
    cards: Card[];
    deletingCardId: number | null;
    onEdit: (card: Card) => void;
    onDelete: (cardId: number) => void;
};

function CardList({ cards, deletingCardId, onEdit, onDelete }: CardListProps) {
    if (cards.length === 0) {
        return (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">This deck has no cards yet.</p>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Add your first card to start studying.</p>
            </div>
        );
    }

    return (
        <ul className="mt-6 flex flex-col gap-3">
            {cards.map((card) => (
                <CardListItem
                    key={card.id}
                    card={card}
                    isDeleting={deletingCardId === card.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </ul>
    );
}

export default CardList;
