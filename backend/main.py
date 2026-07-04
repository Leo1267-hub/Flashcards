from fastapi import FastAPI

from backend.routes.cards import router as cards_router
from backend.routes.decks import router as decks_router
from backend.routes.auth import router as auth_router

app = FastAPI()


app.include_router(decks_router)
app.include_router(cards_router)
app.include_router(auth_router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Flashcards API"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "OK"}