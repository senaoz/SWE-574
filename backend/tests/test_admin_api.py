import pytest
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import (
    create_user_with_headers,
    insert_failed_timebank_transaction,
    insert_join_request_doc,
    insert_service_doc,
)


class TestAdminAPI:
    @pytest.mark.asyncio
    async def test_admin_database_inspection_endpoints_require_privileged_user(
        self, test_client, mock_db
    ):
        admin, admin_headers = await create_user_with_headers(
            mock_db, "admin_api_admin", role=UserRole.ADMIN
        )
        regular, regular_headers = await create_user_with_headers(mock_db, "admin_api_user")
        await insert_service_doc(mock_db, str(admin.id))

        inspect_response = test_client.get("/admin/db/inspect", headers=admin_headers)
        assert inspect_response.status_code == status.HTTP_200_OK
        assert "collections" in inspect_response.json()

        stats_response = test_client.get("/admin/db/stats", headers=admin_headers)
        assert stats_response.status_code == status.HTTP_200_OK
        assert "stats" in stats_response.json()

        forbidden = test_client.get("/admin/db/inspect", headers=regular_headers)
        assert forbidden.status_code == status.HTTP_403_FORBIDDEN

        assert test_client.get("/admin/db/stats").status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_failed_transactions_and_analytics_endpoints(self, test_client, mock_db):
        moderator, moderator_headers = await create_user_with_headers(
            mock_db, "admin_api_mod", role=UserRole.MODERATOR
        )
        regular, regular_headers = await create_user_with_headers(mock_db, "admin_api_regular")
        service = await insert_service_doc(mock_db, str(moderator.id), max_participants=3)
        await insert_join_request_doc(mock_db, str(service["_id"]), str(regular.id), status="approved")
        await insert_failed_timebank_transaction(mock_db, str(regular.id), str(service["_id"]))

        failed = test_client.get("/admin/failed-transactions", headers=moderator_headers)
        assert failed.status_code == status.HTTP_200_OK
        assert failed.json()["total"] == 1

        analytics = test_client.get(
            "/admin/analytics/service-participation",
            headers=moderator_headers,
        )
        assert analytics.status_code == status.HTTP_200_OK
        assert analytics.json()["summary"]["total_services"] == 1
        assert analytics.json()["join_requests"]["approved"] == 1

        forbidden = test_client.get("/admin/failed-transactions", headers=regular_headers)
        assert forbidden.status_code == status.HTTP_403_FORBIDDEN
