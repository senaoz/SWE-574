from typing import Optional
from datetime import datetime
from bson import ObjectId

from ..models.user import UserCreate, UserLogin, UserResponse, OAuthUserCreate, UserRole
from ..core.security import get_password_hash, verify_password
from ..core.database import get_database


class AuthService:
    def __init__(self, db):
        self.db = db
        self.users_collection = db.users

    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        try:
            user_doc = await self.users_collection.find_one({"email": email})
            if user_doc:
                return UserResponse(**user_doc)
            return None
        except Exception:
            return None

    async def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """Get user by username"""
        try:
            user_doc = await self.users_collection.find_one({"username": username})
            if user_doc:
                return UserResponse(**user_doc)
            return None
        except Exception:
            return None

    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user"""
        try:
            # Check if user already exists with this email
            existing_user = await self.get_user_by_email(user_data.email)
            if existing_user:
                raise ValueError("Email already registered")
            
            # Check if username is taken
            existing_username = await self.get_user_by_username(user_data.username)
            if existing_username:
                raise ValueError("Username already taken")
            
            # Ensure password is not longer than 72 characters before hashing
            password = user_data.password
            if len(password) > 72:
                password = password[:72]
            
            # Hash password
            hashed_password = get_password_hash(password)
            
            # Create user document
            user_doc = {
                "username": user_data.username,
                "email": user_data.email,
                "password_hash": hashed_password,
                "full_name": user_data.full_name,
                "bio": user_data.bio,
                "location": user_data.location,
                "is_active": True,
                "is_verified": False,
                "role": user_data.role,
                "timebank_balance": 3.0,
                # Privacy settings
                "profile_visible": user_data.profile_visible,
                "show_email": user_data.show_email,
                "show_location": user_data.show_location,
                # Notification settings
                "email_notifications": user_data.email_notifications,
                "service_matches_notifications": user_data.service_matches_notifications,
                "messages_notifications": user_data.messages_notifications,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert user
            result = await self.users_collection.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            
            # Remove password hash from response
            del user_doc["password_hash"]
            
            return UserResponse(**user_doc)
        except ValueError:
            # Re-raise ValueError (duplicate email/username)
            raise
        except Exception as e:
            raise ValueError(f"Error creating user: {str(e)}")

    async def authenticate_user(self, email: str, password: str) -> Optional[UserResponse]:
        """Authenticate user with email and password"""
        try:
            user_doc = await self.users_collection.find_one({"email": email})
            if not user_doc:
                return None
            
            # Verify password
            if not verify_password(password, user_doc.get("password_hash", "")):
                return None
            
            # Remove password hash from response
            del user_doc["password_hash"]
            
            return UserResponse(**user_doc)
        except Exception:
            return None

    async def get_or_create_oauth_user(self, email: str, username: str, full_name: Optional[str], provider: str, provider_id: str) -> UserResponse:
        """Get existing OAuth user or create new one"""
        try:
            # Check if user exists with this email
            existing_user = await self.get_user_by_email(email)
            if existing_user:
                return existing_user
            
            # Check if username is taken
            original_username = username
            counter = 1
            while await self.get_user_by_username(username):
                username = f"{original_username}{counter}"
                counter += 1
            
            # Create OAuth user
            user_doc = {
                "username": username,
                "email": email,
                "full_name": full_name,
                "is_active": True,
                "is_verified": True,  # OAuth users are considered verified
                "role": UserRole.USER,  # OAuth users start as regular users
                "timebank_balance": 3.0,
                "oauth_provider": provider,
                "oauth_provider_id": provider_id,
                # Privacy settings (defaults)
                "profile_visible": True,
                "show_email": False,
                "show_location": True,
                # Notification settings (defaults)
                "email_notifications": True,
                "service_matches_notifications": True,
                "messages_notifications": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert user
            result = await self.users_collection.insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            
            return UserResponse(**user_doc)
        except Exception as e:
            raise ValueError(f"Error creating OAuth user: {str(e)}")
