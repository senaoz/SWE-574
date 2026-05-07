import pytest
from bson import ObjectId
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import create_user_with_headers


class TestUsersAPI:
    @pytest.mark.asyncio
    async def test_profile_and_settings_endpoints(self, test_client, mock_db):
        user, headers = await create_user_with_headers(mock_db, "users_profile")

        profile = test_client.get("/users/profile", headers=headers)
        assert profile.status_code == status.HTTP_200_OK
        assert profile.json()["username"] == "users_profile"

        updated = test_client.put(
            "/users/profile",
            headers=headers,
            json={"full_name": "Updated User", "location": "Kadikoy"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["full_name"] == "Updated User"

        settings = test_client.get("/users/settings", headers=headers)
        assert settings.status_code == status.HTTP_200_OK

        updated_settings = test_client.put(
            "/users/settings",
            headers=headers,
            json={"show_email": True, "messages_notifications": False},
        )
        assert updated_settings.status_code == status.HTTP_200_OK
        assert updated_settings.json()["show_email"] is True
        assert updated_settings.json()["messages_notifications"] is False

        assert test_client.get("/users/profile").status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_timebank_badges_search_and_public_user_reads(self, test_client, mock_db):
        user, headers = await create_user_with_headers(mock_db, "users_read", balance=6.0)
        other, _ = await create_user_with_headers(mock_db, "users_searchable")

        timebank = test_client.get("/users/timebank", headers=headers)
        assert timebank.status_code == status.HTTP_200_OK
        assert timebank.json()["balance"] == 6.0

        own_badges = test_client.get("/users/badges", headers=headers)
        assert own_badges.status_code == status.HTTP_200_OK
        assert "badges" in own_badges.json()

        interests = test_client.get("/users/available-interests")
        assert interests.status_code == status.HTTP_200_OK
        assert isinstance(interests.json(), list)

        search = test_client.get("/users/search", headers=headers, params={"q": "search"})
        assert search.status_code == status.HTTP_200_OK
        assert any(item["username"] == "users_searchable" for item in search.json())

        public_user = test_client.get(f"/users/{other.id}")
        assert public_user.status_code == status.HTTP_200_OK
        assert public_user.json()["username"] == "users_searchable"

        public_badges = test_client.get(f"/users/{other.id}/badges")
        assert public_badges.status_code == status.HTTP_200_OK

        communities = test_client.get(f"/users/{other.id}/communities", headers=headers)
        assert communities.status_code == status.HTTP_200_OK
        assert communities.json()["total"] == 0

        missing = test_client.get(f"/users/{str(ObjectId())}")
        assert missing.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_password_change_and_account_delete(self, test_client, mock_db):
        user, headers = await create_user_with_headers(mock_db, "users_password")

        changed = test_client.post(
            "/users/change-password",
            headers=headers,
            json={
                "current_password": "testpassword123",
                "new_password": "Newpassword123",
                "confirm_password": "Newpassword123",
            },
        )
        assert changed.status_code == status.HTTP_200_OK

        deleted = test_client.post(
            "/users/account/delete",
            headers=headers,
            json={"password": "Newpassword123"},
        )
        assert deleted.status_code == status.HTTP_200_OK

        inactive_profile = test_client.get("/users/profile", headers=headers)
        assert inactive_profile.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_admin_and_moderator_user_management_endpoints(self, test_client, mock_db):
        admin, admin_headers = await create_user_with_headers(
            mock_db, "users_admin", role=UserRole.ADMIN
        )
        regular, regular_headers = await create_user_with_headers(mock_db, "users_regular")
        blocked, blocked_headers = await create_user_with_headers(mock_db, "users_blocked")
        moderator, _ = await create_user_with_headers(
            mock_db, "users_moderator", role=UserRole.MODERATOR
        )

        all_users = test_client.get("/users/", headers=admin_headers)
        assert all_users.status_code == status.HTTP_200_OK
        assert len(all_users.json()) >= 3

        role_list = test_client.get("/users/role/moderator", headers=admin_headers)
        assert role_list.status_code == status.HTTP_200_OK
        assert any(item["username"] == "users_moderator" for item in role_list.json())

        role_update = test_client.put(
            f"/users/{regular.id}/role",
            headers=admin_headers,
            json={"role": "moderator"},
        )
        assert role_update.status_code == status.HTTP_200_OK
        assert role_update.json()["role"] == "moderator"

        balance_update = test_client.put(
            f"/users/{regular.id}/timebank",
            headers=admin_headers,
            json={"balance": 8.5},
        )
        assert balance_update.status_code == status.HTTP_200_OK
        assert balance_update.json()["timebank_balance"] == 8.5

        txs = test_client.get("/users/admin/timebank-transactions", headers=admin_headers)
        assert txs.status_code == status.HTTP_200_OK
        assert txs.json()["total"] >= 1

        forbidden = test_client.get("/users/", headers=blocked_headers)
        assert forbidden.status_code == status.HTTP_403_FORBIDDEN

        self_role = test_client.put(
            f"/users/{admin.id}/role",
            headers=admin_headers,
            json={"role": "user"},
        )
        assert self_role.status_code == status.HTTP_400_BAD_REQUEST
