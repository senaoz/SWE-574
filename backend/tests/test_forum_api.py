from datetime import datetime, timedelta

import pytest
from bson import ObjectId
from fastapi import status

from tests.api_test_utils import create_user_with_headers, insert_service_doc


class TestForumAPI:
    @pytest.mark.asyncio
    async def test_discussion_and_forum_comment_endpoints(self, test_client, mock_db):
        author, author_headers = await create_user_with_headers(mock_db, "forum_author")
        other, other_headers = await create_user_with_headers(mock_db, "forum_other")

        created = test_client.post(
            "/forum/discussions",
            headers=author_headers,
            json={"title": "API Discussion", "body": "Discussion body"},
        )
        assert created.status_code == status.HTTP_201_CREATED
        discussion_id = created.json().get("id") or created.json().get("_id")

        listed = test_client.get("/forum/discussions")
        assert listed.status_code == status.HTTP_200_OK
        assert listed.json()["total"] == 1

        detail = test_client.get(f"/forum/discussions/{discussion_id}", headers=author_headers)
        assert detail.status_code == status.HTTP_200_OK

        forbidden_update = test_client.put(
            f"/forum/discussions/{discussion_id}",
            headers=other_headers,
            json={"title": "Nope"},
        )
        assert forbidden_update.status_code == status.HTTP_400_BAD_REQUEST

        updated = test_client.put(
            f"/forum/discussions/{discussion_id}",
            headers=author_headers,
            json={"title": "Updated Discussion"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["title"] == "Updated Discussion"

        upvote = test_client.post(
            f"/forum/discussions/{discussion_id}/upvote",
            headers=other_headers,
        )
        assert upvote.status_code == status.HTTP_200_OK
        assert upvote.json()["user_upvoted"] is True

        comment = test_client.post(
            "/forum/comments",
            headers=other_headers,
            json={
                "target_type": "discussion",
                "target_id": discussion_id,
                "content": "Nice thread",
            },
        )
        assert comment.status_code == status.HTTP_201_CREATED
        comment_id = comment.json().get("id") or comment.json().get("_id")

        comments = test_client.get(
            "/forum/comments",
            params={"target_type": "discussion", "target_id": discussion_id},
            headers=author_headers,
        )
        assert comments.status_code == status.HTTP_200_OK
        assert comments.json()["total"] == 1

        comment_upvote = test_client.post(
            f"/forum/comments/{comment_id}/upvote",
            headers=author_headers,
        )
        assert comment_upvote.status_code == status.HTTP_200_OK

        updated_comment = test_client.put(
            f"/forum/comments/{comment_id}",
            headers=other_headers,
            json={"content": "Edited forum comment"},
        )
        assert updated_comment.status_code == status.HTTP_200_OK
        assert updated_comment.json()["content"] == "Edited forum comment"

        deleted_comment = test_client.delete(
            f"/forum/comments/{comment_id}",
            headers=other_headers,
        )
        assert deleted_comment.status_code == status.HTTP_200_OK

        deleted_discussion = test_client.delete(
            f"/forum/discussions/{discussion_id}",
            headers=author_headers,
        )
        assert deleted_discussion.status_code == status.HTTP_200_OK

        assert test_client.post("/forum/discussions", json={"title": "No auth", "body": "x"}).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_event_attendance_upvote_and_linked_event_endpoints(self, test_client, mock_db):
        owner, owner_headers = await create_user_with_headers(mock_db, "forum_event_owner")
        attendee, attendee_headers = await create_user_with_headers(mock_db, "forum_event_attendee")
        service = await insert_service_doc(mock_db, str(owner.id), title="Forum Linked Service")
        event_at = (datetime.utcnow() + timedelta(days=1)).isoformat()

        created = test_client.post(
            "/forum/events",
            headers=owner_headers,
            json={
                "title": "API Event",
                "description": "Event description",
                "event_at": event_at,
                "location": "Istanbul",
                "latitude": 41.0,
                "longitude": 29.0,
                "service_id": str(service["_id"]),
            },
        )
        assert created.status_code == status.HTTP_201_CREATED
        event_id = created.json().get("id") or created.json().get("_id")

        listed = test_client.get("/forum/events")
        assert listed.status_code == status.HTTP_200_OK
        assert listed.json()["total"] == 1

        detail = test_client.get(f"/forum/events/{event_id}", headers=attendee_headers)
        assert detail.status_code == status.HTTP_200_OK

        updated = test_client.put(
            f"/forum/events/{event_id}",
            headers=owner_headers,
            json={"title": "Updated Event"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["title"] == "Updated Event"

        attended = test_client.post(
            f"/forum/events/{event_id}/attend",
            headers=attendee_headers,
        )
        assert attended.status_code == status.HTTP_200_OK
        assert attended.json()["attendee_count"] == 1

        attendees = test_client.get(f"/forum/events/{event_id}/attendees")
        assert attendees.status_code == status.HTTP_200_OK
        assert len(attendees.json()) == 1

        event_upvote = test_client.post(
            f"/forum/events/{event_id}/upvote",
            headers=attendee_headers,
        )
        assert event_upvote.status_code == status.HTTP_200_OK

        linked = test_client.get(f"/forum/services/{service['_id']}/linked-events")
        assert linked.status_code == status.HTTP_200_OK
        assert linked.json()["total"] == 1

        unattended = test_client.delete(
            f"/forum/events/{event_id}/attend",
            headers=attendee_headers,
        )
        assert unattended.status_code == status.HTTP_200_OK
        assert unattended.json()["attendee_count"] == 0

        deleted = test_client.delete(f"/forum/events/{event_id}", headers=owner_headers)
        assert deleted.status_code == status.HTTP_200_OK

        missing = test_client.get(f"/forum/events/{ObjectId()}")
        assert missing.status_code == status.HTTP_404_NOT_FOUND
