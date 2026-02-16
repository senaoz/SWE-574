from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated
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

class FailedTransactionReason(str, Enum):
    PROVIDER_BALANCE_LIMIT = "provider_balance_limit"  # Provider balance >= 10.0
    INSUFFICIENT_BALANCE = "insufficient_balance"  # Receiver balance would go negative
    USER_NOT_FOUND = "user_not_found"
    UNKNOWN_ERROR = "unknown_error"

class FailedTimebankTransaction(BaseModel):
    """Model for logging failed TimeBank transactions"""
    user_id: PyObjectId
    amount: float  # Positive for earning, negative for spending
    description: str
    service_id: Optional[PyObjectId] = None
    reason: str  # Reason for failure
    user_balance_at_failure: Optional[float] = None  # User's balance when transaction failed
    error_message: Optional[str] = None  # Detailed error message
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
