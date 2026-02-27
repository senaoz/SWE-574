from pydantic import BaseModel, Field, BeforeValidator, model_validator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId
from enum import Enum
from typing_extensions import Annotated


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class ForumTargetType(str, Enum):
    DISCUSSION = "discussion"
    EVENT = "event"


# --------------- Discussion ---------------

class ForumDiscussionCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    body: str = Field(..., min_length=1, max_length=10000)
    tags: List[dict] = Field(default_factory=list, max_length=10)

    @model_validator(mode='before')
    @classmethod
    def normalize_tags(cls, data):
        if isinstance(data, dict) and 'tags' in data and isinstance(data['tags'], list):
            normalized = []
            for tag in data['tags']:
                if isinstance(tag, str):
                    normalized.append({"label": tag, "entityId": ""})
                elif isinstance(tag, dict) and "label" in tag:
                    normalized.append(tag)
                else:
                    normalized.append({"label": str(tag), "entityId": ""})
            data['tags'] = normalized
        return data

    class Config:
        json_encoders = {ObjectId: str}


class ForumDiscussionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    body: Optional[str] = Field(None, min_length=1, max_length=10000)
    tags: Optional[List[dict]] = Field(None, max_length=10)

    class Config:
        json_encoders = {ObjectId: str}


class ForumDiscussionResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    title: str
    body: str
    tags: List[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None
    comment_count: int = 0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ForumDiscussionListResponse(BaseModel):
    discussions: List[ForumDiscussionResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}


# --------------- Event ---------------

class ForumEventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=1, max_length=10000)
    event_at: datetime
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_remote: bool = False
    tags: List[dict] = Field(default_factory=list, max_length=10)
    service_id: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def normalize_tags(cls, data):
        if isinstance(data, dict) and 'tags' in data and isinstance(data['tags'], list):
            normalized = []
            for tag in data['tags']:
                if isinstance(tag, str):
                    normalized.append({"label": tag, "entityId": ""})
                elif isinstance(tag, dict) and "label" in tag:
                    normalized.append(tag)
                else:
                    normalized.append({"label": str(tag), "entityId": ""})
            data['tags'] = normalized
        return data

    class Config:
        json_encoders = {ObjectId: str}


class ForumEventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=10000)
    event_at: Optional[datetime] = None
    location: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_remote: Optional[bool] = None
    tags: Optional[List[dict]] = Field(None, max_length=10)
    service_id: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}


class ForumEventResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    title: str
    description: str
    event_at: datetime
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_remote: bool = False
    tags: List[dict] = Field(default_factory=list)
    service_id: Optional[PyObjectId] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None
    service: Optional[dict] = None
    comment_count: int = 0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ForumEventListResponse(BaseModel):
    events: List[ForumEventResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}


# --------------- Comment ---------------

class ForumCommentCreate(BaseModel):
    target_type: ForumTargetType
    target_id: str
    content: str = Field(..., min_length=1, max_length=2000)

    class Config:
        json_encoders = {ObjectId: str}


class ForumCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

    class Config:
        json_encoders = {ObjectId: str}


class ForumCommentResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    target_type: str
    target_id: PyObjectId
    content: str
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ForumCommentListResponse(BaseModel):
    comments: List[ForumCommentResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}
