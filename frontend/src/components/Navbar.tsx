import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type NavbarProps = {
    right?: ReactNode;
};

export function BrandMark({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[var(--shadow-lift)]">
                <span className="absolute -right-1 -top-1 h-9 w-9 -rotate-12 rounded-xl border-2 border-white/70" />
                <svg
                    viewBox="0 0 24 24"
                    className="relative h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                    <path d="M8 9h6M8 12h6" />
                </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Recall<span className="text-brand-600 dark:text-brand-400">.</span>
            </span>
        </span>
    );
}

function Navbar({ right }: NavbarProps) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/60">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                <Link to="/decks" className="transition-opacity hover:opacity-80">
                    <BrandMark />
                </Link>
                <div className="flex items-center gap-2">
                    {right}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

export default Navbar;
