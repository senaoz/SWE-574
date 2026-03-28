import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse

from ..models.notification import NotificationListResponse, NotificationResponse, UnreadCountResponse
from ..models.user import UserResponse
from ..services.notification_service import NotificationService, sse_subscribe, sse_unsubscribe
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/stream")
async def notification_stream(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """SSE stream — pushes unread count whenever it changes."""
    service = NotificationService(db)
    user_id = str(current_user.id)

    async def event_generator():
        # Send current count immediately on connect
        count = await service.get_unread_count(user_id)
        yield f"data: {count}\n\n"

        q = sse_subscribe(user_id)
        try:
            while True:
                try:
                    count = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield f"data: {count}\n\n"
                except asyncio.TimeoutError:
                    # Heartbeat keeps the connection alive through proxies
                    yield ": heartbeat\n\n"
        finally:
            sse_unsubscribe(user_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx response buffering
        },
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get unread notification count for current user."""
    service = NotificationService(db)
    count = await service.get_unread_count(str(current_user.id))
    return UnreadCountResponse(count=count)


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get paginated notifications for current user."""
    service = NotificationService(db)
    notifications, total, unread_count = await service.get_notifications(
        str(current_user.id), page, limit
    )
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        page=page,
        limit=limit,
        unread_count=unread_count,
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Mark a single notification as read."""
    service = NotificationService(db)
    success = await service.mark_as_read(notification_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notifications, _, _ = await service.get_notifications(str(current_user.id), 1, 50)
    for n in notifications:
        if n.id == notification_id:
            return n

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")


@router.put("/read-all")
async def mark_all_as_read(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Mark all notifications as read."""
    service = NotificationService(db)
    count = await service.mark_all_as_read(str(current_user.id))
    return {"marked_read": count}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Delete a notification."""
    service = NotificationService(db)
    success = await service.delete_notification(notification_id, str(current_user.id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"deleted": True}
