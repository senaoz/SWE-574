import pytest
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import create_user_with_headers


def _item_id(item):
    return item.get("id") or item.get("_id")


class TestCommunityAPI:
    @pytest.mark.asyncio
    async def test_community_crud_membership_and_listing_endpoints(
        self, test_client, mock_db
    ):
        founder, founder_headers = await create_user_with_headers(mock_db, "community_founder")
        member, member_headers = await create_user_with_headers(mock_db, "community_member")

        created = test_client.post(
            "/communities",
            headers=founder_headers,
            json={
                "name": "Neighborhood Helpers",
                "description": "A community for local mutual aid.",
                "rules": ["Be kind"],
                "tags": ["mutual aid", {"label": "Istanbul", "entityId": "Q406"}],
            },
        )
        assert created.status_code == status.HTTP_201_CREATED
        community = created.json()
        community_id = _item_id(community)
        assert community["slug"] == "neighborhood-helpers"
        assert community["user_membership"] == "founder"
        assert community["tags"][0] == {"label": "mutual aid", "entityId": ""}

        listed = test_client.get(
            "/communities",
            headers=founder_headers,
            params={"q": "helpers", "tag": "mutual", "sort_by": "created_at"},
        )
        assert listed.status_code == status.HTTP_200_OK
        listed_body = listed.json()
        assert listed_body["total"] == 1
        assert _item_id(listed_body["communities"][0]) == community_id
        assert listed_body["communities"][0]["user_membership"] == "founder"

        by_slug = test_client.get(f"/communities/{community['slug']}", headers=member_headers)
        assert by_slug.status_code == status.HTTP_200_OK
        assert by_slug.json()["user_membership"] is None

        joined = test_client.post(f"/communities/{community_id}/join", headers=member_headers)
        assert joined.status_code == status.HTTP_200_OK
        assert joined.json()["member_count"] == 2
        assert joined.json()["user_membership"] == "member"

        duplicate_join = test_client.post(f"/communities/{community_id}/join", headers=member_headers)
        assert duplicate_join.status_code == status.HTTP_400_BAD_REQUEST

        my_communities = test_client.get("/communities/my", headers=member_headers)
        assert my_communities.status_code == status.HTTP_200_OK
        assert my_communities.json()["total"] == 1

        members = test_client.get(f"/communities/{community_id}/members", headers=founder_headers)
        assert members.status_code == status.HTTP_200_OK
        assert members.json()["total"] == 2

        promoted = test_client.put(
            f"/communities/{community_id}/members/{member.id}/role",
            headers=founder_headers,
            json={"role": "moderator"},
        )
        assert promoted.status_code == status.HTTP_200_OK
        assert promoted.json()["message"] == "Role updated"

        updated = test_client.put(
            f"/communities/{community_id}",
            headers=founder_headers,
            json={"name": "Neighborhood Helpers Updated", "description": "Updated description"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["slug"] == "neighborhood-helpers-updated"

        founder_leave = test_client.delete(f"/communities/{community_id}/leave", headers=founder_headers)
        assert founder_leave.status_code == status.HTTP_400_BAD_REQUEST

        left = test_client.delete(f"/communities/{community_id}/leave", headers=member_headers)
        assert left.status_code == status.HTTP_200_OK
        assert left.json()["member_count"] == 1

        missing = test_client.get(f"/communities/{community_id}", headers=member_headers)
        assert missing.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_community_post_crud_upvote_and_permissions(self, test_client, mock_db):
        _, founder_headers = await create_user_with_headers(mock_db, "post_founder")
        member, member_headers = await create_user_with_headers(mock_db, "post_member")
        _, outsider_headers = await create_user_with_headers(mock_db, "post_outsider")

        community = test_client.post(
            "/communities",
            headers=founder_headers,
            json={"name": "Posting Club", "description": "A community with posts."},
        )
        assert community.status_code == status.HTTP_201_CREATED
        community_id = _item_id(community.json())

        outsider_post = test_client.post(
            f"/communities/{community_id}/posts",
            headers=outsider_headers,
            json={"title": "Outsider post", "body": "This should be rejected."},
        )
        assert outsider_post.status_code == status.HTTP_400_BAD_REQUEST

        joined = test_client.post(f"/communities/{community_id}/join", headers=member_headers)
        assert joined.status_code == status.HTTP_200_OK

        created_post = test_client.post(
            f"/communities/{community_id}/posts",
            headers=member_headers,
            json={
                "title": "First community post",
                "body": "A useful update for the community.",
                "tags": ["announcement"],
            },
        )
        assert created_post.status_code == status.HTTP_201_CREATED
        post_id = _item_id(created_post.json())
        assert created_post.json()["user"]["username"] == "post_member"

        listed = test_client.get(
            f"/communities/{community_id}/posts",
            headers=member_headers,
            params={"q": "useful", "sort_by": "upvote_count"},
        )
        assert listed.status_code == status.HTTP_200_OK
        assert listed.json()["total"] == 1

        fetched = test_client.get(
            f"/communities/{community_id}/posts/{post_id}",
            headers=member_headers,
        )
        assert fetched.status_code == status.HTTP_200_OK
        assert fetched.json()["user_upvoted"] is False

        upvoted = test_client.post(
            f"/communities/{community_id}/posts/{post_id}/upvote",
            headers=member_headers,
        )
        assert upvoted.status_code == status.HTTP_200_OK
        assert upvoted.json() == {"upvote_count": 1, "user_upvoted": True}

        removed_upvote = test_client.post(
            f"/communities/{community_id}/posts/{post_id}/upvote",
            headers=member_headers,
        )
        assert removed_upvote.status_code == status.HTTP_200_OK
        assert removed_upvote.json() == {"upvote_count": 0, "user_upvoted": False}

        forbidden_update = test_client.put(
            f"/communities/{community_id}/posts/{post_id}",
            headers=outsider_headers,
            json={"title": "Hijacked title"},
        )
        assert forbidden_update.status_code == status.HTTP_400_BAD_REQUEST

        updated = test_client.put(
            f"/communities/{community_id}/posts/{post_id}",
            headers=member_headers,
            json={"title": "Updated community post"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["title"] == "Updated community post"

        deleted = test_client.delete(
            f"/communities/{community_id}/posts/{post_id}",
            headers=member_headers,
        )
        assert deleted.status_code == status.HTTP_204_NO_CONTENT

        missing_post = test_client.get(f"/communities/{community_id}/posts/{post_id}")
        assert missing_post.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_platform_admin_can_update_and_delete_community(self, test_client, mock_db):
        _, founder_headers = await create_user_with_headers(mock_db, "delete_founder")
        _, admin_headers = await create_user_with_headers(
            mock_db, "delete_admin", role=UserRole.ADMIN
        )
        _, regular_headers = await create_user_with_headers(mock_db, "delete_regular")

        community = test_client.post(
            "/communities",
            headers=founder_headers,
            json={"name": "Admin Managed", "description": "Admin can manage this."},
        )
        assert community.status_code == status.HTTP_201_CREATED
        community_id = _item_id(community.json())

        forbidden = test_client.put(
            f"/communities/{community_id}",
            headers=regular_headers,
            json={"description": "Nope"},
        )
        assert forbidden.status_code == status.HTTP_400_BAD_REQUEST

        admin_update = test_client.put(
            f"/communities/{community_id}",
            headers=admin_headers,
            json={"description": "Admin updated description."},
        )
        assert admin_update.status_code == status.HTTP_200_OK
        assert admin_update.json()["description"] == "Admin updated description."

        deleted = test_client.delete(f"/communities/{community_id}", headers=admin_headers)
        assert deleted.status_code == status.HTTP_204_NO_CONTENT

        missing = test_client.get(f"/communities/{community_id}")
        assert missing.status_code == status.HTTP_404_NOT_FOUND
