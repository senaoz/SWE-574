import pytest
from bson import ObjectId
from datetime import datetime

from app.services.forum_service import ForumService
from app.models.forum import (
    ForumDiscussionCreate, ForumDiscussionUpdate,
    ForumEventCreate, ForumEventUpdate,
    ForumCommentCreate, ForumCommentUpdate,
    ForumTargetType,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user_doc(user_id, username="user"):
    return {
        "_id": ObjectId(user_id),
        "username": username,
        "full_name": f"{username} full",
        "email": f"{username}@example.com",
        "password_hash": "hash",
        "is_active": True,
        "is_verified": True,
        "role": "user",
        "timebank_balance": 5.0,
        "profile_picture": None,
        "profile_visible": True,
        "show_email": False,
        "show_location": True,
        "email_notifications": True,
        "service_matches_notifications": True,
        "messages_notifications": True,
        "interests": [],
        "social_links": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_discussion_doc(user_id, title="Test Discussion", body="Test body content"):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "title": title,
        "body": body,
        "tags": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_event_doc(user_id, title="Test Event", description="Test event description",
                   service_id=None, attendee_ids=None):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "title": title,
        "description": description,
        "event_at": datetime.utcnow(),
        "location": "Istanbul",
        "latitude": 41.0,
        "longitude": 29.0,
        "is_remote": False,
        "tags": [],
        "service_id": ObjectId(service_id) if service_id else None,
        "attendee_ids": attendee_ids or [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_comment_doc(user_id, target_type, target_id, content="Test comment"):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "target_type": target_type,
        "target_id": ObjectId(target_id),
        "content": content,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_service_doc(user_id, title="Linked Service"):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "title": title,
        "description": "A service description",
        "category": "test",
        "tags": [],
        "service_type": "offer",
        "status": "active",
        "estimated_duration": 2.0,
        "max_participants": 5,
        "matched_user_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# Discussions — create
# ---------------------------------------------------------------------------

class TestCreateDiscussion:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "alice"))

        svc = ForumService(mock_db)
        result = await svc.create_discussion(
            ForumDiscussionCreate(title="Hello World", body="Body content here"),
            user_id,
        )

        assert result.title == "Hello World"
        assert result.user_id == user_id
        assert result.comment_count == 0
        assert result.user is not None
        assert result.user["username"] == "alice"

    @pytest.mark.asyncio
    async def test_persists_to_db(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))

        svc = ForumService(mock_db)
        result = await svc.create_discussion(
            ForumDiscussionCreate(title="Persisted Title", body="Persisted body"),
            user_id,
        )

        stored = await mock_db.forum_discussions.find_one({"_id": ObjectId(result.id)})
        assert stored is not None
        assert stored["title"] == "Persisted Title"


# ---------------------------------------------------------------------------
# Discussions — get_discussions
# ---------------------------------------------------------------------------

