from fastapi import APIRouter, Depends,HTTPException, Response
from authx import AuthX, AuthXConfig
from backend.schemas.auth import UserCreate
from backend.config import settings


router = APIRouter(tags=["Authentication"])

config = AuthXConfig(
    JWT_SECRET_KEY=settings.jwt_secret_key,
    JWT_ACCESS_COOKIE_NAME="access_token",
    JWT_TOKEN_LOCATION=["cookies"],
)

auth = AuthX(config=config)

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
    
    
