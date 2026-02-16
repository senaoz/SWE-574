from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from ..models.comment import CommentCreate, CommentUpdate, CommentResponse, CommentListResponse
from ..models.user import UserResponse
from ..services.comment_service import CommentService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment_data: CommentCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new comment"""
    comment_service = CommentService(db)
    
    try:
        comment = await comment_service.create_comment(comment_data, str(current_user.id))
        return comment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/service/{service_id}", response_model=CommentListResponse)
async def get_service_comments(
    service_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_database)
):
    """Get comments for a specific service"""
    comment_service = CommentService(db)
    
    try:
        comments, total = await comment_service.get_comments_by_service(service_id, page, limit)
        return CommentListResponse(
            comments=comments,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: str,
    db=Depends(get_database)
):
    """Get comment by ID"""
    comment_service = CommentService(db)
    
    try:
        comment = await comment_service.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        return comment
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching comment: {str(e)}"
        )

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a comment (only by author)"""
    comment_service = CommentService(db)
    
    try:
        comment = await comment_service.update_comment(comment_id, comment_update, str(current_user.id))
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update comment"
            )
        return comment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a comment (only by author)"""
    comment_service = CommentService(db)
    
    try:
        success = await comment_service.delete_comment(comment_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete comment"
            )
        return {"message": "Comment deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/user/{user_id}", response_model=CommentListResponse)
async def get_user_comments(
    user_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_database)
):
    """Get comments by a specific user"""
    comment_service = CommentService(db)
    
    try:
        comments, total = await comment_service.get_user_comments(user_id, page, limit)
        return CommentListResponse(
            comments=comments,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