class TestGetDiscussions:

    @pytest.mark.asyncio
    async def test_returns_all(self, mock_db):
        user_id = str(ObjectId())
        for i in range(3):
            await mock_db.forum_discussions.insert_one(
                make_discussion_doc(user_id, title=f"Discussion {i}")
            )

        svc = ForumService(mock_db)
        results, total = await svc.get_discussions()

        assert total == 3
        assert len(results) == 3

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        for i in range(5):
            await mock_db.forum_discussions.insert_one(
                make_discussion_doc(user_id, title=f"Discussion {i}")
            )

        svc = ForumService(mock_db)
        results, total = await svc.get_discussions(page=1, limit=2)

        assert total == 5
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_tag_filter(self, mock_db):
        user_id = str(ObjectId())
        tagged = make_discussion_doc(user_id, title="Tagged")
        tagged["tags"] = [{"label": "python", "entityId": "Q1"}]
        await mock_db.forum_discussions.insert_one(tagged)
        await mock_db.forum_discussions.insert_one(make_discussion_doc(user_id, title="Untagged"))

        svc = ForumService(mock_db)
        results, total = await svc.get_discussions(tag="python")

        assert total == 1
        assert results[0].title == "Tagged"

    @pytest.mark.asyncio
    async def test_search_query_matches_title(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.forum_discussions.insert_one(
            make_discussion_doc(user_id, title="FastAPI tips")
        )
        await mock_db.forum_discussions.insert_one(
            make_discussion_doc(user_id, title="Other topic")
        )

        svc = ForumService(mock_db)
        results, total = await svc.get_discussions(q="fastapi")

        assert total == 1
        assert results[0].title == "FastAPI tips"

    @pytest.mark.asyncio
    async def test_search_query_matches_body(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.forum_discussions.insert_one(
            make_discussion_doc(user_id, body="Body mentioning mongodb")
        )
        await mock_db.forum_discussions.insert_one(
            make_discussion_doc(user_id, body="Completely different content")
        )

        svc = ForumService(mock_db)
        results, total = await svc.get_discussions(q="mongodb")

        assert total == 1


# ---------------------------------------------------------------------------
# Discussions — get_discussion_by_id
# ---------------------------------------------------------------------------

class TestGetDiscussionById:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_discussion_doc(user_id, title="Specific Discussion")
        await mock_db.forum_discussions.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.get_discussion_by_id(str(doc["_id"]))

        assert result is not None
        assert result.title == "Specific Discussion"
        assert result.id == str(doc["_id"])

    @pytest.mark.asyncio
    async def test_nonexistent_returns_none(self, mock_db):
        svc = ForumService(mock_db)
        result = await svc.get_discussion_by_id(str(ObjectId()))

        assert result is None

    @pytest.mark.asyncio
    async def test_comment_count_included(self, mock_db):
        user_id = str(ObjectId())
        doc = make_discussion_doc(user_id)
        await mock_db.forum_discussions.insert_one(doc)
        discussion_id = str(doc["_id"])

        for _ in range(3):
            await mock_db.forum_comments.insert_one(
                make_comment_doc(user_id, "discussion", discussion_id)
            )

        svc = ForumService(mock_db)
        result = await svc.get_discussion_by_id(discussion_id)

        assert result.comment_count == 3


# ---------------------------------------------------------------------------
# Discussions — update_discussion
# ---------------------------------------------------------------------------

class TestUpdateDiscussion:

    @pytest.mark.asyncio
    async def test_author_can_update(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_discussion_doc(user_id, title="Original")
        await mock_db.forum_discussions.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.update_discussion(
            str(doc["_id"]),
            ForumDiscussionUpdate(title="Updated Title"),
            user_id,
        )

        assert result.title == "Updated Title"

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_discussion_doc(author_id)
        await mock_db.forum_discussions.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.update_discussion(
                str(doc["_id"]),
                ForumDiscussionUpdate(title="Hijacked"),
                intruder_id,
            )

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Discussion not found"):
            await svc.update_discussion(
                str(ObjectId()),
                ForumDiscussionUpdate(title="Whatever"),
                str(ObjectId()),
            )


# ---------------------------------------------------------------------------
# Discussions — delete_discussion
# ---------------------------------------------------------------------------

class TestDeleteDiscussion:

    @pytest.mark.asyncio
    async def test_author_can_delete(self, mock_db):
        user_id = str(ObjectId())
        doc = make_discussion_doc(user_id)
        await mock_db.forum_discussions.insert_one(doc)
        discussion_id = str(doc["_id"])

        svc = ForumService(mock_db)
        result = await svc.delete_discussion(discussion_id, user_id)

        assert result is True
        stored = await mock_db.forum_discussions.find_one({"_id": doc["_id"]})
        assert stored is None

    @pytest.mark.asyncio
    async def test_delete_cascades_to_comments(self, mock_db):
        user_id = str(ObjectId())
        doc = make_discussion_doc(user_id)
        await mock_db.forum_discussions.insert_one(doc)
        discussion_id = str(doc["_id"])

        for _ in range(2):
            await mock_db.forum_comments.insert_one(
                make_comment_doc(str(ObjectId()), "discussion", discussion_id)
            )

        svc = ForumService(mock_db)
        await svc.delete_discussion(discussion_id, user_id)

        remaining = await mock_db.forum_comments.count_documents(
            {"target_type": "discussion", "target_id": ObjectId(discussion_id)}
        )
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_discussion_doc(author_id)
        await mock_db.forum_discussions.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.delete_discussion(str(doc["_id"]), intruder_id)

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Discussion not found"):
            await svc.delete_discussion(str(ObjectId()), str(ObjectId()))


# ---------------------------------------------------------------------------
# Events — create_event
# ---------------------------------------------------------------------------

class TestCreateEvent:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "bob"))

        svc = ForumService(mock_db)
        result = await svc.create_event(
            ForumEventCreate(
                title="Community Meetup",
                description="Join us for a community gathering",
                event_at=datetime.utcnow(),
            ),
            user_id,
        )

        assert result.title == "Community Meetup"
        assert result.user_id == user_id
        assert result.attendee_count == 0
        assert result.user["username"] == "bob"

    @pytest.mark.asyncio
    async def test_with_linked_service(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        service = make_service_doc(user_id, title="Yoga Class")
        await mock_db.services.insert_one(service)

        svc = ForumService(mock_db)
        result = await svc.create_event(
            ForumEventCreate(
                title="Yoga Event",
                description="Come do yoga",
                event_at=datetime.utcnow(),
                service_id=str(service["_id"]),
            ),
            user_id,
        )

        assert result.service is not None
        assert result.service["title"] == "Yoga Class"

    @pytest.mark.asyncio
    async def test_linked_service_not_found_raises(self, mock_db):
        user_id = str(ObjectId())
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Linked service not found"):
            await svc.create_event(
                ForumEventCreate(
                    title="Bad Event",
                    description="Will fail",
                    event_at=datetime.utcnow(),
                    service_id=str(ObjectId()),
                ),
                user_id,
            )


# ---------------------------------------------------------------------------
# Events — get_events
# ---------------------------------------------------------------------------

class TestGetEvents:

    @pytest.mark.asyncio
    async def test_returns_all(self, mock_db):
        user_id = str(ObjectId())
        for i in range(3):
            await mock_db.forum_events.insert_one(
                make_event_doc(user_id, title=f"Event {i}")
            )

        svc = ForumService(mock_db)
        results, total = await svc.get_events()

        assert total == 3
        assert len(results) == 3

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        for i in range(5):
            await mock_db.forum_events.insert_one(
                make_event_doc(user_id, title=f"Event {i}")
            )

        svc = ForumService(mock_db)
        results, total = await svc.get_events(page=1, limit=2)

        assert total == 5
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_tag_filter(self, mock_db):
        user_id = str(ObjectId())
        tagged = make_event_doc(user_id, title="Tagged Event")
        tagged["tags"] = [{"label": "outdoor", "entityId": "Q2"}]
        await mock_db.forum_events.insert_one(tagged)
        await mock_db.forum_events.insert_one(make_event_doc(user_id, title="Other Event"))

        svc = ForumService(mock_db)
        results, total = await svc.get_events(tag="outdoor")

        assert total == 1
        assert results[0].title == "Tagged Event"

    @pytest.mark.asyncio
    async def test_search_query(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.forum_events.insert_one(
            make_event_doc(user_id, title="Yoga Retreat", description="Relax and meditate")
        )
        await mock_db.forum_events.insert_one(
            make_event_doc(user_id, title="Coding Workshop", description="Learn to code")
        )

        svc = ForumService(mock_db)
        results, total = await svc.get_events(q="yoga")

        assert total == 1
        assert results[0].title == "Yoga Retreat"


# ---------------------------------------------------------------------------
# Events — get_event_by_id
# ---------------------------------------------------------------------------

class TestGetEventById:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_event_doc(user_id, title="Specific Event")
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.get_event_by_id(str(doc["_id"]))

        assert result is not None
        assert result.title == "Specific Event"

    @pytest.mark.asyncio
    async def test_nonexistent_returns_none(self, mock_db):
        svc = ForumService(mock_db)
        result = await svc.get_event_by_id(str(ObjectId()))

        assert result is None


# ---------------------------------------------------------------------------
# Events — update_event
# ---------------------------------------------------------------------------

class TestUpdateEvent:

    @pytest.mark.asyncio
    async def test_author_can_update(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_event_doc(user_id, title="Original Event")
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.update_event(
            str(doc["_id"]),
            ForumEventUpdate(title="Updated Event"),
            user_id,
        )

        assert result.title == "Updated Event"

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_event_doc(author_id)
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.update_event(
                str(doc["_id"]),
                ForumEventUpdate(title="Hijacked"),
                intruder_id,
            )

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Event not found"):
            await svc.update_event(
                str(ObjectId()),
                ForumEventUpdate(title="Whatever"),
                str(ObjectId()),
            )


# ---------------------------------------------------------------------------
# Events — delete_event
# ---------------------------------------------------------------------------

class TestDeleteEvent:

    @pytest.mark.asyncio
    async def test_author_can_delete(self, mock_db):
        user_id = str(ObjectId())
        doc = make_event_doc(user_id)
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.delete_event(str(doc["_id"]), user_id)

        assert result is True
        stored = await mock_db.forum_events.find_one({"_id": doc["_id"]})
        assert stored is None

    @pytest.mark.asyncio
    async def test_delete_cascades_to_comments(self, mock_db):
        user_id = str(ObjectId())
        doc = make_event_doc(user_id)
        await mock_db.forum_events.insert_one(doc)
        event_id = str(doc["_id"])

        for _ in range(2):
            await mock_db.forum_comments.insert_one(
                make_comment_doc(str(ObjectId()), "event", event_id)
            )

        svc = ForumService(mock_db)
        await svc.delete_event(event_id, user_id)

        remaining = await mock_db.forum_comments.count_documents(
            {"target_type": "event", "target_id": ObjectId(event_id)}
        )
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_event_doc(author_id)
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.delete_event(str(doc["_id"]), intruder_id)

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Event not found"):
            await svc.delete_event(str(ObjectId()), str(ObjectId()))


# ---------------------------------------------------------------------------
# Events — get_events_for_service
# ---------------------------------------------------------------------------

class TestGetEventsForService:

    @pytest.mark.asyncio
    async def test_returns_linked_events(self, mock_db):
        user_id = str(ObjectId())
        service = make_service_doc(user_id)
        await mock_db.services.insert_one(service)
        service_id = str(service["_id"])

        await mock_db.forum_events.insert_one(
            make_event_doc(user_id, title="Linked Event", service_id=service_id)
        )
        await mock_db.forum_events.insert_one(
            make_event_doc(user_id, title="Unlinked Event")
        )

        svc = ForumService(mock_db)
        results = await svc.get_events_for_service(service_id)

        assert len(results) == 1
        assert results[0].title == "Linked Event"

    @pytest.mark.asyncio
    async def test_no_events_returns_empty(self, mock_db):
        svc = ForumService(mock_db)
        results = await svc.get_events_for_service(str(ObjectId()))

        assert results == []


# ---------------------------------------------------------------------------
# Attendance — attend_event / unattend_event
# ---------------------------------------------------------------------------

class TestAttendEvent:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_event_doc(str(ObjectId()))
        await mock_db.forum_events.insert_one(doc)
        event_id = str(doc["_id"])

        svc = ForumService(mock_db)
        result = await svc.attend_event(event_id, user_id)

        assert user_id in result.attendee_ids
        assert result.attendee_count == 1

    @pytest.mark.asyncio
    async def test_already_attending_raises(self, mock_db):
        user_id = str(ObjectId())
        doc = make_event_doc(str(ObjectId()), attendee_ids=[ObjectId(user_id)])
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Already attending"):
            await svc.attend_event(str(doc["_id"]), user_id)

    @pytest.mark.asyncio
    async def test_event_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Event not found"):
            await svc.attend_event(str(ObjectId()), str(ObjectId()))


class TestUnattendEvent:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_event_doc(str(ObjectId()), attendee_ids=[ObjectId(user_id)])
        await mock_db.forum_events.insert_one(doc)
        event_id = str(doc["_id"])

        svc = ForumService(mock_db)
        result = await svc.unattend_event(event_id, user_id)

        assert user_id not in result.attendee_ids

    @pytest.mark.asyncio
    async def test_event_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Event not found"):
            await svc.unattend_event(str(ObjectId()), str(ObjectId()))


# ---------------------------------------------------------------------------
# Attendance — get_event_attendees
# ---------------------------------------------------------------------------

class TestGetEventAttendees:

    @pytest.mark.asyncio
    async def test_returns_attendee_list(self, mock_db):
        attendee_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(attendee_id, "carol"))
        doc = make_event_doc(str(ObjectId()), attendee_ids=[ObjectId(attendee_id)])
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        attendees = await svc.get_event_attendees(str(doc["_id"]))

        assert len(attendees) == 1
        assert attendees[0]["username"] == "carol"

    @pytest.mark.asyncio
    async def test_empty_attendees(self, mock_db):
        doc = make_event_doc(str(ObjectId()))
        await mock_db.forum_events.insert_one(doc)

        svc = ForumService(mock_db)
        attendees = await svc.get_event_attendees(str(doc["_id"]))

        assert attendees == []

    @pytest.mark.asyncio
    async def test_event_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Event not found"):
            await svc.get_event_attendees(str(ObjectId()))


# ---------------------------------------------------------------------------
# Comments — create_comment
# ---------------------------------------------------------------------------

class TestCreateComment:

    @pytest.mark.asyncio
    async def test_comment_on_discussion(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "dan"))
        discussion = make_discussion_doc(str(ObjectId()))
        await mock_db.forum_discussions.insert_one(discussion)
        discussion_id = str(discussion["_id"])

        svc = ForumService(mock_db)
        result = await svc.create_comment(
            ForumCommentCreate(
                target_type=ForumTargetType.DISCUSSION,
                target_id=discussion_id,
                content="Great post!",
            ),
            user_id,
        )

        assert result.content == "Great post!"
        assert result.target_type == "discussion"
        assert result.user["username"] == "dan"

    @pytest.mark.asyncio
    async def test_comment_on_event(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        event = make_event_doc(str(ObjectId()))
        await mock_db.forum_events.insert_one(event)
        event_id = str(event["_id"])

        svc = ForumService(mock_db)
        result = await svc.create_comment(
            ForumCommentCreate(
                target_type=ForumTargetType.EVENT,
                target_id=event_id,
                content="See you there!",
            ),
            user_id,
        )

        assert result.content == "See you there!"
        assert result.target_type == "event"

    @pytest.mark.asyncio
    async def test_target_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Discussion not found"):
            await svc.create_comment(
                ForumCommentCreate(
                    target_type=ForumTargetType.DISCUSSION,
                    target_id=str(ObjectId()),
                    content="Ghost comment",
                ),
                str(ObjectId()),
            )


# ---------------------------------------------------------------------------
# Comments — get_comments
# ---------------------------------------------------------------------------

class TestGetComments:

    @pytest.mark.asyncio
    async def test_returns_comments_for_target(self, mock_db):
        user_id = str(ObjectId())
        discussion_id = str(ObjectId())
        for i in range(3):
            await mock_db.forum_comments.insert_one(
                make_comment_doc(user_id, "discussion", discussion_id, content=f"Comment {i}")
            )
        # unrelated comment on different discussion
        await mock_db.forum_comments.insert_one(
            make_comment_doc(user_id, "discussion", str(ObjectId()), content="Unrelated")
        )

        svc = ForumService(mock_db)
        results, total = await svc.get_comments("discussion", discussion_id)

        assert total == 3
        assert len(results) == 3

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        target_id = str(ObjectId())
        for i in range(5):
            await mock_db.forum_comments.insert_one(
                make_comment_doc(user_id, "event", target_id)
            )

        svc = ForumService(mock_db)
        results, total = await svc.get_comments("event", target_id, page=1, limit=2)

        assert total == 5
        assert len(results) == 2


# ---------------------------------------------------------------------------
# Comments — update_comment
# ---------------------------------------------------------------------------

class TestUpdateComment:

    @pytest.mark.asyncio
    async def test_author_can_update(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        doc = make_comment_doc(user_id, "discussion", str(ObjectId()), content="Original")
        await mock_db.forum_comments.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.update_comment(
            str(doc["_id"]),
            ForumCommentUpdate(content="Updated content"),
            user_id,
        )

        assert result.content == "Updated content"

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_comment_doc(author_id, "discussion", str(ObjectId()))
        await mock_db.forum_comments.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.update_comment(
                str(doc["_id"]),
                ForumCommentUpdate(content="Hijacked"),
                intruder_id,
            )

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Comment not found"):
            await svc.update_comment(
                str(ObjectId()),
                ForumCommentUpdate(content="Whatever"),
                str(ObjectId()),
            )


# ---------------------------------------------------------------------------
# Comments — delete_comment
# ---------------------------------------------------------------------------

class TestDeleteComment:

    @pytest.mark.asyncio
    async def test_author_can_delete(self, mock_db):
        user_id = str(ObjectId())
        doc = make_comment_doc(user_id, "event", str(ObjectId()))
        await mock_db.forum_comments.insert_one(doc)

        svc = ForumService(mock_db)
        result = await svc.delete_comment(str(doc["_id"]), user_id)

        assert result is True
        stored = await mock_db.forum_comments.find_one({"_id": doc["_id"]})
        assert stored is None

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        author_id = str(ObjectId())
        intruder_id = str(ObjectId())
        doc = make_comment_doc(author_id, "discussion", str(ObjectId()))
        await mock_db.forum_comments.insert_one(doc)

        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.delete_comment(str(doc["_id"]), intruder_id)

    @pytest.mark.asyncio
    async def test_not_found_raises(self, mock_db):
        svc = ForumService(mock_db)
        with pytest.raises(ValueError, match="Comment not found"):
            await svc.delete_comment(str(ObjectId()), str(ObjectId()))
