from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from ..models.forum import (
    ForumDiscussionCreate, ForumDiscussionUpdate,
    ForumDiscussionResponse, ForumDiscussionListResponse,
    ForumEventCreate, ForumEventUpdate,
    ForumEventResponse, ForumEventListResponse,
    ForumCommentCreate, ForumCommentUpdate,
    ForumCommentResponse, ForumCommentListResponse,
)
from ..models.user import UserResponse
from ..services.forum_service import ForumService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/forum", tags=["forum"])


def _forum(db) -> ForumService:
    return ForumService(db)


# ===================== Discussions =====================

@router.get("/discussions", response_model=ForumDiscussionListResponse)
async def list_discussions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tag: Optional[str] = None,
    q: Optional[str] = None,
    db=Depends(get_database),
):
    svc = _forum(db)
    discussions, total = await svc.get_discussions(page, limit, tag, q)
    return ForumDiscussionListResponse(discussions=discussions, total=total, page=page, limit=limit)


@router.post("/discussions", response_model=ForumDiscussionResponse, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    data: ForumDiscussionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        return await svc.create_discussion(data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/discussions/{discussion_id}", response_model=ForumDiscussionResponse)
async def get_discussion(discussion_id: str, db=Depends(get_database)):
    svc = _forum(db)
    discussion = await svc.get_discussion_by_id(discussion_id)
    if not discussion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion not found")
    return discussion


@router.put("/discussions/{discussion_id}", response_model=ForumDiscussionResponse)
async def update_discussion(
    discussion_id: str,
    data: ForumDiscussionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        result = await svc.update_discussion(discussion_id, data, str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/discussions/{discussion_id}")
async def delete_discussion(
    discussion_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        await svc.delete_discussion(discussion_id, str(current_user.id))
        return {"message": "Discussion deleted"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ===================== Events =====================

@router.get("/events", response_model=ForumEventListResponse)
async def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
    tag: Optional[str] = None,
    q: Optional[str] = None,
    has_location: Optional[bool] = None,
    db=Depends(get_database),
):
    svc = _forum(db)
    events, total = await svc.get_events(page, limit, tag, q, has_location=bool(has_location))
    return ForumEventListResponse(events=events, total=total, page=page, limit=limit)


@router.post("/events", response_model=ForumEventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: ForumEventCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        return await svc.create_event(data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/events/{event_id}", response_model=ForumEventResponse)
async def get_event(event_id: str, db=Depends(get_database)):
    svc = _forum(db)
    event = await svc.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.put("/events/{event_id}", response_model=ForumEventResponse)
async def update_event(
    event_id: str,
    data: ForumEventUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        result = await svc.update_event(event_id, data, str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        await svc.delete_event(event_id, str(current_user.id))
        return {"message": "Event deleted"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ===================== Comments =====================

@router.get("/comments", response_model=ForumCommentListResponse)
async def list_comments(
    target_type: str = Query(..., regex="^(discussion|event)$"),
    target_id: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db=Depends(get_database),
):
    svc = _forum(db)
    comments, total = await svc.get_comments(target_type, target_id, page, limit)
    return ForumCommentListResponse(comments=comments, total=total, page=page, limit=limit)


@router.post("/comments", response_model=ForumCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    data: ForumCommentCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        return await svc.create_comment(data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/comments/{comment_id}", response_model=ForumCommentResponse)
async def update_comment(
    comment_id: str,
    data: ForumCommentUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        result = await svc.update_comment(comment_id, data, str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _forum(db)
    try:
        await svc.delete_comment(comment_id, str(current_user.id))
        return {"message": "Comment deleted"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ===================== Linked Events (for ServiceDetail) =====================

@router.get("/services/{service_id}/linked-events", response_model=ForumEventListResponse)
async def get_linked_events(service_id: str, db=Depends(get_database)):
    svc = _forum(db)
    events = await svc.get_events_for_service(service_id)
    return ForumEventListResponse(events=events, total=len(events), page=1, limit=len(events) or 1)
