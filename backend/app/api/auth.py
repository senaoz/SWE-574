from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx

from ..core.database import get_database
from ..core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token,
    get_google_user_info,
    get_github_user_info
)
from ..core.config import settings
from ..models.user import UserCreate, UserLogin, UserResponse, OAuthUserCreate
from ..services.user_service import UserService
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db=Depends(get_database)
) -> UserResponse:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db=Depends(get_database)):
    """Register a new user"""
    auth_service = AuthService(db)
    
    # Check if passwords match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Check if user already exists
    existing_user = await auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username is taken
    existing_username = await auth_service.get_user_by_username(user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    user = await auth_service.create_user(user_data)
    return user

@router.post("/login")
async def login(login_data: UserLogin, db=Depends(get_database)):
    """Login user and return access token"""
    auth_service = AuthService(db)
    
    # Authenticate user
    user = await auth_service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/oauth/{provider}")
async def oauth_login(provider: str):
    """Initiate OAuth flow"""
    if provider not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth provider"
        )
    
    # Return OAuth URLs for frontend to redirect to
    if provider == "google":
        return {
            "auth_url": f"https://accounts.google.com/oauth/authorize?client_id={settings.google_client_id}&redirect_uri=http://localhost:3000/auth/callback/google&response_type=code&scope=openid email profile"
        }
    elif provider == "github":
        return {
            "auth_url": f"https://github.com/login/oauth/authorize?client_id={settings.github_client_id}&redirect_uri=http://localhost:3000/auth/callback/github&scope=user:email"
        }

@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str, 
    code: str, 
    db=Depends(get_database)
):
    """Handle OAuth callback and create/login user"""
    auth_service = AuthService(db)
    
    try:
        if provider == "google":
            # Exchange code for access token
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": "http://localhost:3000/auth/callback/google"
                    }
                )
                token_data = token_response.json()
                access_token = token_data["access_token"]
            
            # Get user info
            user_info = await get_google_user_info(access_token)
            
            # Create or get user
            user = await auth_service.get_or_create_oauth_user(
                email=user_info["email"],
                username=user_info.get("name", user_info["email"].split("@")[0]),
                full_name=user_info.get("name"),
                provider="google",
                provider_id=user_info["id"]
            )
            
        elif provider == "github":
            # Exchange code for access token
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    "https://github.com/login/oauth/access_token",
                    data={
                        "client_id": settings.github_client_id,
                        "client_secret": settings.github_client_secret,
                        "code": code
                    },
                    headers={"Accept": "application/json"}
                )
                token_data = token_response.json()
                access_token = token_data["access_token"]
            
            # Get user info
            user_info = await get_github_user_info(access_token)
            
            # Create or get user
            user = await auth_service.get_or_create_oauth_user(
                email=user_info["email"],
                username=user_info.get("login", user_info["email"].split("@")[0]),
                full_name=user_info.get("name"),
                provider="github",
                provider_id=str(user_info["id"])
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user
