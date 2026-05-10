import pytest
from bson import ObjectId
from datetime import datetime
from fastapi import status

from app.core.security import create_access_token
from app.models.notification import NotificationType, NotificationRelatedType


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _seed_notification(mock_db, user_id: str, *, is_read: bool = False) -> str:
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


def _auth(user_id: str) -> dict:
    token = create_access_token(data={"sub": user_id})
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# GET /notifications/unread-count
# ---------------------------------------------------------------------------

class TestUnreadCount:
    def test_returns_zero_for_new_user(self, test_client, test_user):
        response = test_client.get(
            "/notifications/unread-count",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] == 0

    @pytest.mark.asyncio
    async def test_reflects_unread_notifications(self, test_client, test_user, mock_db):
        await _seed_notification(mock_db, str(test_user.id), is_read=False)
        await _seed_notification(mock_db, str(test_user.id), is_read=False)
        await _seed_notification(mock_db, str(test_user.id), is_read=True)

        response = test_client.get(
            "/notifications/unread-count",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["count"] == 2

    def test_requires_authentication(self, test_client):
        response = test_client.get("/notifications/unread-count")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# GET /notifications/
# ---------------------------------------------------------------------------

class TestGetNotifications:
    def test_returns_empty_list_for_new_user(self, test_client, test_user):
        response = test_client.get(
            "/notifications/",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["notifications"] == []
        assert data["total"] == 0
        assert data["unread_count"] == 0

    @pytest.mark.asyncio
    async def test_returns_own_notifications_only(self, test_client, test_user, second_user, mock_db):
        await _seed_notification(mock_db, str(test_user.id))
        await _seed_notification(mock_db, str(second_user.id))

        response = test_client.get(
            "/notifications/",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_pagination(self, test_client, test_user, mock_db):
        for _ in range(5):
            await _seed_notification(mock_db, str(test_user.id))

        response = test_client.get(
            "/notifications/?page=1&limit=3",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 5
        assert len(data["notifications"]) == 3

    @pytest.mark.asyncio
    async def test_notification_shape(self, test_client, test_user, mock_db):
        await _seed_notification(mock_db, str(test_user.id), is_read=False)

        response = test_client.get(
            "/notifications/",
            headers=_auth(str(test_user.id)),
        )
        notif = response.json()["notifications"][0]
        assert "title" in notif
        assert "body" in notif
        assert "is_read" in notif
        assert "type" in notif
        assert "created_at" in notif

    def test_requires_authentication(self, test_client):
        response = test_client.get("/notifications/")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# PUT /notifications/{id}/read
# ---------------------------------------------------------------------------

class TestMarkAsRead:
    @pytest.mark.asyncio
    async def test_marks_notification_read(self, test_client, test_user, mock_db):
        notif_id = await _seed_notification(mock_db, str(test_user.id), is_read=False)

        response = test_client.put(
            f"/notifications/{notif_id}/read",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK

        # Unread count should now be 0
        count_resp = test_client.get(
            "/notifications/unread-count",
            headers=_auth(str(test_user.id)),
        )
        assert count_resp.json()["count"] == 0

    @pytest.mark.asyncio
    async def test_returns_404_for_nonexistent(self, test_client, test_user, mock_db):
        response = test_client.put(
            f"/notifications/{str(ObjectId())}/read",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_cannot_mark_other_users_notification(self, test_client, test_user, second_user, mock_db):
        notif_id = await _seed_notification(mock_db, str(second_user.id), is_read=False)

        response = test_client.put(
            f"/notifications/{notif_id}/read",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_authentication(self, test_client):
        response = test_client.put(f"/notifications/{str(ObjectId())}/read")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# PUT /notifications/read-all
# ---------------------------------------------------------------------------

class TestMarkAllAsRead:
    @pytest.mark.asyncio
    async def test_clears_all_unread(self, test_client, test_user, mock_db):
        for _ in range(3):
            await _seed_notification(mock_db, str(test_user.id), is_read=False)

        response = test_client.put(
            "/notifications/read-all",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["marked_read"] == 3

        count_resp = test_client.get(
            "/notifications/unread-count",
            headers=_auth(str(test_user.id)),
        )
        assert count_resp.json()["count"] == 0

    @pytest.mark.asyncio
    async def test_does_not_affect_other_users(self, test_client, test_user, second_user, mock_db):
        await _seed_notification(mock_db, str(second_user.id), is_read=False)

        test_client.put(
            "/notifications/read-all",
            headers=_auth(str(test_user.id)),
        )

        count_resp = test_client.get(
            "/notifications/unread-count",
            headers=_auth(str(second_user.id)),
        )
        assert count_resp.json()["count"] == 1

    def test_requires_authentication(self, test_client):
        response = test_client.put("/notifications/read-all")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# DELETE /notifications/{id}
# ---------------------------------------------------------------------------

class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_deletes_own_notification(self, test_client, test_user, mock_db):
        notif_id = await _seed_notification(mock_db, str(test_user.id))

        response = test_client.delete(
            f"/notifications/{notif_id}",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["deleted"] is True

        list_resp = test_client.get(
            "/notifications/",
            headers=_auth(str(test_user.id)),
        )
        assert list_resp.json()["total"] == 0

    @pytest.mark.asyncio
    async def test_cannot_delete_other_users_notification(self, test_client, test_user, second_user, mock_db):
        notif_id = await _seed_notification(mock_db, str(second_user.id))

        response = test_client.delete(
            f"/notifications/{notif_id}",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_returns_404_for_nonexistent(self, test_client, test_user, mock_db):
        response = test_client.delete(
            f"/notifications/{str(ObjectId())}",
            headers=_auth(str(test_user.id)),
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_requires_authentication(self, test_client):
        response = test_client.delete(f"/notifications/{str(ObjectId())}")
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
