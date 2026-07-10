import { apiFetch } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


function SignupPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    async function signup() {
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
        }
    }
    return (
        <main>
            <h1>Signup</h1>

            <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
            />
            <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
            />
            <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
            />

            <button onClick={signup}>Signup</button>
            <p>{message}</p>
            <p>Already have an account? Login</p>
        </main>
    );
}
export default SignupPage;