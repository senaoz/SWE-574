import pytest
from bson import ObjectId
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import (
    create_user_with_headers,
    insert_join_request_doc,
    insert_service_doc,
    insert_transaction_doc,
)


class TestTransactionsAPI:
    @pytest.mark.asyncio
    async def test_create_and_read_transaction_endpoints(self, test_client, mock_db):
        provider, provider_headers = await create_user_with_headers(
            mock_db, "tx_api_provider", balance=3.0
        )
        requester, requester_headers = await create_user_with_headers(
            mock_db, "tx_api_requester", balance=5.0
        )
        service = await insert_service_doc(mock_db, str(provider.id))
        await insert_join_request_doc(
            mock_db, str(service["_id"]), str(requester.id), status="approved"
        )

        create_response = test_client.post(
            "/transactions/",
            headers=requester_headers,
            json={
                "service_id": str(service["_id"]),
                "provider_id": str(provider.id),
                "requester_id": str(requester.id),
                "timebank_hours": 2.0,
                "description": "API exchange",
            },
        )
        assert create_response.status_code == status.HTTP_200_OK
        tx_id = create_response.json().get("id") or create_response.json().get("_id")

        my_transactions = test_client.get(
            "/transactions/my-transactions", headers=requester_headers
        )
        assert my_transactions.status_code == status.HTTP_200_OK
        assert my_transactions.json()["total"] == 1

        service_transactions = test_client.get(
            f"/transactions/service/{service['_id']}", headers=provider_headers
        )
        assert service_transactions.status_code == status.HTTP_200_OK
        assert service_transactions.json()["total"] == 1

        get_response = test_client.get(f"/transactions/{tx_id}", headers=provider_headers)
        assert get_response.status_code == status.HTTP_200_OK
        assert (get_response.json().get("id") or get_response.json().get("_id")) == tx_id

        duplicate = test_client.post(
            "/transactions/",
            headers=requester_headers,
            json={
                "service_id": str(service["_id"]),
                "provider_id": str(provider.id),
                "requester_id": str(requester.id),
                "timebank_hours": 2.0,
            },
        )
        assert duplicate.status_code == status.HTTP_400_BAD_REQUEST

        assert test_client.get("/transactions/my-transactions").status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_update_confirm_and_admin_transaction_endpoints(self, test_client, mock_db):
        provider, provider_headers = await create_user_with_headers(
            mock_db, "tx_api_provider_confirm", balance=3.0
        )
        requester, requester_headers = await create_user_with_headers(
            mock_db, "tx_api_requester_confirm", balance=5.0
        )
        outsider, outsider_headers = await create_user_with_headers(
            mock_db, "tx_api_outsider"
        )
        admin, admin_headers = await create_user_with_headers(
            mock_db, "tx_api_admin", role=UserRole.ADMIN
        )
        service = await insert_service_doc(mock_db, str(provider.id))
        tx = await insert_transaction_doc(
            mock_db, str(service["_id"]), str(provider.id), str(requester.id)
        )

        updated = test_client.put(
            f"/transactions/{tx['_id']}",
            headers=requester_headers,
            json={"status": "in_progress", "completion_notes": "started"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["status"] == "in_progress"

        unauthorized_update = test_client.put(
            f"/transactions/{tx['_id']}",
            headers=outsider_headers,
            json={"status": "cancelled"},
        )
        assert unauthorized_update.status_code == status.HTTP_400_BAD_REQUEST

        provider_confirm = test_client.post(
            f"/transactions/{tx['_id']}/confirm-completion",
            headers=provider_headers,
        )
        assert provider_confirm.status_code == status.HTTP_200_OK
        assert provider_confirm.json()["provider_confirmed"] is True

        requester_confirm = test_client.post(
            f"/transactions/{tx['_id']}/confirm-completion",
            headers=requester_headers,
        )
        assert requester_confirm.status_code == status.HTTP_200_OK
        assert requester_confirm.json()["status"] == "completed"

        admin_all = test_client.get("/transactions/admin/all", headers=admin_headers)
        assert admin_all.status_code == status.HTTP_200_OK
        assert admin_all.json()["total"] >= 1

        forbidden_admin = test_client.get("/transactions/admin/all", headers=outsider_headers)
        assert forbidden_admin.status_code == status.HTTP_403_FORBIDDEN

        missing = test_client.get(f"/transactions/{ObjectId()}", headers=provider_headers)
        assert missing.status_code == status.HTTP_404_NOT_FOUND
