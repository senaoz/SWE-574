import pytest
from bson import ObjectId
from fastapi import status

from tests.api_test_utils import (
    create_user_with_headers,
    insert_join_request_doc,
    insert_service_doc,
)


class TestJoinRequestsAPI:
    @pytest.mark.asyncio
    async def test_create_list_get_and_cancel_join_request_endpoints(self, test_client, mock_db):
        owner, owner_headers = await create_user_with_headers(
            mock_db, "jr_api_owner", balance=3.0
        )
        applicant, applicant_headers = await create_user_with_headers(
            mock_db, "jr_api_applicant", balance=5.0
        )
        service = await insert_service_doc(mock_db, str(owner.id), estimated_duration=1.0)

        created = test_client.post(
            "/join-requests/",
            headers=applicant_headers,
            json={"service_id": str(service["_id"]), "message": "I can join"},
        )
        assert created.status_code == status.HTTP_200_OK
        request_id = created.json().get("id") or created.json().get("_id")

        pending = test_client.get(
            f"/join-requests/service/{service['_id']}/pending",
            headers=applicant_headers,
        )
        assert pending.status_code == status.HTTP_200_OK
        assert (pending.json().get("id") or pending.json().get("_id")) == request_id

        service_requests = test_client.get(
            f"/join-requests/service/{service['_id']}",
            headers=owner_headers,
        )
        assert service_requests.status_code == status.HTTP_200_OK
        assert service_requests.json()["total"] == 1

        my_requests = test_client.get("/join-requests/my-requests", headers=applicant_headers)
        assert my_requests.status_code == status.HTTP_200_OK
        assert my_requests.json()["total"] == 1

        get_response = test_client.get(f"/join-requests/{request_id}", headers=applicant_headers)
        assert get_response.status_code == status.HTTP_200_OK

        cancelled = test_client.post(
            f"/join-requests/{request_id}/cancel",
            headers=applicant_headers,
        )
        assert cancelled.status_code == status.HTTP_200_OK
        assert cancelled.json()["status"] == "cancelled"

        assert test_client.post("/join-requests/", json={"service_id": str(service["_id"])}).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_approve_reject_and_error_join_request_endpoints(self, test_client, mock_db):
        owner, owner_headers = await create_user_with_headers(
            mock_db, "jr_api_owner_review", balance=3.0
        )
        applicant, applicant_headers = await create_user_with_headers(
            mock_db, "jr_api_applicant_review", balance=5.0
        )
        outsider, outsider_headers = await create_user_with_headers(mock_db, "jr_api_outsider")
        service = await insert_service_doc(mock_db, str(owner.id), estimated_duration=1.0)
        request = await insert_join_request_doc(
            mock_db, str(service["_id"]), str(applicant.id), status="pending"
        )

        forbidden_update = test_client.put(
            f"/join-requests/{request['_id']}",
            headers=applicant_headers,
            json={"status": "approved"},
        )
        assert forbidden_update.status_code == status.HTTP_400_BAD_REQUEST

        approved = test_client.put(
            f"/join-requests/{request['_id']}",
            headers=owner_headers,
            json={"status": "approved", "admin_message": "Welcome"},
        )
        assert approved.status_code == status.HTTP_200_OK
        assert approved.json()["status"] == "approved"
        assert await mock_db.transactions.count_documents({"service_id": service["_id"]}) == 1

        rejected_request = await insert_join_request_doc(
            mock_db, str(service["_id"]), str(outsider.id), status="pending"
        )
        rejected = test_client.put(
            f"/join-requests/{rejected_request['_id']}",
            headers=owner_headers,
            json={"status": "rejected"},
        )
        assert rejected.status_code == status.HTTP_200_OK
        assert rejected.json()["status"] == "rejected"

        missing_pending = test_client.get(
            f"/join-requests/service/{ObjectId()}/pending",
            headers=outsider_headers,
        )
        assert missing_pending.status_code == status.HTTP_404_NOT_FOUND

        missing_request = test_client.get(f"/join-requests/{ObjectId()}", headers=owner_headers)
        assert missing_request.status_code == status.HTTP_404_NOT_FOUND
