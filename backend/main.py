from contextlib import asynccontextmanager

from fastapi import FastAPI

from backend.database import Base, engine
from backend.routes.cards import router as cards_router
from backend.routes.decks import router as decks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(decks_router)
app.include_router(cards_router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Flashcards API"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "OK"}
