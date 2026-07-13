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
        return <p>This deck has no cards yet.</p>;
    }

    return (
        <ul>
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
