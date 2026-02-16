from pydantic import BaseModel, Field, BeforeValidator, field_validator
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId, Decimal128
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

class TransactionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class TransactionBase(BaseModel):
    service_id: PyObjectId
    provider_id: PyObjectId
    requester_id: PyObjectId
    timebank_hours: float
    description: Optional[str] = None

    @field_validator('timebank_hours', mode='before')
    @classmethod
    def validate_timebank_hours(cls, v):
        if isinstance(v, Decimal128):
            return float(v.to_decimal())
        return float(v) if v is not None else 0.0

class TransactionCreate(TransactionBase):
    pass

    class Config:
        json_encoders = {ObjectId: str}

class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    completion_notes: Optional[str] = None
    dispute_reason: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}

class TransactionResponse(TransactionBase):
    id: PyObjectId = Field(alias="_id")
    status: TransactionStatus
    completion_notes: Optional[str] = None
    dispute_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    provider_confirmed: bool = False
    requester_confirmed: bool = False
    service: Optional[dict] = None  # Will be populated with service info
    provider: Optional[dict] = None  # Will be populated with provider info
    requester: Optional[dict] = None  # Will be populated with requester info

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}
