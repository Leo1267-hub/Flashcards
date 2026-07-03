import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from backend.main import app
from backend.database import Base, get_db
from backend.models import Deck, Card
from backend.config import settings

TEST_DATABASE_URL = settings.test_database_url

test_engine = create_async_engine(
    TEST_DATABASE_URL,
)

TestSessionLocal = async_sessionmaker(
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
    )

async def override_get_db():
    async with TestSessionLocal() as db:
        yield db
        
@pytest_asyncio.fixture
async def ac():
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app),
                           base_url='http://test'
                           ) as client:
        yield client
        
    app.dependency_overrides.clear()
    await test_engine.dispose()
