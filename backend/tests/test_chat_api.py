import pytest
from bson import ObjectId
from fastapi import status

import tests.conftest as shared_conftest
from tests.api_test_utils import (
    create_user_with_headers,
    insert_chat_room_doc,
    insert_message_doc,
    insert_service_doc,
    insert_transaction_doc,
)


@pytest.fixture(autouse=True)
def _stabilize_chat_api_tests(monkeypatch):
    monkeypatch.setattr(shared_conftest, "convert_objectid_to_str", lambda obj: obj)
    monkeypatch.setattr("app.services.chat_service.is_offensive", lambda _text: False)


class TestChatAPI:
    @pytest.mark.asyncio
    async def test_room_crud_and_special_room_endpoints(self, test_client, mock_db):
        owner, owner_headers = await create_user_with_headers(mock_db, "chat_api_owner")
        participant, participant_headers = await create_user_with_headers(
            mock_db, "chat_api_participant"
        )
        outsider, outsider_headers = await create_user_with_headers(mock_db, "chat_api_outsider")

        created = test_client.post(
            "/chat/rooms",
            headers=owner_headers,
            json={
                "name": "General",
                "participant_ids": [str(owner.id), str(participant.id)],
            },
        )
        assert created.status_code == status.HTTP_200_OK
        room_id = created.json().get("id") or created.json().get("_id")

        rooms = test_client.get("/chat/rooms", headers=owner_headers)
        assert rooms.status_code == status.HTTP_200_OK
        assert rooms.json()["total"] >= 1

        get_room = test_client.get(f"/chat/rooms/{room_id}", headers=participant_headers)
        assert get_room.status_code == status.HTTP_200_OK

        forbidden_get = test_client.get(f"/chat/rooms/{room_id}", headers=outsider_headers)
        assert forbidden_get.status_code == status.HTTP_404_NOT_FOUND

        updated = test_client.put(
            f"/chat/rooms/{room_id}",
            headers=participant_headers,
            json={"name": "Updated room"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["name"] == "Updated room"

        service = await insert_service_doc(mock_db, str(owner.id), title="Chat Service")
        await mock_db.services.update_one(
            {"_id": service["_id"]},
            {"$set": {"matched_user_ids": [ObjectId(str(participant.id))]}},
        )
        service_room = test_client.post(
            f"/chat/rooms/service/{service['_id']}",
            headers=owner_headers,
        )
        assert service_room.status_code == status.HTTP_200_OK

        transaction = await insert_transaction_doc(
            mock_db, str(service["_id"]), str(owner.id), str(participant.id)
        )
        tx_room = test_client.post(
            f"/chat/rooms/transaction/{transaction['_id']}",
            headers=participant_headers,
        )
        assert tx_room.status_code == status.HTTP_200_OK

        assert test_client.post("/chat/rooms", json={"participant_ids": []}).status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_message_crud_endpoints(self, test_client, mock_db):
        sender, sender_headers = await create_user_with_headers(mock_db, "chat_api_sender")
        participant, participant_headers = await create_user_with_headers(
            mock_db, "chat_api_reader"
        )
        outsider, outsider_headers = await create_user_with_headers(mock_db, "chat_api_stranger")
        room = await insert_chat_room_doc(mock_db, [str(sender.id), str(participant.id)])

        sent = test_client.post(
            "/chat/messages",
            headers=sender_headers,
            json={"room_id": str(room["_id"]), "content": "Hello"},
        )
        assert sent.status_code == status.HTTP_200_OK
        message_id = sent.json().get("id") or sent.json().get("_id")

        messages = test_client.get(
            f"/chat/rooms/{room['_id']}/messages",
            headers=participant_headers,
        )
        assert messages.status_code == status.HTTP_200_OK
        assert messages.json()["total"] == 1

        get_message = test_client.get(f"/chat/messages/{message_id}", headers=participant_headers)
        assert get_message.status_code == status.HTTP_200_OK

        forbidden_message = test_client.get(f"/chat/messages/{message_id}", headers=outsider_headers)
        assert forbidden_message.status_code == status.HTTP_404_NOT_FOUND

        forbidden_update = test_client.put(
            f"/chat/messages/{message_id}",
            headers=participant_headers,
            json={"content": "Not mine"},
        )
        assert forbidden_update.status_code == status.HTTP_400_BAD_REQUEST

        updated = test_client.put(
            f"/chat/messages/{message_id}",
            headers=sender_headers,
            json={"content": "Edited"},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["content"] == "Edited"

        deleted = test_client.delete(f"/chat/messages/{message_id}", headers=sender_headers)
        assert deleted.status_code == status.HTTP_200_OK

        missing = test_client.get(f"/chat/messages/{ObjectId()}", headers=sender_headers)
        assert missing.status_code == status.HTTP_404_NOT_FOUND

        orphan = await insert_message_doc(mock_db, str(room["_id"]), str(sender.id), content="orphan")
        assert orphan["_id"] is not None
