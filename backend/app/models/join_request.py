from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
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

class JoinRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class JoinRequestBase(BaseModel):
    service_id: PyObjectId
    message: Optional[str] = None

class JoinRequestCreate(JoinRequestBase):
    pass

    class Config:
        json_encoders = {ObjectId: str}

class JoinRequestUpdate(BaseModel):
    status: JoinRequestStatus
    admin_message: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}

class JoinRequestResponse(JoinRequestBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    status: JoinRequestStatus
    admin_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None  # Will be populated with user info

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class JoinRequestListResponse(BaseModel):
    requests: list[JoinRequestResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}
