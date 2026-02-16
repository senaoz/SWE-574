from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime
from bson import ObjectId

def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class ChatRoomBase(BaseModel):
    """Base chat room model"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class ChatRoomCreate(ChatRoomBase):
    """Create chat room model"""
    participant_ids: List[PyObjectId] = Field(..., min_items=2, max_items=10)
    service_id: Optional[PyObjectId] = None  # For backward compatibility, will be added to service_ids
    service_ids: Optional[List[PyObjectId]] = Field(default_factory=list)
    transaction_id: Optional[PyObjectId] = None


class ChatRoomUpdate(BaseModel):
    """Update chat room model"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class ChatRoomResponse(ChatRoomBase):
    """Chat room response model"""
    id: PyObjectId = Field(alias="_id")
    participant_ids: List[PyObjectId]
    service_ids: List[PyObjectId] = Field(default_factory=list)
    transaction_id: Optional[PyObjectId] = None
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    participants: Optional[List[dict]] = None  # Populated with user info
    services: Optional[List[dict]] = None  # Populated with service info (multiple services)
    service: Optional[dict] = None  # For backward compatibility (first service)
    transaction: Optional[dict] = None  # Populated with transaction info

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class ChatRoomListResponse(BaseModel):
    """Chat room list response model"""
    rooms: List[ChatRoomResponse]
    total: int
    page: int
    limit: int


class MessageBase(BaseModel):
    """Base message model"""
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: str = Field(default="text", pattern="^(text|image|file|system)$")


class MessageCreate(MessageBase):
    """Create message model"""
    room_id: PyObjectId
    reply_to_message_id: Optional[PyObjectId] = None


class MessageUpdate(BaseModel):
    """Update message model"""
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    is_edited: bool = True


class MessageResponse(MessageBase):
    """Message response model"""
    id: PyObjectId = Field(alias="_id")
    room_id: PyObjectId
    sender_id: PyObjectId
    reply_to_message_id: Optional[PyObjectId] = None
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
    sender: Optional[dict] = None  # Populated with user info
    reply_to_message: Optional[dict] = None  # Populated with message info

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class MessageListResponse(BaseModel):
    """Message list response model"""
    messages: List[MessageResponse]
    total: int
    page: int
    limit: int


class ChatRoomParticipant(BaseModel):
    """Chat room participant model"""
    user_id: PyObjectId
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    is_active: bool = True
    role: str = Field(default="participant", pattern="^(participant|admin|moderator)$")
