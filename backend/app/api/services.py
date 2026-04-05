from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from ..models.service import (
    PotentialMatchListResponse,
    RecommendedServiceListResponse,
    ServiceCreate,
    ServiceFilters,
    ServiceListResponse,
    ServiceResponse,
    ServiceStatus,
    ServiceUpdate,
)
from ..models.user import UserResponse
from ..services.service_service import ServiceService
from ..services.user_service import UserService
from ..api.auth import get_current_user, get_optional_current_user
from ..core.database import get_database

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/", response_model=ServiceListResponse)
async def get_services(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    q: Optional[str] = None,
    service_type: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,
    service_status: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None,
    user_id: Optional[str] = None,
    is_remote: Optional[bool] = None,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database)
):
    """Get services with optional filters"""
    service_service = ServiceService(db)
    
    # Parse tags if provided
    tag_list = tags.split(",") if tags else None
    
    # Handle user_id parameter
    user_id_obj = None
    if user_id:
        if ObjectId.is_valid(user_id):
            user_id_obj = ObjectId(user_id)
    
    # Create filters
    filters = ServiceFilters(
        q=q,
        service_type=service_type,
        category=category,
        tags=tag_list,
        status=service_status,
        location={"latitude": latitude, "longitude": longitude} if latitude and longitude else None,
        radius=radius,
        user_id=user_id_obj,
        is_remote=is_remote
    )
    
    try:
        services, total = await service_service.get_services(
            filters,
            page,
            limit,
            current_user_id=str(current_user.id) if current_user else None,
        )
        return ServiceListResponse(
            services=services,
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching services: {str(e)}"
        )

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_data: ServiceCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new service"""
    service_service = ServiceService(db)
    
    try:
        service = await service_service.create_service(service_data, str(current_user.id))
        return service
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/saved", response_model=ServiceListResponse)
async def get_saved_services(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get all services saved by the current user"""
    try:
        cursor = db.saved_services.find(
            {"user_id": str(current_user.id)}
        ).sort("created_at", -1).skip((page - 1) * limit).limit(limit)

        saved_docs = await cursor.to_list(length=limit)
        total = await db.saved_services.count_documents({"user_id": str(current_user.id)})

        service_service = ServiceService(db)
        services = []
        for doc in saved_docs:
            try:
                svc = await service_service.get_service_by_id(
                    doc["service_id"],
                    str(current_user.id),
                )
                if svc:
                    services.append(svc)
            except Exception:
                pass

        return ServiceListResponse(
            services=services,
            total=total,
            page=page,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching saved services: {str(e)}"
        )


@router.get("/saved/ids")
async def get_saved_service_ids(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get list of service IDs saved by the current user (lightweight check)"""
    cursor = db.saved_services.find(
        {"user_id": str(current_user.id)},
        {"service_id": 1, "_id": 0}
    )
    docs = await cursor.to_list(length=500)
    return {"service_ids": [doc["service_id"] for doc in docs]}


@router.get("/recommendations", response_model=RecommendedServiceListResponse)
async def get_recommended_services(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = None,
    service_type: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,
    service_status: Optional[str] = Query(ServiceStatus.ACTIVE, alias="status"),
    city: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = Query(None, ge=0),
    is_remote: Optional[bool] = None,
    date_filter: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get personalized service recommendations for the current user."""
    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude must be provided together",
        )
    if radius is not None and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latitude and longitude are required when radius is provided",
        )

    service_service = ServiceService(db)
    tag_list = tags.split(",") if tags else None
    normalized_service_type = None if service_type in (None, "", "all") else service_type
    normalized_status = None if service_status in (None, "", "all") else service_status
    normalized_date_filter = None if date_filter in (None, "", "all") else date_filter

    filters = ServiceFilters(
        q=q,
        service_type=normalized_service_type,
        category=category,
        tags=tag_list,
        status=normalized_status,
        location={
            "latitude": latitude,
            "longitude": longitude,
            "address": city,
        }
        if latitude is not None and longitude is not None
        else None,
        radius=radius,
        is_remote=is_remote,
    )

    try:
        (
            items,
            total,
            recommendation_mode,
            show_profile_prompt,
        ) = await service_service.get_recommended_services(
            user_id=str(current_user.id),
            filters=filters,
            page=page,
            limit=limit,
            city=city,
            date_filter=normalized_date_filter,
            viewer_latitude=latitude,
            viewer_longitude=longitude,
        )
        return RecommendedServiceListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            recommendation_mode=recommendation_mode,
            show_profile_prompt=show_profile_prompt,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching recommendations: {str(e)}",
        )


