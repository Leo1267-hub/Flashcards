from fastapi import APIRouter, Depends,HTTPException, Response
from backend.auth import auth, auth_config
from backend.schemas.auth import UserCreate,UserLogin
from backend.database import get_db
from backend.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.security import hash_password, verify_password
from sqlalchemy import select


router = APIRouter(tags=["Authentication"])


@router.post('/signup')
async def signup(credentials: UserCreate,
                response:Response,
                db: AsyncSession = Depends(get_db)
                ):
    query = select(User).where((User.username == credentials.username) | (User.email == credentials.email))
    result = await db.execute(query)
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
    response.set_cookie(key=auth_config.JWT_ACCESS_COOKIE_NAME,
            value=access_token
            )
    return {"message": "User created successfully",
            "user_id": new_user.id,
            "access_token": access_token
            }

@router.post('/login')
async def login(credentials: UserLogin,
                response:Response,
                db: AsyncSession = Depends(get_db)
                ):
    query = select(User).where(User.username == credentials.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user == None or not verify_password(credentials.password,user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token(uid=credentials.username)
    response.set_cookie(key=auth_config.JWT_ACCESS_COOKIE_NAME,
                        value=access_token
                        )
    return {"message": "successfully",
            "user_id": user.id,
            "access_token": access_token
            }

@router.get("/protected", dependencies=[Depends(auth.access_token_required)])
def protected():
    return {"message": "Hello World"}

@router.get("/me")
async def me(payload=Depends(auth.access_token_required)):
    return payload
    
