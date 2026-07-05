import { useState } from "react";
import { apiFetch } from "./api";
import "./App.css";

type Deck = {
  id: number;
  name: string;
  description: string | null;
  card_count: number;
};

function App() {
  const [username, setUsername] = useState("leo123");
  const [password, setPassword] = useState("password123");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [message, setMessage] = useState("");

  async function login() {
    const data = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    });

    localStorage.setItem("access_token", data.access_token);
    setMessage("Logged in");
  }

  async function loadDecks() {
    const data = await apiFetch("/decks");
    setDecks(data);
  }

  return (
    <main>
      <h1>Flashcards</h1>

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
      <button onClick={loadDecks}>Load Decks</button>

      <p>{message}</p>

      <ul>
        {decks.map((deck) => (
          <li key={deck.id}>
            {deck.name} ({deck.card_count} cards)
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;