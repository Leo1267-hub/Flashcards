import { Link } from "react-router-dom";
import type { Deck } from "../types/deck";

type DeckListItemProps = {
    deck: Deck;
    onEdit: (deck: Deck) => void;
    onDelete: (deckId: number) => void;
};

function DeckListItem({ deck, onEdit, onDelete }: DeckListItemProps) {
    return (
        <li>
            <Link to={`/decks/${deck.id}`}>{deck.name}</Link>
            <span>({deck.card_count} cards)</span>
            <button type="button" onClick={() => onEdit(deck)}>
                Edit
            </button>
            <button type="button" onClick={() => onDelete(deck.id)}>
                Delete
            </button>
        </li>
    );
}

export default DeckListItem;
