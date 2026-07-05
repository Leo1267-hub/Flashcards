
import { apiFetch } from './api';
import './App.css'

async function App() {
  const decks = await apiFetch("/decks");
}

export default App
