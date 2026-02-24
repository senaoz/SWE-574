from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from .user import PyObjectId


class RatingCreate(BaseModel):
    transaction_id: str
    rated_user_id: str
    score: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}


class RatingResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    transaction_id: PyObjectId
    rater_id: PyObjectId
    rated_user_id: PyObjectId
    score: int
    comment: Optional[str] = None
    created_at: datetime
    rater: Optional[dict] = None
    rated_user: Optional[dict] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RatingListResponse(BaseModel):
    ratings: list[RatingResponse]
    total: int
    average_score: Optional[float] = None
