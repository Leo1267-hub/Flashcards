import { apiFetch } from "../api";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/Navbar";
import ThemeToggle from "../components/ThemeToggle";

function LoginPage() {
    const [username, setUsername] = useState(localStorage.getItem('last_username') || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    async function login(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        try {
            const data = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password
                }),
            });
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem('last_username', username)
            navigate('/decks')
        } catch {
            setMessage('Invalid username or password');
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-sm animate-pop-in">
                <div className="mb-8 flex flex-col items-center text-center">
                    <BrandMark />
                    <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Welcome back
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        Sign in to keep your streak going.
                    </p>
                </div>

                <form onSubmit={login} className="card-surface flex flex-col gap-4 p-6 sm:p-7">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="username" className="field-label">Username</label>
                        <input
                            id="username"
                            className="field-input"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="yourname"
                            autoComplete="username"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="field-label">Password</label>
                        <input
                            id="password"
                            className="field-input"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••"
                            type="password"
                            autoComplete="current-password"
                        />
                    </div>

                    {message && (
                        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            {message}
                        </p>
                    )}

                    <button type="submit" className="btn-primary mt-1 w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in…' : 'Log in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Don&apos;t have an account?{' '}
                    <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                        Sign up
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;
