import type { ActivityDay } from "../types/statistics";

type HeatmapCell = {
    date: string;
    count: number;
    level: number;
};

type HeatmapWeek = {
    cells: (HeatmapCell | null)[];
};

type MonthLabel = {
    label: string;
    weekIndex: number;
};

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Monday = 0 … Sunday = 6 */
function mondayBasedWeekday(date: Date): number {
    return (date.getDay() + 6) % 7;
}

function activityLevel(count: number, maxCount: number): number {
    if (count <= 0) {
        return 0;
    }
    if (maxCount <= 1) {
        return 4;
    }

    const ratio = count / maxCount;
    if (ratio <= 0.25) {
        return 1;
    }
    if (ratio <= 0.5) {
        return 2;
    }
    if (ratio <= 0.75) {
        return 3;
    }
    return 4;
}

const LEVEL_CLASS = [
    "bg-slate-200 dark:bg-slate-800",
    "bg-emerald-200 dark:bg-emerald-900/70",
    "bg-emerald-300 dark:bg-emerald-700/80",
    "bg-emerald-500 dark:bg-emerald-500",
    "bg-emerald-600 dark:bg-emerald-300",
] as const;

function formatTooltip(dateKey: string, count: number): string {
    const date = new Date(`${dateKey}T12:00:00`);
    const label = date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    if (count === 0) {
        return `No reviews on ${label}`;
    }
    if (count === 1) {
        return `1 review on ${label}`;
    }
    return `${count} reviews on ${label}`;
}

function buildHeatmap(days: ActivityDay[]): {
    weeks: HeatmapWeek[];
    months: MonthLabel[];
} {
    const counts = new Map(days.map((day) => [day.date, day.count]));
    const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);

    const today = startOfLocalDay(new Date());
    const start = addDays(today, -364);
    const gridStart = addDays(start, -mondayBasedWeekday(start));
    const gridEnd = addDays(today, 6 - mondayBasedWeekday(today));

    const weeks: HeatmapWeek[] = [];
    const months: MonthLabel[] = [];
    let cursor = gridStart;
    let weekIndex = 0;
    let lastMonthKey = "";

    while (cursor <= gridEnd) {
        const cells: (HeatmapCell | null)[] = [];

        for (let weekday = 0; weekday < 7; weekday += 1) {
            const cellDate = addDays(cursor, weekday);
            if (cellDate < start || cellDate > today) {
                cells.push(null);
                continue;
            }

            const dateKey = toDateKey(cellDate);
            const count = counts.get(dateKey) ?? 0;
            cells.push({
                date: dateKey,
                count,
                level: activityLevel(count, maxCount),
            });

            const monthKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}`;
            if (monthKey !== lastMonthKey) {
                months.push({
                    label: cellDate.toLocaleDateString(undefined, { month: "short" }),
                    weekIndex,
                });
                lastMonthKey = monthKey;
            }
        }

        weeks.push({ cells });
        cursor = addDays(cursor, 7);
        weekIndex += 1;
    }

    return { weeks, months };
}

type ActivityHeatmapProps = {
    days: ActivityDay[];
};

function ActivityHeatmap({ days }: ActivityHeatmapProps) {
    const { weeks, months } = buildHeatmap(days);
    const weekdayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

    return (
        <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-full">
                <div className="mb-1.5 flex">
                    <div className="w-7 shrink-0" />
                    <div className="relative h-4 flex-1">
                        {months.map((month) => (
                            <span
                                key={`${month.label}-${month.weekIndex}`}
                                className="absolute top-0 text-[10px] font-medium text-slate-400 dark:text-slate-500"
                                style={{ left: `${month.weekIndex * 14}px` }}
                            >
                                {month.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex gap-1">
                    <div className="flex w-7 shrink-0 flex-col gap-[3px]">
                        {weekdayLabels.map((label, index) => (
                            <div
                                key={`weekday-${index}`}
                                className="flex h-[11px] items-center justify-end pr-1"
                            >
                                {label ? (
                                    <span className="text-[10px] leading-none text-slate-400 dark:text-slate-500">
                                        {label}
                                    </span>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-[3px]">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                {week.cells.map((cell, dayIndex) => {
                                    if (!cell) {
                                        return (
                                            <div
                                                key={`${weekIndex}-${dayIndex}`}
                                                className="h-[11px] w-[11px] rounded-[2px] bg-transparent"
                                            />
                                        );
                                    }

                                    return (
                                        <div
                                            key={cell.date}
                                            title={formatTooltip(cell.date, cell.count)}
                                            className={`h-[11px] w-[11px] rounded-[2px] ${LEVEL_CLASS[cell.level]}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>Less</span>
                    {LEVEL_CLASS.map((className) => (
                        <div
                            key={className}
                            className={`h-[11px] w-[11px] rounded-[2px] ${className}`}
                        />
                    ))}
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}

export default ActivityHeatmap;
