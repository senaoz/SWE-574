from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId
from typing_extensions import Annotated

def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    service_id: PyObjectId


class CommentCreate(CommentBase):
    pass

    class Config:
        json_encoders = {ObjectId: str}


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

    class Config:
        json_encoders = {ObjectId: str}


class CommentResponse(CommentBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None  # Will be populated with user info

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CommentListResponse(BaseModel):
    comments: list[CommentResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}
