from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from enum import Enum
from pydantic import BeforeValidator
from typing_extensions import Annotated


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class NotificationType(str, Enum):
    JOIN_REQUEST_RECEIVED = "join_request_received"
    JOIN_REQUEST_APPROVED = "join_request_approved"
    JOIN_REQUEST_REJECTED = "join_request_rejected"
    TRANSACTION_COMPLETED = "transaction_completed"
    SERVICE_COMPLETED = "service_completed"
    NEW_MESSAGE = "new_message"
    SERVICE_STARTED = "service_started"
    SERVICE_MATCH = "service_match"


class NotificationRelatedType(str, Enum):
    SERVICE = "service"
    JOIN_REQUEST = "join_request"
    TRANSACTION = "transaction"
    CHAT_ROOM = "chat_room"


class NotificationResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    type: NotificationType
    title: str
    body: str
    related_id: str
    related_type: NotificationRelatedType
    is_read: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    page: int
    limit: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    count: int
