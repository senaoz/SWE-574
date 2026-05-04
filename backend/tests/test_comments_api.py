import pytest
from bson import ObjectId
from fastapi import status

from tests.api_test_utils import (
    create_user_with_headers,
    insert_comment_doc,
    insert_service_doc,
)


class TestCommentsAPI:
    @pytest.mark.asyncio
    async def test_comment_crud_and_list_endpoints(self, test_client, mock_db):
        author, author_headers = await create_user_with_headers(mock_db, "comments_author")
        other, other_headers = await create_user_with_headers(mock_db, "comments_other")
        service = await insert_service_doc(mock_db, str(author.id))

        created = test_client.post(
            "/comments/",
            headers=author_headers,
            json={"service_id": str(service["_id"]), "content": "Great service"},
        )
        assert created.status_code == status.HTTP_200_OK
        comment_id = created.json().get("id") or created.json().get("_id")

        by_service = test_client.get(f"/comments/service/{service['_id']}")
        assert by_service.status_code == status.HTTP_200_OK
        assert by_service.json()["total"] == 1

        by_user = test_client.get(f"/comments/user/{author.id}")
        assert by_user.status_code == status.HTTP_200_OK
        assert by_user.json()["total"] == 1

        get_response = test_client.get(f"/comments/{comment_id}")
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.json()["content"] == "Great service"

        unauthorized_update = test_client.put(
            f"/comments/{comment_id}",
            headers=other_headers,
            json={"content": "Nope"},
        )
        assert unauthorized_update.status_code == status.HTTP_400_BAD_REQUEST

        updated = test_client.put(
            f"/comments/{comment_id}",
            headers=author_headers,
            json={"content": "Updated comment"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["content"] == "Updated comment"

        deleted = test_client.delete(f"/comments/{comment_id}", headers=author_headers)
        assert deleted.status_code == status.HTTP_200_OK

        assert test_client.post("/comments/", json={"service_id": str(service["_id"]), "content": "x"}).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_comment_not_found_and_validation_errors(self, test_client, mock_db):
        author, author_headers = await create_user_with_headers(mock_db, "comments_errors")
        service = await insert_service_doc(mock_db, str(author.id))
        comment = await insert_comment_doc(mock_db, str(service["_id"]), str(author.id))

        missing = test_client.get(f"/comments/{ObjectId()}")
        assert missing.status_code == status.HTTP_404_NOT_FOUND

        bad_payload = test_client.post(
            "/comments/",
            headers=author_headers,
            json={"service_id": str(service["_id"]), "content": ""},
        )
        assert bad_payload.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        missing_update = test_client.put(
            f"/comments/{ObjectId()}",
            headers=author_headers,
            json={"content": "Updated"},
        )
        assert missing_update.status_code == status.HTTP_400_BAD_REQUEST

        assert comment["_id"] is not None
