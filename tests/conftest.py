import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from backend.main import app
from backend.database import get_db
from backend.config import settings

ROOT_DIR = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = settings.test_database_url

test_engine = create_async_engine(
    TEST_DATABASE_URL,
)

def make_alembic_config() -> Config:
    config = Config(str(ROOT_DIR / "alembic.ini"))
    config.attributes["database_url"] = TEST_DATABASE_URL
    return config

TestSessionLocal = async_sessionmaker(
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False,
    )

@pytest.fixture(scope='session')
def migrated_test_db():
    reset_engine = create_engine(TEST_DATABASE_URL)

    with reset_engine.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))

    reset_engine.dispose()

    command.upgrade(make_alembic_config(), "head")
    
@pytest.fixture
def clean_test_db(migrated_test_db):
    reset_engine = create_engine(TEST_DATABASE_URL)

    with reset_engine.begin() as connection:
        connection.execute(
            text("TRUNCATE TABLE cards, decks, users RESTART IDENTITY CASCADE")
        )

    reset_engine.dispose()

async def override_get_db():
    async with TestSessionLocal() as db:
        yield db
        
@pytest_asyncio.fixture
async def ac(clean_test_db):
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app),
                           base_url='http://test'
                           ) as client:
        yield client
        
    app.dependency_overrides.clear()


