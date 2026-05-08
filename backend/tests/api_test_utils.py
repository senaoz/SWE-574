from datetime import datetime, timedelta

from bson import ObjectId

from app.core.security import create_access_token
from app.models.user import UserCreate, UserRole
from app.services.auth_service import AuthService


def auth_headers_for(user):
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def create_api_user(
    mock_db,
    username: str,
    *,
    role: UserRole = UserRole.USER,
    balance: float = 5.0,
    password: str = "testpassword123",
):
    auth_service = AuthService(mock_db)
    user = await auth_service.create_user(
        UserCreate(
            username=username,
            email=f"{username}@example.com",
            password=password,
            confirm_password=password,
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
    await mock_db.users.update_one(
        {"_id": ObjectId(str(user.id))},
        {
            "$set": {
                "role": role,
                "timebank_balance": balance,
                "updated_at": datetime.utcnow(),
            }
        },
    )
    return user


async def create_user_with_headers(mock_db, username: str, **kwargs):
    user = await create_api_user(mock_db, username, **kwargs)
    return user, auth_headers_for(user)


async def insert_service_doc(
    mock_db,
    owner_id: str,
    *,
    title: str = "API Test Service",
    service_type: str = "offer",
    status: str = "active",
    estimated_duration: float = 2.0,
    max_participants: int = 5,
):
    service = {
        "_id": ObjectId(),
        "user_id": ObjectId(str(owner_id)),
        "title": title,
        "description": "A service description long enough for API tests.",
        "category": "testing",
        "tags": [],
        "estimated_duration": estimated_duration,
        "location": {"latitude": 41.0, "longitude": 29.0, "address": "Istanbul"},
        "is_remote": False,
        "deadline": None,
        "service_type": service_type,
        "max_participants": max_participants,
        "scheduling_type": "open",
        "specific_date": None,
        "specific_time": None,
        "recurring_pattern": None,
        "open_availability": None,
        "image_urls": [],
        "status": status,
        "matched_user_ids": [],
        "receiver_confirmed_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.services.insert_one(service)
    return service


async def insert_join_request_doc(
    mock_db,
    service_id: str,
    user_id: str,
    *,
    status: str = "pending",
):
    doc = {
        "_id": ObjectId(),
        "service_id": ObjectId(str(service_id)),
        "user_id": ObjectId(str(user_id)),
        "message": "Please let me join",
        "status": status,
        "admin_message": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.join_requests.insert_one(doc)
    return doc


async def insert_transaction_doc(
    mock_db,
    service_id: str,
    provider_id: str,
    requester_id: str,
    *,
    status: str = "pending",
    provider_confirmed: bool = False,
    requester_confirmed: bool = False,
    timebank_hours: float = 2.0,
):
    doc = {
        "_id": ObjectId(),
        "service_id": ObjectId(str(service_id)),
        "provider_id": ObjectId(str(provider_id)),
        "requester_id": ObjectId(str(requester_id)),
        "timebank_hours": timebank_hours,
        "description": "Service exchange",
        "status": status,
        "provider_confirmed": provider_confirmed,
        "requester_confirmed": requester_confirmed,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    if status == "completed":
        doc["completed_at"] = datetime.utcnow()
    await mock_db.transactions.insert_one(doc)
    return doc


async def insert_comment_doc(mock_db, service_id: str, user_id: str, *, content: str = "Nice service"):
    doc = {
        "_id": ObjectId(),
        "service_id": ObjectId(str(service_id)),
        "user_id": ObjectId(str(user_id)),
        "content": content,
        "image_urls": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.comments.insert_one(doc)
    return doc


async def insert_chat_room_doc(mock_db, participant_ids, *, service_ids=None, transaction_id=None):
    doc = {
        "_id": ObjectId(),
        "name": "API Room",
        "description": "Room description",
        "is_active": True,
        "participant_ids": [ObjectId(str(uid)) for uid in participant_ids],
        "service_ids": [ObjectId(str(sid)) for sid in service_ids or []],
        "transaction_id": ObjectId(str(transaction_id)) if transaction_id else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_message_at": None,
    }
    await mock_db.chat_rooms.insert_one(doc)
    return doc


async def insert_message_doc(mock_db, room_id: str, sender_id: str, *, content: str = "Hello"):
    doc = {
        "_id": ObjectId(),
        "room_id": ObjectId(str(room_id)),
        "sender_id": ObjectId(str(sender_id)),
        "content": content,
        "message_type": "text",
        "reply_to_message_id": None,
        "is_edited": False,
        "is_deleted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.messages.insert_one(doc)
    return doc


async def insert_forum_discussion_doc(mock_db, user_id: str, *, title: str = "API Discussion"):
    doc = {
        "_id": ObjectId(),
        "user_id": ObjectId(str(user_id)),
        "title": title,
        "body": "Discussion body",
        "tags": [],
        "image_urls": [],
        "community_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.forum_discussions.insert_one(doc)
    return doc


async def insert_forum_event_doc(mock_db, user_id: str, *, title: str = "API Event", service_id=None):
    doc = {
        "_id": ObjectId(),
        "user_id": ObjectId(str(user_id)),
        "title": title,
        "description": "Event description",
        "event_at": datetime.utcnow() + timedelta(days=1),
        "location": "Istanbul",
        "latitude": 41.0,
        "longitude": 29.0,
        "is_remote": False,
        "tags": [],
        "service_id": ObjectId(str(service_id)) if service_id else None,
        "attendee_ids": [],
        "image_urls": [],
        "banner_image_url": None,
        "community_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.forum_events.insert_one(doc)
    return doc


async def insert_forum_comment_doc(
    mock_db,
    user_id: str,
    target_type: str,
    target_id: str,
    *,
    content: str = "Forum comment",
):
    doc = {
        "_id": ObjectId(),
        "user_id": ObjectId(str(user_id)),
        "target_type": target_type,
        "target_id": ObjectId(str(target_id)),
        "content": content,
        "image_urls": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await mock_db.forum_comments.insert_one(doc)
    return doc


async def insert_rating_doc(mock_db, transaction_id: str, rater_id: str, rated_user_id: str, *, score: int = 5):
    doc = {
        "_id": ObjectId(),
        "transaction_id": ObjectId(str(transaction_id)),
        "rater_id": ObjectId(str(rater_id)),
        "rated_user_id": ObjectId(str(rated_user_id)),
        "score": score,
        "comment": "Great",
        "tags": [],
        "image_urls": [],
        "created_at": datetime.utcnow(),
    }
    await mock_db.ratings.insert_one(doc)
    return doc


async def insert_failed_timebank_transaction(mock_db, user_id: str, service_id: str | None = None):
    doc = {
        "_id": ObjectId(),
        "user_id": ObjectId(str(user_id)),
        "amount": -2.0,
        "description": "Failed debit",
        "service_id": ObjectId(str(service_id)) if service_id else None,
        "reason": "insufficient_balance",
        "user_balance_at_failure": 1.0,
        "error_message": "Insufficient balance",
        "created_at": datetime.utcnow(),
    }
    await mock_db.failed_timebank_transactions.insert_one(doc)
    return doc
