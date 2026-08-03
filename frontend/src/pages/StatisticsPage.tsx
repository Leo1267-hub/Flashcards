import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import ActivityHeatmap from "../components/ActivityHeatmap";
import type { ActivityStats } from "../types/statistics";

function StatisticsPage() {
    const [isLoggedIn] = useState(
        () => localStorage.getItem("access_token") !== null
    );
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [isLoading, setIsLoading] = useState(isLoggedIn);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!isLoggedIn) {
            setMessage("Please log in to see your study activity");
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function loadActivity() {
            setIsLoading(true);
            setMessage("");

            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const data = await apiFetch(
                    `/statistics/activity?timezone=${encodeURIComponent(timezone)}`
                );
                if (!cancelled) {
                    setStats(data);
                }
            } catch {
                if (!cancelled) {
                    setStats(null);
                    setMessage("Could not load your study activity");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadActivity();

        return () => {
            cancelled = true;
        };
    }, [isLoggedIn]);

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Statistics
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Track how consistently you review cards over the past year.
            </p>

            {message && (
                <p
                    role="alert"
                    className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50"
                >
                    {message}
                </p>
            )}

            {isLoading && (
                <div className="card-surface mt-8 animate-pulse p-6">
                    <div className="h-5 w-64 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-6 h-28 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
            )}

            {!isLoading && stats && (
                <section className="card-surface mt-8 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            <span className="text-xl font-bold tabular-nums">
                                {stats.total_reviews}
                            </span>{" "}
                            {stats.total_reviews === 1 ? "review" : "reviews"} in the past year
                        </h2>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                            <p>
                                Total active days:{" "}
                                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                    {stats.active_days}
                                </span>
                            </p>
                            <p>
                                Max streak:{" "}
                                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                    {stats.max_streak}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <ActivityHeatmap days={stats.days} />
                    </div>
                </section>
            )}
        </main>
    );
}

export default StatisticsPage;
