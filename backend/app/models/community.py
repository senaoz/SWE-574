from pydantic import BaseModel, Field, BeforeValidator, model_validator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class MemberRole(str, Enum):
    FOUNDER = "founder"
    MODERATOR = "moderator"
    MEMBER = "member"


class MemberStatus(str, Enum):
    ACTIVE = "active"
    BANNED = "banned"


class PostType(str, Enum):
    POST = "post"
    ANNOUNCEMENT = "announcement"


# ─────────────────────────── Community ───────────────────────────

class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=1, max_length=5000)
    rules: List[str] = Field(default_factory=list, max_length=20)
    tags: List[dict] = Field(default_factory=list, max_length=10)
    cover_image_url: Optional[str] = None
    avatar_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_tags(cls, data):
        if isinstance(data, dict) and "tags" in data and isinstance(data["tags"], list):
            normalized = []
            for tag in data["tags"]:
                if isinstance(tag, str):
                    normalized.append({"label": tag, "entityId": ""})
                elif isinstance(tag, dict) and "label" in tag:
                    normalized.append(tag)
                else:
                    normalized.append({"label": str(tag), "entityId": ""})
            data["tags"] = normalized
        return data

    class Config:
        json_encoders = {ObjectId: str}


class CommunityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    rules: Optional[List[str]] = Field(None, max_length=20)
    tags: Optional[List[dict]] = Field(None, max_length=10)
    cover_image_url: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}


class CommunityResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    slug: str
    description: str
    rules: List[str] = Field(default_factory=list)
    founder_id: PyObjectId
    tags: List[dict] = Field(default_factory=list)
    cover_image_url: Optional[str] = None
    avatar_url: Optional[str] = None
    member_count: int = 0
    post_count: int = 0
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    founder: Optional[dict] = None
    user_membership: Optional[str] = None  # "founder" | "moderator" | "member" | None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CommunityListResponse(BaseModel):
    communities: List[CommunityResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}


# ─────────────────────────── Membership ───────────────────────────

class MembershipResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    community_id: PyObjectId
    user_id: PyObjectId
    role: MemberRole
    status: MemberStatus
    joined_at: datetime
    user: Optional[dict] = None
    mutual_community_count: Optional[int] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MembershipListResponse(BaseModel):
    members: List[MembershipResponse]
    total: int

    class Config:
        json_encoders = {ObjectId: str}


class MemberRoleUpdate(BaseModel):
    role: MemberRole

    class Config:
        json_encoders = {ObjectId: str}


# ─────────────────────────── Community Post ───────────────────────────

class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    body: str = Field(..., min_length=1, max_length=10000)
    tags: List[dict] = Field(default_factory=list, max_length=10)
    post_type: PostType = PostType.POST

    @model_validator(mode="before")
    @classmethod
    def normalize_tags(cls, data):
        if isinstance(data, dict) and "tags" in data and isinstance(data["tags"], list):
            normalized = []
            for tag in data["tags"]:
                if isinstance(tag, str):
                    normalized.append({"label": tag, "entityId": ""})
                elif isinstance(tag, dict) and "label" in tag:
                    normalized.append(tag)
                else:
                    normalized.append({"label": str(tag), "entityId": ""})
            data["tags"] = normalized
        return data

    class Config:
        json_encoders = {ObjectId: str}


class CommunityPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    body: Optional[str] = Field(None, min_length=1, max_length=10000)
    tags: Optional[List[dict]] = Field(None, max_length=10)
    post_type: Optional[PostType] = None

    class Config:
        json_encoders = {ObjectId: str}


class CommunityPostResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    community_id: PyObjectId
    user_id: PyObjectId
    title: str
    body: str
    tags: List[dict] = Field(default_factory=list)
    post_type: str = "post"
    is_pinned: bool = False
    upvote_count: int = 0
    user_upvoted: bool = False
    comment_count: int = 0
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CommunityPostListResponse(BaseModel):
    posts: List[CommunityPostResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}
