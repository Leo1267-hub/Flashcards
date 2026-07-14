import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DecksPage from "./pages/DecksPage";
import "./App.css";
import SignupPage from "./pages/SignupPage";
import DeckPage from "./pages/DeckPage";
import StudyPage from "./pages/StudyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/decks/:deckId" element={<DeckPage />} />
        <Route path="/" element={<Navigate to="/decks" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/decks/:deckId/study" element={<StudyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;