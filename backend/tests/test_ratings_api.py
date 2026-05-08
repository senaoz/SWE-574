import pytest
from fastapi import status

from tests.api_test_utils import (
    create_user_with_headers,
    insert_service_doc,
    insert_transaction_doc,
)


class TestRatingsAPI:
    @pytest.mark.asyncio
    async def test_create_and_read_rating_endpoints(self, test_client, mock_db):
        provider, provider_headers = await create_user_with_headers(mock_db, "ratings_provider")
        requester, requester_headers = await create_user_with_headers(mock_db, "ratings_requester")
        service = await insert_service_doc(mock_db, str(provider.id))
        transaction = await insert_transaction_doc(
            mock_db,
            str(service["_id"]),
            str(provider.id),
            str(requester.id),
            status="completed",
            provider_confirmed=True,
            requester_confirmed=True,
        )

        created = test_client.post(
            "/ratings/",
            headers=requester_headers,
            json={
                "transaction_id": str(transaction["_id"]),
                "rated_user_id": str(provider.id),
                "score": 5,
                "comment": "Great service",
                "tags": ["helpful"],
            },
        )
        assert created.status_code == status.HTTP_200_OK
        assert created.json()["score"] == 5

        duplicate = test_client.post(
            "/ratings/",
            headers=requester_headers,
            json={
                "transaction_id": str(transaction["_id"]),
                "rated_user_id": str(provider.id),
                "score": 4,
            },
        )
        assert duplicate.status_code == status.HTTP_400_BAD_REQUEST

        by_user = test_client.get(f"/ratings/user/{provider.id}")
        assert by_user.status_code == status.HTTP_200_OK
        assert by_user.json()["total"] == 1
        assert by_user.json()["average_score"] == 5.0

        detailed = test_client.get(f"/ratings/user/{provider.id}/detailed")
        assert detailed.status_code == status.HTTP_200_OK
        assert detailed.json()["ratings"][0]["service"]["title"] == service["title"]

        by_transaction = test_client.get(
            f"/ratings/transaction/{transaction['_id']}",
            headers=provider_headers,
        )
        assert by_transaction.status_code == status.HTTP_200_OK
        assert len(by_transaction.json()) == 1

        assert test_client.post("/ratings/", json={"score": 5}).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_rating_validation_and_eligibility_errors(self, test_client, mock_db):
        provider, _ = await create_user_with_headers(mock_db, "ratings_provider_error")
        requester, requester_headers = await create_user_with_headers(
            mock_db, "ratings_requester_error"
        )
        service = await insert_service_doc(mock_db, str(provider.id))
        transaction = await insert_transaction_doc(
            mock_db,
            str(service["_id"]),
            str(provider.id),
            str(requester.id),
            provider_confirmed=False,
            requester_confirmed=False,
        )

        not_ready = test_client.post(
            "/ratings/",
            headers=requester_headers,
            json={
                "transaction_id": str(transaction["_id"]),
                "rated_user_id": str(provider.id),
                "score": 5,
            },
        )
        assert not_ready.status_code == status.HTTP_400_BAD_REQUEST

        invalid_score = test_client.post(
            "/ratings/",
            headers=requester_headers,
            json={
                "transaction_id": str(transaction["_id"]),
                "rated_user_id": str(provider.id),
                "score": 6,
            },
        )
        assert invalid_score.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
