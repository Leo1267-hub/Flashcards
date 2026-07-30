import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DecksPage from "./pages/DecksPage";
import "./App.css";
import SignupPage from "./pages/SignupPage";
import DeckPage from "./pages/DeckPage";
import AddCardPage from "./pages/AddCardPage";
import EditCardPage from "./pages/EditCardPage";
import StudyPage from "./pages/StudyPage";
import StatisticsPage from "./pages/StatisticsPage";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/decks" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AppLayout />}>
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/decks/:deckId" element={<DeckPage />} />
          <Route path="/decks/:deckId/cards/new" element={<AddCardPage />} />
          <Route path="/decks/:deckId/cards/:cardId/edit" element={<EditCardPage />} />
          <Route path="/decks/:deckId/study" element={<StudyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
