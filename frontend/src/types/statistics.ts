export type ActivityDay = {
    date: string;
    count: number;
};

export type ActivityStats = {
    total_reviews: number;
    active_days: number;
    max_streak: number;
    days: ActivityDay[];
};