@router.get("/{service_id}/potential-matches", response_model=PotentialMatchListResponse)
async def get_potential_matches(
    service_id: str,
    limit: int = Query(6, ge=1, le=12),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database)
):
    """Get matching services for the current post, preferring opposite-type results first."""
    if not ObjectId.is_valid(service_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    service_service = ServiceService(db)

    try:
        current_service = await service_service.get_service_by_id(service_id)
        if not current_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )

        items, total = await service_service.get_potential_matches(
            service_id=service_id,
            current_user_id=str(current_user.id) if current_user else None,
            limit=limit,
        )
        return PotentialMatchListResponse(items=items, total=total)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching potential matches: {str(e)}"
        )


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database)
):
    """Get service by ID"""
    service_service = ServiceService(db)
    
    # Validate ObjectId format
    if not ObjectId.is_valid(service_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    try:
        service = await service_service.get_service_by_id(
            service_id,
            str(current_user.id) if current_user else None,
        )
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        return service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching service: {str(e)}"
        )

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_update: ServiceUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update service (by owner or admin)"""
    service_service = ServiceService(db)
    user_service = UserService(db)

    try:
        # Check if service exists
        existing_service = await service_service.get_service_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Check authorization: owner or admin
        is_owner = str(existing_service.user_id) == str(current_user.id)
        is_admin = await user_service.is_admin(str(current_user.id))

        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this service"
            )
        
        updated_service = await service_service.update_service(service_id, service_update, str(current_user.id))
        if not updated_service:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update service"
            )
        
        return updated_service
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating service: {str(e)}"
        )

@router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete service (only by owner)"""
    service_service = ServiceService(db)
    user_service = UserService(db)
    
    try:
        # Check if service exists and user owns it
        existing_service = await service_service.get_service_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )

        # Check if user is admin or owner
        is_owner = str(existing_service.user_id) == str(current_user.id)
        is_admin = await user_service.is_admin(str(current_user.id))
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this service"
            )
        
        if existing_service.status != ServiceStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service is not active, cannot be deleted"
            )
        
        success = await service_service.delete_service(service_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete service"
            )
        
        return {"message": "Service deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting service: {str(e)}"
        )

@router.post("/{service_id}/save")
async def save_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Save a service for future reference"""
    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    service_service = ServiceService(db)
    svc = await service_service.get_service_by_id(service_id)
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    existing = await db.saved_services.find_one({
        "user_id": str(current_user.id),
        "service_id": service_id
    })
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service already saved")

    await db.saved_services.insert_one({
        "user_id": str(current_user.id),
        "service_id": service_id,
        "created_at": datetime.now(timezone.utc),
    })
    return {"message": "Service saved successfully"}


@router.delete("/{service_id}/save")
async def unsave_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Remove a service from saved items"""
    result = await db.saved_services.delete_one({
        "user_id": str(current_user.id),
        "service_id": service_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved service not found")
    return {"message": "Service unsaved successfully"}


@router.post("/{service_id}/match")
async def match_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Match with a service (initiate service exchange)"""
    service_service = ServiceService(db)
    
    try:
        success = await service_service.match_service(service_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to match with service"
            )
        
        return {"message": "Service matched successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error matching service: {str(e)}"
        )

@router.post("/{service_id}/complete")
async def complete_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Mark service as completed (owner only). Updates status and linked transactions."""
    service_service = ServiceService(db)
    
    try:
        success = await service_service.complete_service(service_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to complete service"
            )
        
        return {"message": "Service completed successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error completing service: {str(e)}"
        )

@router.post("/{service_id}/cancel")
async def cancel_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Cancel a service (only by owner or matched user)"""
    service_service = ServiceService(db)
    
    # Validate ObjectId format
    if not ObjectId.is_valid(service_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    try:
        success = await service_service.cancel_service(service_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to cancel service"
            )
        
        return {"message": "Service cancelled successfully"}
    except ValueError as e:
        error_message = str(e)
        # Map specific ValueError messages to appropriate HTTP status codes
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message
            )
        elif "not authorized" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_message
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error cancelling service: {str(e)}"
        )

@router.get("/{service_id}/participants")
async def get_service_participants(
    service_id: str,
    db=Depends(get_database)
):
    """Get service participants (provider and matched user)"""
    service_service = ServiceService(db)
    
    try:
        participants = await service_service.get_service_participants(service_id)
        return {"participants": participants}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching participants: {str(e)}"
        )

@router.post("/check-expired")
async def check_expired_services(
    db=Depends(get_database)
):
    """Check and handle expired services (can be called by cron job)"""
    service_service = ServiceService(db)
    
    try:
        rejected_count = await service_service.check_and_handle_expired_services()
        return {
            "message": f"Checked expired services. Rejected {rejected_count} pending requests."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking expired services: {str(e)}"
        )
