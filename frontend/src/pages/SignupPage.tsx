import { apiFetch } from "../api";
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrandMark } from "../components/Navbar";
import PasswordInput from "../components/PasswordInput";
import ThemeToggle from "../components/ThemeToggle";


function SignupPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    async function signup(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        try {
            const data = await apiFetch('/signup', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    email,
                    password
                }),
            });
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem('last_username', username)
            navigate('/decks')
        } catch {
            setMessage('Username or email is already used');
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
                        Create your account
                    </h1>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        Start building smarter study habits today.
                    </p>
                </div>

                <form onSubmit={signup} className="card-surface flex flex-col gap-4 p-6 sm:p-7">
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
                        <label htmlFor="email" className="field-label">Email</label>
                        <input
                            id="email"
                            className="field-input"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="field-label">Password</label>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                        />
                    </div>

                    {message && (
                        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                            {message}
                        </p>
                    )}

                    <button type="submit" className="btn-primary mt-1 w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating account…' : 'Sign up'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    );
}
export default SignupPage;
