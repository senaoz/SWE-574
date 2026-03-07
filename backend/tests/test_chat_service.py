from datetime import datetime

import pytest
from bson import ObjectId

import tests.conftest as shared_conftest
from app.models.chat import ChatRoomCreate, ChatRoomUpdate, MessageCreate, MessageUpdate
from app.models.user import UserCreate, UserRole
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService


@pytest.fixture(autouse=True)
def _stabilize_chat_service_tests(monkeypatch):
    """Keep ObjectIds intact in mock DB docs for ChatService logic."""
    monkeypatch.setattr(shared_conftest, "convert_objectid_to_str", lambda obj: obj)
    monkeypatch.setattr("app.services.chat_service.is_offensive", lambda _text: False)


async def _create_user(mock_db, username: str):
    auth_service = AuthService(mock_db)
    return await auth_service.create_user(
        UserCreate(
            username=username,
            email=f"{username}@example.com",
            password="testpassword123",
            confirm_password="testpassword123",
            full_name=f"{username} User",
            bio="bio",
            location="Istanbul",
            role=UserRole.USER,
            profile_visible=True,
            show_email=False,
            show_location=True,
            email_notifications=True,
            service_matches_notifications=True,
            messages_notifications=True,
        )
    )


async def _insert_service(mock_db, title: str = "Test Service") -> ObjectId:
    result = await mock_db.services.insert_one(
        {"title": title, "description": "desc", "category": "testing"}
    )
    return result.inserted_id


