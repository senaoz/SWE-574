from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Annotated
from datetime import datetime
from enum import Enum
from bson import ObjectId


def validate_object_id(v):
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]


class ReportType(str, Enum):
    USER = "user"
    SERVICE = "service"


class ReportReason(str, Enum):
    INAPPROPRIATE = "inappropriate"
    ABUSIVE = "abusive"
    HARASSMENT = "harassment"
    SPAM = "spam"
    OTHER = "other"


class ReportStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReportCreate(BaseModel):
    report_type: ReportType
    reported_id: str
    reason: ReportReason
    description: Optional[str] = Field(None, max_length=500)


class ReportStatusUpdate(BaseModel):
    status: ReportStatus
    resolution_notes: Optional[str] = Field(None, max_length=500)


class ReportResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    report_type: ReportType
    reported_id: str
    reported_by: str
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reported_details: Optional[dict] = None
    reporter_details: Optional[dict] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ReportListResponse(BaseModel):
    reports: List[ReportResponse]
    total: int
    page: int
    limit: int
