from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from ..models.join_request import JoinRequestCreate, JoinRequestUpdate, JoinRequestResponse, JoinRequestListResponse
from ..models.user import UserResponse
from ..services.join_request_service import JoinRequestService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/join-requests", tags=["join-requests"])

@router.post("/", response_model=JoinRequestResponse)
async def create_join_request(
    request_data: JoinRequestCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new join request for a service"""
    join_request_service = JoinRequestService(db)
    
    try:
        request = await join_request_service.create_join_request(request_data, str(current_user.id))
        return request
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/service/{service_id}/pending", response_model=JoinRequestResponse)
async def get_pending_request_for_service(
    service_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get pending join request for a service by current user"""
    join_request_service = JoinRequestService(db)
    
    try:
        request = await join_request_service.get_pending_request_for_service(service_id, str(current_user.id))
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending request found for this service"
            )
        return request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching pending request: {str(e)}"
        )

@router.get("/service/{service_id}", response_model=JoinRequestListResponse)
async def get_service_requests(
    service_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get join requests for a specific service (only service owner can see)"""
    join_request_service = JoinRequestService(db)
    
    try:
        requests, total = await join_request_service.get_requests_by_service(service_id, page, limit)
        return JoinRequestListResponse(
            requests=requests,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my-requests", response_model=JoinRequestListResponse)
async def get_my_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected, cancelled"),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get join requests made by current user"""
    join_request_service = JoinRequestService(db)
    
    try:
        requests, total = await join_request_service.get_user_requests(str(current_user.id), page, limit, status)
        return JoinRequestListResponse(
            requests=requests,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{request_id}", response_model=JoinRequestResponse)
async def update_request_status(
    request_id: str,
    update_data: JoinRequestUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update join request status (approve/reject) - only service owner"""
    join_request_service = JoinRequestService(db)
    
    try:
        request = await join_request_service.update_request_status(request_id, update_data, str(current_user.id))
        return request
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{request_id}", response_model=JoinRequestResponse)
async def get_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get join request by ID"""
    join_request_service = JoinRequestService(db)
    
    try:
        request = await join_request_service.get_request_by_id(request_id)
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Join request not found"
            )
        return request
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching join request: {str(e)}"
        )

@router.post("/{request_id}/cancel", response_model=JoinRequestResponse)
async def cancel_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Cancel a join request (only by the user who created it)"""
    join_request_service = JoinRequestService(db)
    
    try:
        request = await join_request_service.cancel_user_request(request_id, str(current_user.id))
        return request
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
