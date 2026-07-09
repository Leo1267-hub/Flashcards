import { apiFetch } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const navigate = useNavigate();
    async function login() {
        try {
            const data = await apiFetch('/login', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    password
                }),
            });
            localStorage.setItem("access_token", data.access_token);
            navigate('/decks')
        } catch {
            setMessage('Invalid Username or Password');
        }
    }
    return (
        <main>
            <h1>Login</h1>

            <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
            />

            <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type="password"
            />

            <button onClick={login}>Login</button>

            <p>{message}</p>
        </main>
    );
}

export default LoginPage;
