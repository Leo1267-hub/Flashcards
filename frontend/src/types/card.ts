export type CardSide = "front" | "back";

export type Card = {
    id: number;
    front: string;
    back: string;
    front_image_url: string | null;
    back_image_url: string | null;
    deck_id: number;
    // Learning: 1, Review: 2, Relearn: 3
    fsrs_state: 1 | 2 | 3;
    fsrs_step: number | null;
    stability: number | null;
    difficulty: number | null;
    due: string;
    last_review: string | null;
};

export type CardReviewResponse = {
    card: Card;
    review_id: number;
};
