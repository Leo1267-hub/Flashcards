from fastapi import APIRouter, Depends,HTTPException, Response
from authx import AuthX, AuthXConfig
from backend.schemas.auth import UserCreate
from backend.config import settings
from backend.database import get_db
from backend.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.security import hash_password, verify_password
from sqlalchemy import select


router = APIRouter(tags=["Authentication"])

config = AuthXConfig(
    JWT_SECRET_KEY=settings.jwt_secret_key,
    JWT_ACCESS_COOKIE_NAME="access_token",
    JWT_TOKEN_LOCATION=["cookies"],
)

auth = AuthX(config=config)


@router.post('/signup')
async def signup(credentials: UserCreate, db: AsyncSession = Depends(get_db),response:Response=None):
    stmt = select(User).where((User.username == credentials.username) | (User.email == credentials.email))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        raise HTTPException(400, detail="Username or email already registered")

    hashed_password = hash_password(credentials.password)
    new_user = User(
        username=credentials.username,
        email=credentials.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    access_token = auth.create_access_token(uid=credentials.username)
    response.set_cookie(key=config.JWT_ACCESS_COOKIE_NAME,
            value=access_token
            )
    return {"message": "User created successfully", "user_id": new_user.id}

@router.post('/login')
def login(credentials: UserCreate,response:Response):
    if credentials.username == "testuser" and credentials.password == "testpassword":
        access_token = auth.create_access_token(uid=credentials.username)
        response.set_cookie(
            key=config.JWT_ACCESS_COOKIE_NAME,
            value=access_token)
        response = {"access_token": access_token}
        return response
    
    raise HTTPException(401, detail="Invalid credentials")

@router.get("/protected", dependencies=[Depends(auth.access_token_required)])
def protected():
    return {"message": "Hello World"}
    
    
