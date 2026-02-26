from pydantic import BaseModel, Field, BeforeValidator, model_validator
from typing import Optional, List, Annotated, Union
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


def validate_max_participants(v):
    """Convert None to 3 for max_participants"""
    if v is None:
        return 3
    if isinstance(v, int) and v >= 1:
        return v
    return 3  # Default fallback


class TagEntity(BaseModel):
    """WikiData tag entity with label and entity ID"""
    label: str = Field(..., min_length=1, max_length=200)
    entityId: str = Field(default="", max_length=20)  # e.g., "Q1234", empty for manual tags
    description: Optional[str] = None
    aliases: Optional[List[str]] = None


def validate_tag(v):
    """Validator to handle both string tags (backward compatibility) and TagEntity objects"""
    if isinstance(v, str):
        # Legacy string format - convert to TagEntity with label only
        return {"label": v, "entityId": ""}
    elif isinstance(v, dict):
        # Already a dict/TagEntity
        if "label" in v:
            return v
        # If it's just a string in dict format, handle it
        return {"label": v.get("label", str(v)), "entityId": v.get("entityId", "")}
    return v


TagType = Annotated[Union[str, dict], BeforeValidator(validate_tag)]


class ServiceType(str, Enum):
    OFFER = "offer"
    NEED = "need"


class ServiceStatus(str, Enum):
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, dict):
            # Handle GeoJSON format
            if 'type' in v and 'coordinates' in v and v['type'] == 'Point':
                coords = v['coordinates']
                if len(coords) == 2:
                    return cls(
                        latitude=coords[1],  # latitude is second coordinate
                        longitude=coords[0],  # longitude is first coordinate
                        address=v.get('address')
                    )
            # Handle regular format
            elif 'latitude' in v and 'longitude' in v:
                return cls(**v)
        return v


class RecurringPattern(BaseModel):
    """Recurring pattern for scheduling"""
    days: List[str] = Field(default_factory=list)  # Days of week: ["Monday", "Tuesday", ...]
    time: str = Field(default="")  # Time in HH:MM format


class ServiceBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=10, max_length=5000)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    tags: List[dict] = Field(default_factory=list, max_items=10)  # List of TagEntity dicts
    estimated_duration: float = Field(..., gt=0, le=24)  # Hours
    location: Location
    is_remote: Optional[bool] = Field(default=False)  # Service can be done remotely
    deadline: Optional[datetime] = None
    service_type: ServiceType
    max_participants: Optional[int] = Field(default=1)
    # Scheduling fields
    scheduling_type: Optional[str] = Field(default="open")  # "specific", "recurring", or "open"
    specific_date: Optional[str] = None  # Date string in YYYY-MM-DD format
    specific_time: Optional[str] = None  # Time string in HH:MM format
    recurring_pattern: Optional[dict] = None  # RecurringPattern dict: {"days": [...], "time": "HH:MM"}
    open_availability: Optional[str] = None  # Free-form text description
    
    @model_validator(mode='before')
    @classmethod
    def validate_max_participants(cls, data):
        """Ensure max_participants is always a valid integer >= 1 and normalize tags"""
        if isinstance(data, dict):
            # Normalize max_participants
            if 'max_participants' not in data or data['max_participants'] is None:
                data['max_participants'] = 1
            elif isinstance(data['max_participants'], int) and data['max_participants'] < 1:
                data['max_participants'] = 1
            
            # Normalize tags: convert strings to dict format
            if 'tags' in data and isinstance(data['tags'], list):
                normalized_tags = []
                for tag in data['tags']:
                    if isinstance(tag, str):
                        # Legacy string format - convert to TagEntity dict
                        normalized_tags.append({"label": tag, "entityId": ""})
                    elif isinstance(tag, dict):
                        # Already in dict format, ensure it has required fields
                        if "label" in tag:
                            normalized_tags.append(tag)
                        else:
                            # Fallback: use string representation as label
                            normalized_tags.append({"label": str(tag.get("label", tag)), "entityId": tag.get("entityId", "")})
                    else:
                        # Fallback for other types
                        normalized_tags.append({"label": str(tag), "entityId": ""})
                data['tags'] = normalized_tags
        return data
    
    def get_tag_labels(self) -> List[str]:
        """Get list of tag labels for backward compatibility"""
        return [tag.get("label", "") if isinstance(tag, dict) else str(tag) for tag in self.tags]


class ServiceCreate(ServiceBase):
    pass

    class Config:
        json_encoders = {ObjectId: str}


class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    tags: Optional[List[dict]] = Field(None, max_items=10)  # List of TagEntity dicts
    estimated_duration: Optional[float] = Field(None, gt=0, le=24)
    location: Optional[Location] = None
    is_remote: Optional[bool] = None
    deadline: Optional[datetime] = None
    status: Optional[ServiceStatus] = None
    # Scheduling fields
    scheduling_type: Optional[str] = None  # "specific", "recurring", or "open"
    specific_date: Optional[str] = None  # Date string in YYYY-MM-DD format
    specific_time: Optional[str] = None  # Time string in HH:MM format
    recurring_pattern: Optional[dict] = None  # RecurringPattern dict: {"days": [...], "time": "HH:MM"}
    open_availability: Optional[str] = None  # Free-form text description

    class Config:
        json_encoders = {ObjectId: str}


class ServiceResponse(ServiceBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    status: ServiceStatus = ServiceStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    matched_user_ids: List[PyObjectId] = Field(default_factory=list)
    provider_confirmed: Optional[bool] = False
    receiver_confirmed_ids: Optional[List[PyObjectId]] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ServiceListResponse(BaseModel):
    services: List[ServiceResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_encoders = {ObjectId: str}


class ServiceFilters(BaseModel):
    service_type: Optional[ServiceType] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[ServiceStatus] = None
    min_duration: Optional[float] = None
    max_duration: Optional[float] = None
    location: Optional[Location] = None
    radius: Optional[float] = None  # Kilometers
    user_id: Optional[PyObjectId] = None
    is_remote: Optional[bool] = None  # Filter by remote-only services

    class Config:
        json_encoders = {ObjectId: str}
