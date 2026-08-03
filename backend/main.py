from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.cards import router as cards_router
from backend.routes.decks import router as decks_router
from backend.routes.auth import router as auth_router
from backend.routes.statistics import router as statistics_router
from backend.services.storage import MEDIA_ROOT, MEDIA_URL_PATH

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(decks_router)
app.include_router(cards_router)
app.include_router(auth_router)
app.include_router(statistics_router)

MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(MEDIA_URL_PATH, StaticFiles(directory=MEDIA_ROOT), name="media")


@app.get("/", tags=["Root"])
def root():
    return {"message": "Flashcards API"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "OK"}