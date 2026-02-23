from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status
from typing import Optional, List
from bson import ObjectId

from ..models.service import (
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListResponse, 
    ServiceFilters, ServiceStatus
)
from ..models.user import UserResponse
from ..services.service_service import ServiceService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/", response_model=ServiceListResponse)
async def get_services(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service_type: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[str] = None,
    service_status: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None,
    user_id: Optional[str] = None,
    is_remote: Optional[bool] = None,
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
        services, total = await service_service.get_services(filters, page, limit)
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

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
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
        service = await service_service.get_service_by_id(service_id)
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
    """Update service (only by owner)"""
    service_service = ServiceService(db)
    
    try:
        # Check if service exists and user owns it
        existing_service = await service_service.get_service_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        if str(existing_service.user_id) != str(current_user.id):
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
    
    try:
        # Check if service exists and user owns it
        existing_service = await service_service.get_service_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        if str(existing_service.user_id) != str(current_user.id):
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

@router.post("/{service_id}/confirm-completion", response_model=ServiceResponse)
async def confirm_service_completion(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Confirm service completion (requires both provider and receiver to confirm)"""
    service_service = ServiceService(db)
    
    try:
        updated_service = await service_service.confirm_service_completion(service_id, str(current_user.id))
        return updated_service
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error confirming service completion: {str(e)}"
        )

@router.post("/{service_id}/complete")
async def complete_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Complete a service exchange and update TimeBank (deprecated - use confirm-completion instead)"""
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
