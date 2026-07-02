import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database import Base, get_db
from backend.models import Deck, Card
from backend.config import settings

TEST_DATABASE_URL = settings.test_database_url

test_engine = create_engine(
    TEST_DATABASE_URL,
)

TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
    )

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
@pytest_asyncio.fixture
async def ac():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app),
                           base_url='http://test'
                           ) as client:
        yield client
        
    app.dependency_overrides.clear()