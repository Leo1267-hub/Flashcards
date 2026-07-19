import { Link } from "react-router-dom";
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
    return (
        <li className="deck-list-item">
            <div className="deck-list-item__info">
                <Link to={`/decks/${deck.id}`}>
                    {deck.name}
                </Link>

                <span>
                    {deck.card_count} cards
                </span>

                <strong>
                    {deck.due_count} due
                </strong>

            </div>

            <div className="deck-list-item__actions">
                <button
                    type="button"
                    onClick={() => onEdit(deck)}
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(deck.id)}
                >
                    Delete
                </button>
            </div>
        </li>
    );
}

export default DeckListItem;
