from datetime import datetime, timedelta

import pytest
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import create_user_with_headers


def _item_id(payload: dict) -> str:
    return payload.get("id") or payload.get("_id")


class TestPinningAPI:
    @pytest.mark.asyncio
    async def test_moderator_can_pin_forum_discussions_and_events(self, test_client, mock_db):
        author, author_headers = await create_user_with_headers(mock_db, "pin_forum_author")
        moderator, moderator_headers = await create_user_with_headers(
            mock_db, "pin_forum_mod", role=UserRole.MODERATOR
        )
        _, regular_headers = await create_user_with_headers(mock_db, "pin_forum_regular")

        first_discussion = test_client.post(
            "/forum/discussions",
            headers=author_headers,
            json={"title": "Regular discussion", "body": "First body"},
        )
        second_discussion = test_client.post(
            "/forum/discussions",
            headers=author_headers,
            json={"title": "Pinned discussion", "body": "Second body"},
        )
        assert first_discussion.status_code == status.HTTP_201_CREATED
        assert second_discussion.status_code == status.HTTP_201_CREATED
        discussion_id = _item_id(second_discussion.json())

        forbidden_discussion_pin = test_client.put(
            f"/forum/discussions/{_item_id(first_discussion.json())}/pin",
            headers=regular_headers,
            params={"pinned": True},
        )
        assert forbidden_discussion_pin.status_code == status.HTTP_403_FORBIDDEN

        pinned_discussion = test_client.put(
            f"/forum/discussions/{discussion_id}/pin",
            headers=moderator_headers,
            params={"pinned": True},
        )
        assert pinned_discussion.status_code == status.HTTP_200_OK
        assert pinned_discussion.json()["is_pinned"] is True
        assert pinned_discussion.json()["pinned_by"] == str(moderator.id)

        listed_discussions = test_client.get("/forum/discussions")
        assert listed_discussions.status_code == status.HTTP_200_OK
        assert _item_id(listed_discussions.json()["discussions"][0]) == discussion_id

        unpinned_discussion = test_client.put(
            f"/forum/discussions/{discussion_id}/pin",
            headers=moderator_headers,
            params={"pinned": False},
        )
        assert unpinned_discussion.status_code == status.HTTP_200_OK
        assert unpinned_discussion.json()["is_pinned"] is False
        assert unpinned_discussion.json()["pinned_by"] is None

        event_at = (datetime.utcnow() + timedelta(days=1)).isoformat()
        first_event = test_client.post(
            "/forum/events",
            headers=author_headers,
            json={
                "title": "Regular event",
                "description": "First event",
                "event_at": event_at,
            },
        )
        second_event = test_client.post(
            "/forum/events",
            headers=author_headers,
            json={
                "title": "Pinned event",
                "description": "Second event",
                "event_at": event_at,
            },
        )
        assert first_event.status_code == status.HTTP_201_CREATED
        assert second_event.status_code == status.HTTP_201_CREATED
        event_id = _item_id(second_event.json())

        forbidden_event_pin = test_client.put(
            f"/forum/events/{_item_id(first_event.json())}/pin",
            headers=regular_headers,
            params={"pinned": True},
        )
        assert forbidden_event_pin.status_code == status.HTTP_403_FORBIDDEN

        pinned_event = test_client.put(
            f"/forum/events/{event_id}/pin",
            headers=moderator_headers,
            params={"pinned": True},
        )
        assert pinned_event.status_code == status.HTTP_200_OK
        assert pinned_event.json()["is_pinned"] is True
        assert pinned_event.json()["pinned_by"] == str(moderator.id)

        listed_events = test_client.get("/forum/events")
        assert listed_events.status_code == status.HTTP_200_OK
        assert _item_id(listed_events.json()["events"][0]) == event_id

    @pytest.mark.asyncio
    async def test_moderator_can_pin_communities_and_community_posts(self, test_client, mock_db):
        _, founder_headers = await create_user_with_headers(mock_db, "pin_community_founder")
        moderator, moderator_headers = await create_user_with_headers(
            mock_db, "pin_community_mod", role=UserRole.MODERATOR
        )
        _, regular_headers = await create_user_with_headers(mock_db, "pin_community_regular")

        first_community = test_client.post(
            "/communities",
            headers=founder_headers,
            json={"name": "Regular Community", "description": "First community"},
        )
        second_community = test_client.post(
            "/communities",
            headers=founder_headers,
            json={"name": "Pinned Community", "description": "Second community"},
        )
        assert first_community.status_code == status.HTTP_201_CREATED
        assert second_community.status_code == status.HTTP_201_CREATED
        community_id = _item_id(first_community.json())
        pinned_community_id = _item_id(second_community.json())

        forbidden_community_pin = test_client.put(
            f"/communities/{community_id}/pin",
            headers=regular_headers,
            params={"pinned": True},
        )
        assert forbidden_community_pin.status_code == status.HTTP_403_FORBIDDEN

        pinned_community = test_client.put(
            f"/communities/{pinned_community_id}/pin",
            headers=moderator_headers,
            params={"pinned": True},
        )
        assert pinned_community.status_code == status.HTTP_200_OK
        assert pinned_community.json()["is_pinned"] is True
        assert pinned_community.json()["pinned_by"] == str(moderator.id)

        listed_communities = test_client.get("/communities")
        assert listed_communities.status_code == status.HTTP_200_OK
        assert _item_id(listed_communities.json()["communities"][0]) == pinned_community_id

        post = test_client.post(
            f"/communities/{community_id}/posts",
            headers=founder_headers,
            json={"title": "Pinned post", "body": "Important community post"},
        )
        other_post = test_client.post(
            f"/communities/{community_id}/posts",
            headers=founder_headers,
            json={"title": "Regular post", "body": "Normal community post"},
        )
        assert post.status_code == status.HTTP_201_CREATED
        assert other_post.status_code == status.HTTP_201_CREATED
        post_id = _item_id(post.json())

        forbidden_post_pin = test_client.put(
            f"/communities/{community_id}/posts/{_item_id(other_post.json())}/pin",
            headers=regular_headers,
            params={"pinned": True},
        )
        assert forbidden_post_pin.status_code == status.HTTP_400_BAD_REQUEST

        pinned_post = test_client.put(
            f"/communities/{community_id}/posts/{post_id}/pin",
            headers=moderator_headers,
            params={"pinned": True},
        )
        assert pinned_post.status_code == status.HTTP_200_OK
        assert pinned_post.json()["is_pinned"] is True
        assert pinned_post.json()["pinned_by"] == str(moderator.id)

        listed_posts = test_client.get(f"/communities/{community_id}/posts")
        assert listed_posts.status_code == status.HTTP_200_OK
        assert _item_id(listed_posts.json()["posts"][0]) == post_id
