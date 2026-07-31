import { NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "../api";
import { BrandMark } from "./Navbar";
import ThemeToggle from "./ThemeToggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-semibold transition-colors",
        isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
    ].join(" ");

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
        "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
        isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
    ].join(" ");

function AppLayout() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => localStorage.getItem("access_token") !== null
    );
    const navigate = useNavigate();
    const isStudying = useMatch("/decks/:deckId/study");
    const isCreatingCard = useMatch("/decks/:deckId/cards/new");
    const hideNav = Boolean(isStudying || isCreatingCard);

    async function logout() {
        try {
            await apiFetch("/logout", { method: "POST" });
        } finally {
            localStorage.removeItem("access_token");
            setIsLoggedIn(false);
            navigate("/login");
        }
    }

    return (
        <div className="flex min-h-svh flex-col md:flex-row">
            {!hideNav && (
                <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/70 bg-white/70 px-4 py-5 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/60 md:flex">
                    <NavLink to="/decks" className="mb-8 px-1.5 transition-opacity hover:opacity-80">
                        <BrandMark />
                    </NavLink>

                    <nav className="flex flex-1 flex-col gap-1.5" aria-label="Main">
                        <NavLink to="/decks" className={navLinkClass}>
                            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="14" height="14" rx="2" />
                                <path d="M7 9h6M7 13h6" />
                            </svg>
                            Decks
                        </NavLink>
                        <NavLink to="/statistics" className={navLinkClass}>
                            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19V5M4 19h16" />
                                <path d="M8 15v-4M12 15V8M16 15v-6" />
                            </svg>
                            Statistics
                        </NavLink>
                    </nav>

                    <div className="mt-auto flex flex-col gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
                        <div className="flex items-center justify-between px-1.5">
                            <ThemeToggle />
                            {isLoggedIn ? (
                                <button type="button" className="btn-ghost" onClick={() => void logout()}>
                                    Log out
                                </button>
                            ) : (
                                <button type="button" className="btn-primary" onClick={() => navigate("/login")}>
                                    Log in
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            {!hideNav && (
                <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/60 md:hidden">
                    <NavLink to="/decks" className="transition-opacity hover:opacity-80">
                        <BrandMark />
                    </NavLink>
                    <nav className="flex items-center gap-1" aria-label="Main">
                        <NavLink to="/decks" className={mobileNavLinkClass}>
                            Decks
                        </NavLink>
                        <NavLink to="/statistics" className={mobileNavLinkClass}>
                            Statistics
                        </NavLink>
                    </nav>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        {isLoggedIn ? (
                            <button type="button" className="btn-ghost px-2.5" onClick={() => void logout()}>
                                Log out
                            </button>
                        ) : (
                            <button type="button" className="btn-primary px-2.5" onClick={() => navigate("/login")}>
                                Log in
                            </button>
                        )}
                    </div>
                </header>
            )}

            <div className="min-w-0 flex-1">
                <Outlet />
            </div>
        </div>
    );
}

export default AppLayout;
