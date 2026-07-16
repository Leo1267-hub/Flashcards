
export type Rating = 1 | 2 | 3 | 4;

type RatingOption = {
    rating: Rating;
    due: string;
    interval_seconds: number;
};

export type ReviewOptions = {
    again: RatingOption;
    hard: RatingOption;
    good: RatingOption;
    easy: RatingOption;
};