async def _insert_transaction(
    mock_db,
    provider_id: str,
    requester_id: str,
    service_id: ObjectId | None = None,
    *,
    description: str = "Service exchange",
    hours: float = 2.0,
) -> ObjectId:
    tx_doc = {
        "provider_id": ObjectId(provider_id),
        "requester_id": ObjectId(requester_id),
        "service_id": service_id,
        "description": description,
        "hours": hours,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await mock_db.transactions.insert_one(tx_doc)
    return result.inserted_id


class TestChatService:
    @pytest.mark.asyncio
    async def test_create_chat_room_happy_path(self, mock_db):
        creator = await _create_user(mock_db, "chat_create_creator")
        participant = await _create_user(mock_db, "chat_create_participant")
        service_id = await _insert_service(mock_db, "Service A")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(
                name="Room A",
                description="chat room",
                participant_ids=[str(creator.id), str(participant.id)],
                service_id=str(service_id),
            ),
            str(creator.id),
        )

        assert room is not None
        assert set(room.participant_ids) == {str(creator.id), str(participant.id)}
        assert set(room.service_ids) == {str(service_id)}

    @pytest.mark.asyncio
    async def test_create_chat_room_duplicate_returns_existing_and_adds_service(self, mock_db):
        creator = await _create_user(mock_db, "chat_create_dup_creator")
        participant = await _create_user(mock_db, "chat_create_dup_participant")
        service_a = await _insert_service(mock_db, "Service A")
        service_b = await _insert_service(mock_db, "Service B")

        chat_service = ChatService(mock_db)
        room_a = await chat_service.create_chat_room(
            ChatRoomCreate(
                participant_ids=[str(creator.id), str(participant.id)],
                service_id=str(service_a),
            ),
            str(creator.id),
        )
        room_b = await chat_service.create_chat_room(
            ChatRoomCreate(
                participant_ids=[str(creator.id), str(participant.id)],
                service_id=str(service_b),
            ),
            str(creator.id),
        )

        assert room_b.id == room_a.id
        assert set(room_b.service_ids) == {str(service_a), str(service_b)}
        total_rooms = await mock_db.chat_rooms.count_documents({})
        assert total_rooms == 1

    @pytest.mark.asyncio
    async def test_create_chat_room_rejects_creator_not_in_participants(self, mock_db):
        creator = await _create_user(mock_db, "chat_create_invalid_creator")
        participant_a = await _create_user(mock_db, "chat_create_invalid_a")
        participant_b = await _create_user(mock_db, "chat_create_invalid_b")

        chat_service = ChatService(mock_db)
        with pytest.raises(ValueError, match="Creator must be a participant"):
            await chat_service.create_chat_room(
                ChatRoomCreate(
                    participant_ids=[str(participant_a.id), str(participant_b.id)],
                ),
                str(creator.id),
            )

    @pytest.mark.asyncio
    async def test_get_user_chat_rooms_supports_pagination_and_empty(self, mock_db):
        user = await _create_user(mock_db, "chat_rooms_user")
        p1 = await _create_user(mock_db, "chat_rooms_p1")
        p2 = await _create_user(mock_db, "chat_rooms_p2")
        outsider = await _create_user(mock_db, "chat_rooms_outsider")

        chat_service = ChatService(mock_db)
        await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(user.id), str(p1.id)]),
            str(user.id),
        )
        await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(user.id), str(p2.id)]),
            str(user.id),
        )

        page1, total = await chat_service.get_user_chat_rooms(str(user.id), page=1, limit=1)
        page2, _ = await chat_service.get_user_chat_rooms(str(user.id), page=2, limit=1)
        empty, empty_total = await chat_service.get_user_chat_rooms(str(outsider.id), page=1, limit=10)

        assert total == 2
        assert len(page1) == 1
        assert len(page2) == 1
        assert empty == []
        assert empty_total == 0

    @pytest.mark.asyncio
    async def test_get_chat_room_by_id_allows_participant_only(self, mock_db):
        owner = await _create_user(mock_db, "chat_get_room_owner")
        participant = await _create_user(mock_db, "chat_get_room_participant")
        outsider = await _create_user(mock_db, "chat_get_room_outsider")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(owner.id), str(participant.id)]),
            str(owner.id),
        )

        found = await chat_service.get_chat_room_by_id(str(room.id), str(participant.id))
        not_found_for_outsider = await chat_service.get_chat_room_by_id(str(room.id), str(outsider.id))
        missing_room = await chat_service.get_chat_room_by_id(str(ObjectId()), str(owner.id))

        assert found is not None
        assert found.id == room.id
        assert not_found_for_outsider is None
        assert missing_room is None

    @pytest.mark.asyncio
    async def test_update_chat_room_allows_participant_and_rejects_non_participant(self, mock_db):
        owner = await _create_user(mock_db, "chat_update_owner")
        participant = await _create_user(mock_db, "chat_update_participant")
        outsider = await _create_user(mock_db, "chat_update_outsider")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(owner.id), str(participant.id)]),
            str(owner.id),
        )

        updated = await chat_service.update_chat_room(
            str(room.id),
            ChatRoomUpdate(name="Updated Room", description="new description"),
            str(participant.id),
        )

        assert updated is not None
        assert updated.name == "Updated Room"
        assert updated.description == "new description"

        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.update_chat_room(
                str(room.id),
                ChatRoomUpdate(name="Should Fail"),
                str(outsider.id),
            )

    @pytest.mark.asyncio
    async def test_send_message_happy_path_and_non_participant_rejected(self, mock_db):
        owner = await _create_user(mock_db, "chat_send_owner")
        participant = await _create_user(mock_db, "chat_send_participant")
        outsider = await _create_user(mock_db, "chat_send_outsider")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(owner.id), str(participant.id)]),
            str(owner.id),
        )

        message = await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="hello world", message_type="text"),
            str(owner.id),
        )

        assert message is not None
        assert message.content == "hello world"
        assert message.sender_id == str(owner.id)

        room_doc = await mock_db.chat_rooms.find_one({"_id": ObjectId(str(room.id))})
        assert room_doc["last_message_at"] is not None

        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.send_message(
                MessageCreate(room_id=str(room.id), content="blocked", message_type="text"),
                str(outsider.id),
            )

    @pytest.mark.asyncio
    async def test_get_room_messages_supports_pagination_and_auth(self, mock_db):
        owner = await _create_user(mock_db, "chat_msgs_owner")
        participant = await _create_user(mock_db, "chat_msgs_participant")
        outsider = await _create_user(mock_db, "chat_msgs_outsider")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(owner.id), str(participant.id)]),
            str(owner.id),
        )

        await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="m1", message_type="text"),
            str(owner.id),
        )
        await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="m2", message_type="text"),
            str(participant.id),
        )
        await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="m3", message_type="text"),
            str(owner.id),
        )

        messages, total = await chat_service.get_room_messages(str(room.id), str(owner.id), page=1, limit=2)
        assert total == 3
        assert len(messages) == 2

        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.get_room_messages(str(room.id), str(outsider.id), page=1, limit=10)

    @pytest.mark.asyncio
    async def test_update_message_allows_sender_and_rejects_non_sender(self, mock_db):
        sender = await _create_user(mock_db, "chat_update_msg_sender")
        participant = await _create_user(mock_db, "chat_update_msg_participant")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(sender.id), str(participant.id)]),
            str(sender.id),
        )
        message = await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="original text", message_type="text"),
            str(sender.id),
        )

        updated = await chat_service.update_message(
            str(message.id),
            MessageUpdate(content="edited text"),
            str(sender.id),
        )

        assert updated is not None
        assert updated.content == "edited text"
        assert updated.is_edited is True

        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.update_message(
                str(message.id),
                MessageUpdate(content="unauthorized edit"),
                str(participant.id),
            )

    @pytest.mark.asyncio
    async def test_delete_message_soft_deletes_and_rejects_non_sender(self, mock_db):
        sender = await _create_user(mock_db, "chat_delete_msg_sender")
        participant = await _create_user(mock_db, "chat_delete_msg_participant")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(sender.id), str(participant.id)]),
            str(sender.id),
        )
        message = await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="delete me", message_type="text"),
            str(sender.id),
        )
        second_message = await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="keep me", message_type="text"),
            str(sender.id),
        )

        deleted = await chat_service.delete_message(str(message.id), str(sender.id))
        assert deleted is True

        deleted_doc = await mock_db.messages.find_one({"_id": ObjectId(str(message.id))})
        assert deleted_doc["is_deleted"] is True

        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.delete_message(str(second_message.id), str(participant.id))

    @pytest.mark.asyncio
    async def test_get_message_by_id_allows_room_participants_only(self, mock_db):
        sender = await _create_user(mock_db, "chat_get_msg_sender")
        participant = await _create_user(mock_db, "chat_get_msg_participant")
        outsider = await _create_user(mock_db, "chat_get_msg_outsider")

        chat_service = ChatService(mock_db)
        room = await chat_service.create_chat_room(
            ChatRoomCreate(participant_ids=[str(sender.id), str(participant.id)]),
            str(sender.id),
        )
        message = await chat_service.send_message(
            MessageCreate(room_id=str(room.id), content="visible message", message_type="text"),
            str(sender.id),
        )

        found = await chat_service.get_message_by_id(str(message.id), str(participant.id))
        not_found_for_outsider = await chat_service.get_message_by_id(str(message.id), str(outsider.id))
        missing_message = await chat_service.get_message_by_id(str(ObjectId()), str(sender.id))

        assert found is not None
        assert found.id == message.id
        assert not_found_for_outsider is None
        assert missing_message is None

    @pytest.mark.asyncio
    async def test_create_room_for_transaction_happy_path_and_existing_room(self, mock_db):
        provider = await _create_user(mock_db, "chat_tx_provider")
        requester = await _create_user(mock_db, "chat_tx_requester")
        service_id = await _insert_service(mock_db, "Transaction service")
        transaction_id = await _insert_transaction(
            mock_db,
            str(provider.id),
            str(requester.id),
            service_id=service_id,
            description="Transaction chat",
            hours=3.0,
        )

        chat_service = ChatService(mock_db)
        created = await chat_service.create_room_for_transaction(str(transaction_id), str(provider.id))
        repeated = await chat_service.create_room_for_transaction(str(transaction_id), str(requester.id))

        assert created is not None
        assert created.id == repeated.id
        assert created.transaction_id == str(transaction_id)
        assert set(created.participant_ids) == {str(provider.id), str(requester.id)}
        assert str(service_id) in created.service_ids

    @pytest.mark.asyncio
    async def test_create_room_for_transaction_rejects_unauthorized_user(self, mock_db):
        provider = await _create_user(mock_db, "chat_tx_unauth_provider")
        requester = await _create_user(mock_db, "chat_tx_unauth_requester")
        outsider = await _create_user(mock_db, "chat_tx_unauth_outsider")
        transaction_id = await _insert_transaction(
            mock_db,
            str(provider.id),
            str(requester.id),
            service_id=None,
        )

        chat_service = ChatService(mock_db)
        with pytest.raises(ValueError, match="not authorized"):
            await chat_service.create_room_for_transaction(str(transaction_id), str(outsider.id))
