import asyncio
from collections import defaultdict
from typing import List, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.notification import NotificationResponse, NotificationType, NotificationRelatedType

# ---------------------------------------------------------------------------
# In-memory SSE subscriber registry
# user_id (str) → set of asyncio.Queue instances (one per open SSE connection)
# ---------------------------------------------------------------------------
_subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)


def sse_subscribe(user_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _subscribers[user_id].add(q)
    return q


def sse_unsubscribe(user_id: str, q: asyncio.Queue) -> None:
    _subscribers[user_id].discard(q)


async def sse_push_count(user_id: str, count: int) -> None:
    """Push a new unread count to all open SSE connections for this user."""
    for q in list(_subscribers.get(user_id, set())):
        try:
            await q.put(count)
        except Exception:
            pass


class NotificationService:
    def __init__(self, db):
        self.db = db
        self.notifications_collection = db.notifications

    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        body: str,
        related_id: str,
        related_type: NotificationRelatedType,
    ) -> None:
        """Insert a notification record and push updated count via SSE."""
        try:
            doc = {
                "user_id": ObjectId(user_id),
                "type": notification_type,
                "title": title,
                "body": body,
                "related_id": related_id,
                "related_type": related_type,
                "is_read": False,
                "created_at": datetime.utcnow(),
            }
            await self.notifications_collection.insert_one(doc)
            count = await self.get_unread_count(user_id)
            await sse_push_count(user_id, count)
        except Exception as e:
            print(f"Warning: Failed to create notification: {e}")

    async def get_notifications(
        self, user_id: str, page: int = 1, limit: int = 20
    ) -> Tuple[List[NotificationResponse], int, int]:
        """Return paginated notifications for user, newest first."""
        query = {"user_id": ObjectId(user_id)}
        total = await self.notifications_collection.count_documents(query)
        unread_count = await self.notifications_collection.count_documents(
            {**query, "is_read": False}
        )

        skip = (page - 1) * limit
        cursor = (
            self.notifications_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        notifications = []
        async for doc in cursor:
            notifications.append(NotificationResponse(**doc))

        return notifications, total, unread_count

    async def get_unread_count(self, user_id: str) -> int:
        return await self.notifications_collection.count_documents(
            {"user_id": ObjectId(user_id), "is_read": False}
        )

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        result = await self.notifications_collection.update_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)},
            {"$set": {"is_read": True}},
        )
        if result.modified_count > 0:
            count = await self.get_unread_count(user_id)
            await sse_push_count(user_id, count)
        return result.modified_count > 0

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.notifications_collection.update_many(
            {"user_id": ObjectId(user_id), "is_read": False},
            {"$set": {"is_read": True}},
        )
        if result.modified_count > 0:
            await sse_push_count(user_id, 0)
        return result.modified_count

    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        result = await self.notifications_collection.delete_one(
            {"_id": ObjectId(notification_id), "user_id": ObjectId(user_id)}
        )
        if result.deleted_count > 0:
            count = await self.get_unread_count(user_id)
            await sse_push_count(user_id, count)
        return result.deleted_count > 0
