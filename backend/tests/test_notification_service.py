import asyncio
import pytest
from bson import ObjectId
from datetime import datetime

from app.models.notification import NotificationType, NotificationRelatedType
from app.services.notification_service import (
    NotificationService,
    sse_subscribe,
    sse_unsubscribe,
    sse_push_count,
    _subscribers,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _seed_notification(mock_db, user_id: str, *, is_read: bool = False) -> str:
    """Insert a raw notification document and return its string id."""
    doc = {
        "user_id": ObjectId(user_id),
        "type": NotificationType.JOIN_REQUEST_RECEIVED,
        "title": "Test title",
        "body": "Test body",
        "related_id": str(ObjectId()),
        "related_type": NotificationRelatedType.SERVICE,
        "is_read": is_read,
        "created_at": datetime.utcnow(),
    }
    result = await mock_db.notifications.insert_one(doc)
    return str(result.inserted_id)


# ---------------------------------------------------------------------------
# create_notification
# ---------------------------------------------------------------------------

class TestCreateNotification:
    @pytest.mark.asyncio
    async def test_creates_document(self, mock_db):
        user_id = str(ObjectId())
        svc = NotificationService(mock_db)
        await svc.create_notification(
            user_id=user_id,
            notification_type=NotificationType.JOIN_REQUEST_RECEIVED,
            title="New application",
            body="Someone applied",
            related_id=str(ObjectId()),
            related_type=NotificationRelatedType.SERVICE,
        )
        count = await mock_db.notifications.count_documents({"user_id": ObjectId(user_id)})
        assert count == 1

    @pytest.mark.asyncio
    async def test_document_is_unread_by_default(self, mock_db):
        user_id = str(ObjectId())
        svc = NotificationService(mock_db)
        await svc.create_notification(
            user_id=user_id,
            notification_type=NotificationType.JOIN_REQUEST_APPROVED,
            title="Approved",
            body="Your application was approved",
            related_id=str(ObjectId()),
            related_type=NotificationRelatedType.SERVICE,
        )
        doc = await mock_db.notifications.find_one({"user_id": ObjectId(user_id)})
        assert doc["is_read"] is False

    @pytest.mark.asyncio
    async def test_pushes_count_to_sse_subscriber(self, mock_db):
        user_id = str(ObjectId())
        q = sse_subscribe(user_id)
        try:
            svc = NotificationService(mock_db)
            await svc.create_notification(
                user_id=user_id,
                notification_type=NotificationType.TRANSACTION_COMPLETED,
                title="Done",
                body="Hours transferred",
                related_id=str(ObjectId()),
                related_type=NotificationRelatedType.TRANSACTION,
            )
            # Queue should have received the updated count (1)
            count = await asyncio.wait_for(q.get(), timeout=1.0)
            assert count == 1
        finally:
            sse_unsubscribe(user_id, q)

    @pytest.mark.asyncio
    async def test_does_not_raise_on_invalid_user_id(self, mock_db):
        """Errors are swallowed — callers should never be blocked."""
        svc = NotificationService(mock_db)
        # Should not raise even with a bad id
        await svc.create_notification(
            user_id="not-an-object-id",
            notification_type=NotificationType.SERVICE_COMPLETED,
            title="x",
            body="x",
            related_id="x",
            related_type=NotificationRelatedType.SERVICE,
        )


# ---------------------------------------------------------------------------
# get_unread_count
# ---------------------------------------------------------------------------

class TestGetUnreadCount:
    @pytest.mark.asyncio
    async def test_returns_zero_when_no_notifications(self, mock_db):
        svc = NotificationService(mock_db)
        assert await svc.get_unread_count(str(ObjectId())) == 0

    @pytest.mark.asyncio
    async def test_counts_only_unread(self, mock_db):
        user_id = str(ObjectId())
        await _seed_notification(mock_db, user_id, is_read=False)
        await _seed_notification(mock_db, user_id, is_read=False)
        await _seed_notification(mock_db, user_id, is_read=True)

        svc = NotificationService(mock_db)
        assert await svc.get_unread_count(user_id) == 2

    @pytest.mark.asyncio
    async def test_does_not_count_other_users(self, mock_db):
        user_a = str(ObjectId())
        user_b = str(ObjectId())
        await _seed_notification(mock_db, user_a, is_read=False)
        await _seed_notification(mock_db, user_b, is_read=False)

        svc = NotificationService(mock_db)
        assert await svc.get_unread_count(user_a) == 1


# ---------------------------------------------------------------------------
# get_notifications
# ---------------------------------------------------------------------------

class TestGetNotifications:
    @pytest.mark.asyncio
    async def test_returns_empty_list_for_new_user(self, mock_db):
        svc = NotificationService(mock_db)
        notifications, total, unread = await svc.get_notifications(str(ObjectId()))
        assert notifications == []
        assert total == 0
        assert unread == 0

    @pytest.mark.asyncio
    async def test_returns_all_notifications_for_user(self, mock_db):
        user_id = str(ObjectId())
        await _seed_notification(mock_db, user_id, is_read=False)
        await _seed_notification(mock_db, user_id, is_read=True)

        svc = NotificationService(mock_db)
        notifications, total, unread = await svc.get_notifications(user_id)
        assert total == 2
        assert unread == 1
        assert len(notifications) == 2

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        for _ in range(5):
            await _seed_notification(mock_db, user_id)

        svc = NotificationService(mock_db)
        notifications, total, _ = await svc.get_notifications(user_id, page=1, limit=3)
        assert total == 5
        assert len(notifications) == 3

    @pytest.mark.asyncio
    async def test_isolates_users(self, mock_db):
        user_a = str(ObjectId())
        user_b = str(ObjectId())
        await _seed_notification(mock_db, user_a)
        await _seed_notification(mock_db, user_b)

        svc = NotificationService(mock_db)
        notifications, total, _ = await svc.get_notifications(user_a)
        assert total == 1


# ---------------------------------------------------------------------------
# mark_as_read
# ---------------------------------------------------------------------------

class TestMarkAsRead:
    @pytest.mark.asyncio
    async def test_marks_single_notification_read(self, mock_db):
        user_id = str(ObjectId())
        notif_id = await _seed_notification(mock_db, user_id, is_read=False)

        svc = NotificationService(mock_db)
        result = await svc.mark_as_read(notif_id, user_id)
        assert result is True
        assert await svc.get_unread_count(user_id) == 0

    @pytest.mark.asyncio
    async def test_returns_false_for_wrong_user(self, mock_db):
        owner_id = str(ObjectId())
        other_id = str(ObjectId())
        notif_id = await _seed_notification(mock_db, owner_id, is_read=False)

        svc = NotificationService(mock_db)
        result = await svc.mark_as_read(notif_id, other_id)
        assert result is False
        # Still unread for the actual owner
        assert await svc.get_unread_count(owner_id) == 1

    @pytest.mark.asyncio
    async def test_pushes_updated_count_to_sse(self, mock_db):
        user_id = str(ObjectId())
        await _seed_notification(mock_db, user_id, is_read=False)
        notif_id = await _seed_notification(mock_db, user_id, is_read=False)

        q = sse_subscribe(user_id)
        try:
            svc = NotificationService(mock_db)
            await svc.mark_as_read(notif_id, user_id)
            pushed = await asyncio.wait_for(q.get(), timeout=1.0)
            assert pushed == 1  # one remaining unread
        finally:
            sse_unsubscribe(user_id, q)


# ---------------------------------------------------------------------------
# mark_all_as_read
# ---------------------------------------------------------------------------

class TestMarkAllAsRead:
    @pytest.mark.asyncio
    async def test_clears_all_unread(self, mock_db):
        user_id = str(ObjectId())
        for _ in range(3):
            await _seed_notification(mock_db, user_id, is_read=False)

        svc = NotificationService(mock_db)
        modified = await svc.mark_all_as_read(user_id)
        assert modified == 3
        assert await svc.get_unread_count(user_id) == 0

    @pytest.mark.asyncio
    async def test_returns_zero_when_nothing_to_mark(self, mock_db):
        user_id = str(ObjectId())
        svc = NotificationService(mock_db)
        assert await svc.mark_all_as_read(user_id) == 0

    @pytest.mark.asyncio
    async def test_does_not_affect_other_users(self, mock_db):
        user_a = str(ObjectId())
        user_b = str(ObjectId())
        await _seed_notification(mock_db, user_a, is_read=False)
        await _seed_notification(mock_db, user_b, is_read=False)

        svc = NotificationService(mock_db)
        await svc.mark_all_as_read(user_a)
        assert await svc.get_unread_count(user_b) == 1

    @pytest.mark.asyncio
    async def test_pushes_zero_to_sse(self, mock_db):
        user_id = str(ObjectId())
        await _seed_notification(mock_db, user_id, is_read=False)

        q = sse_subscribe(user_id)
        try:
            svc = NotificationService(mock_db)
            await svc.mark_all_as_read(user_id)
            pushed = await asyncio.wait_for(q.get(), timeout=1.0)
            assert pushed == 0
        finally:
            sse_unsubscribe(user_id, q)


# ---------------------------------------------------------------------------
# delete_notification
# ---------------------------------------------------------------------------

class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_deletes_own_notification(self, mock_db):
        user_id = str(ObjectId())
        notif_id = await _seed_notification(mock_db, user_id)

        svc = NotificationService(mock_db)
        result = await svc.delete_notification(notif_id, user_id)
        assert result is True
        _, total, _ = await svc.get_notifications(user_id)
        assert total == 0

    @pytest.mark.asyncio
    async def test_cannot_delete_other_users_notification(self, mock_db):
        owner_id = str(ObjectId())
        other_id = str(ObjectId())
        notif_id = await _seed_notification(mock_db, owner_id)

        svc = NotificationService(mock_db)
        result = await svc.delete_notification(notif_id, other_id)
        assert result is False


# ---------------------------------------------------------------------------
# SSE subscriber registry
# ---------------------------------------------------------------------------

class TestSSESubscriberRegistry:
    @pytest.mark.asyncio
    async def test_subscribe_and_receive(self):
        user_id = str(ObjectId())
        q = sse_subscribe(user_id)
        try:
            await sse_push_count(user_id, 5)
            value = await asyncio.wait_for(q.get(), timeout=1.0)
            assert value == 5
        finally:
            sse_unsubscribe(user_id, q)

    @pytest.mark.asyncio
    async def test_unsubscribe_removes_queue(self):
        user_id = str(ObjectId())
        q = sse_subscribe(user_id)
        sse_unsubscribe(user_id, q)
        # After unsubscribe, push should not deliver to the old queue
        await sse_push_count(user_id, 99)
        assert q.empty()

    @pytest.mark.asyncio
    async def test_multiple_subscribers_all_receive(self):
        user_id = str(ObjectId())
        q1 = sse_subscribe(user_id)
        q2 = sse_subscribe(user_id)
        try:
            await sse_push_count(user_id, 3)
            v1 = await asyncio.wait_for(q1.get(), timeout=1.0)
            v2 = await asyncio.wait_for(q2.get(), timeout=1.0)
            assert v1 == 3
            assert v2 == 3
        finally:
            sse_unsubscribe(user_id, q1)
            sse_unsubscribe(user_id, q2)

    @pytest.mark.asyncio
    async def test_push_to_unknown_user_does_not_raise(self):
        await sse_push_count(str(ObjectId()), 42)  # no subscribers, should not raise
