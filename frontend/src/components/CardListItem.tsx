import type { Card } from "../types/card";

type CardListItemProps = {
    card: Card;
    isDeleting: boolean;
    onEdit: (card: Card) => void;
    onDelete: (cardId: number) => void;
};

function CardListItem({ card, isDeleting, onEdit, onDelete }: CardListItemProps) {
    return (
        <li>
            <strong>{card.front}</strong>
            <p>{card.back}</p>
            <button type="button" onClick={() => onEdit(card)}>
                Edit
            </button>
            <button
                type="button"
                onClick={() => onDelete(card.id)}
                disabled={isDeleting}
            >
                {isDeleting ? "Deleting..." : "Delete"}
            </button>
        </li>
    );
}

export default CardListItem;
