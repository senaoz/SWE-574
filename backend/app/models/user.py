import re
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId, Decimal128
from pydantic import BeforeValidator
from typing_extensions import Annotated
from enum import Enum

def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"


URL_REGEX = re.compile(
    r'^https?://'
    r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}'
    r'(?:/[^\s]*)?$'
)


class SocialLinks(BaseModel):
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    portfolio: Optional[str] = None

    @model_validator(mode='after')
    def validate_urls(self):
        for field_name in ['linkedin', 'github', 'twitter', 'instagram', 'website', 'portfolio']:
            value = getattr(self, field_name)
            if value is not None and value.strip() != '':
                if not URL_REGEX.match(value):
                    raise ValueError(f"Invalid URL for {field_name}: {value}")
            elif value is not None and value.strip() == '':
                setattr(self, field_name, None)
        return self


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    interests: Optional[List[str]] = None
    is_active: bool = True
    is_verified: bool = False
    role: UserRole = UserRole.USER
    # Privacy settings
    profile_visible: bool = True
    show_email: bool = False
    show_location: bool = True
    # Notification settings
    email_notifications: bool = True
    service_matches_notifications: bool = True
    messages_notifications: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    confirm_password: str

    class Config:
        json_encoders = {ObjectId: str}


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: PyObjectId = Field(alias="_id")
    timebank_balance: float = 0.0
    created_at: datetime
    updated_at: datetime

    @field_validator('timebank_balance', mode='before')
    @classmethod
    def validate_timebank_balance(cls, v):
        if isinstance(v, Decimal128):
            return float(v.to_decimal())
        return float(v) if v is not None else 0.0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None
    social_links: Optional[SocialLinks] = None
    interests: Optional[List[str]] = None

    class Config:
        json_encoders = {ObjectId: str}


class UserSettingsUpdate(BaseModel):
    """Update user privacy and notification settings"""
    profile_visible: Optional[bool] = None
    show_email: Optional[bool] = None
    show_location: Optional[bool] = None
    email_notifications: Optional[bool] = None
    service_matches_notifications: Optional[bool] = None
    messages_notifications: Optional[bool] = None

    class Config:
        json_encoders = {ObjectId: str}


class PasswordChange(BaseModel):
    """Change user password"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    class Config:
        json_encoders = {ObjectId: str}


class AccountDeletion(BaseModel):
    """Delete user account"""
    password: str  # Require password confirmation for account deletion

    class Config:
        json_encoders = {ObjectId: str}


class UserRoleUpdate(BaseModel):
    role: UserRole

    class Config:
        json_encoders = {ObjectId: str}


class OAuthUserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    provider: str  # "google" or "github"
    provider_id: str

    class Config:
        json_encoders = {ObjectId: str}


class TimeBankTransaction(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    amount: float  # Positive for earning, negative for spending
    description: str
    service_id: Optional[PyObjectId] = None
    created_at: datetime

    @field_validator('amount', mode='before')
    @classmethod
    def validate_amount(cls, v):
        if isinstance(v, Decimal128):
            return float(v.to_decimal())
        return float(v) if v is not None else 0.0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class TimeBankResponse(BaseModel):
    balance: float
    transactions: List[TimeBankTransaction]
    max_balance: float = 10.0
    can_earn: bool = True
    requires_need_creation: bool = False

    @field_validator('balance', mode='before')
    @classmethod
    def validate_balance(cls, v):
        if isinstance(v, Decimal128):
            return float(v.to_decimal())
        return float(v) if v is not None else 0.0

    class Config:
        json_encoders = {ObjectId: str}
