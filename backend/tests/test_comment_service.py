import pytest
from bson import ObjectId
from datetime import datetime

from app.services.comment_service import CommentService
from app.models.comment import CommentCreate, CommentUpdate


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


def make_service_doc(user_id):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "title": "Test Service",
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


def make_comment_doc(user_id, service_id, content="Test comment"):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "service_id": ObjectId(service_id),
        "content": content,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# create_comment
# ---------------------------------------------------------------------------

class TestCreateComment:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "alice"))
        service = make_service_doc(user_id)
        await mock_db.services.insert_one(service)
        service_id = str(service["_id"])

        svc = CommentService(mock_db)
        result = await svc.create_comment(
            CommentCreate(content="Great service!", service_id=service_id),
            user_id,
        )

        assert result.content == "Great service!"
        assert result.user_id == user_id
        assert result.service_id == service_id
        assert result.user is not None
        assert result.user["username"] == "alice"

    @pytest.mark.asyncio
    async def test_service_not_found(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))

        svc = CommentService(mock_db)
        with pytest.raises(ValueError, match="Service not found"):
            await svc.create_comment(
                CommentCreate(content="Hello", service_id=str(ObjectId())),
                user_id,
            )

    @pytest.mark.asyncio
    async def test_persists_to_db(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        service = make_service_doc(user_id)
        await mock_db.services.insert_one(service)

        svc = CommentService(mock_db)
        result = await svc.create_comment(
            CommentCreate(content="Stored comment", service_id=str(service["_id"])),
            user_id,
        )

        stored = await mock_db.comments.find_one({"_id": ObjectId(result.id)})
        assert stored is not None
        assert stored["content"] == "Stored comment"


# ---------------------------------------------------------------------------
# get_comments_by_service
# ---------------------------------------------------------------------------

class TestGetCommentsByService:

    @pytest.mark.asyncio
    async def test_returns_comments(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        service = make_service_doc(user_id)
        await mock_db.services.insert_one(service)
        service_id = str(service["_id"])

        for i in range(3):
            await mock_db.comments.insert_one(
                make_comment_doc(user_id, service_id, content=f"Comment {i}")
            )

        svc = CommentService(mock_db)
        comments, total = await svc.get_comments_by_service(service_id)

        assert total == 3
        assert len(comments) == 3

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        service = make_service_doc(user_id)
        await mock_db.services.insert_one(service)
        service_id = str(service["_id"])

        for i in range(5):
            await mock_db.comments.insert_one(
                make_comment_doc(user_id, service_id, content=f"Comment {i}")
            )

        svc = CommentService(mock_db)
        comments, total = await svc.get_comments_by_service(service_id, page=1, limit=2)

        assert total == 5
        assert len(comments) == 2

    @pytest.mark.asyncio
    async def test_empty_result(self, mock_db):
        svc = CommentService(mock_db)
        comments, total = await svc.get_comments_by_service(str(ObjectId()))

        assert total == 0
        assert comments == []

    @pytest.mark.asyncio
    async def test_does_not_return_other_service_comments(self, mock_db):
        user_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        service_a = make_service_doc(user_id)
        service_b = make_service_doc(user_id)
        await mock_db.services.insert_one(service_a)
        await mock_db.services.insert_one(service_b)

        await mock_db.comments.insert_one(
            make_comment_doc(user_id, str(service_a["_id"]), content="For A")
        )
        await mock_db.comments.insert_one(
            make_comment_doc(user_id, str(service_b["_id"]), content="For B")
        )

        svc = CommentService(mock_db)
        comments, total = await svc.get_comments_by_service(str(service_a["_id"]))

        assert total == 1
        assert comments[0].content == "For A"


# ---------------------------------------------------------------------------
# get_comment_by_id
# ---------------------------------------------------------------------------

class TestGetCommentById:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "bob"))
        doc = make_comment_doc(user_id, service_id, content="Find me")
        await mock_db.comments.insert_one(doc)

        svc = CommentService(mock_db)
        result = await svc.get_comment_by_id(str(doc["_id"]))

        assert result is not None
        assert result.content == "Find me"
        assert result.user_id == user_id

    @pytest.mark.asyncio
    async def test_not_found_returns_none(self, mock_db):
        svc = CommentService(mock_db)
        result = await svc.get_comment_by_id(str(ObjectId()))

        assert result is None


# ---------------------------------------------------------------------------
# update_comment
# ---------------------------------------------------------------------------

class TestUpdateComment:

    @pytest.mark.asyncio
    async def test_author_can_update(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "carol"))
        doc = make_comment_doc(user_id, service_id, content="Original")
        await mock_db.comments.insert_one(doc)
        comment_id = str(doc["_id"])

        svc = CommentService(mock_db)
        result = await svc.update_comment(
            comment_id,
            CommentUpdate(content="Updated"),
            user_id,
        )

        assert result is not None
        assert result.content == "Updated"

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        service_id = str(ObjectId())
        doc = make_comment_doc(user_id, service_id, content="Original")
        await mock_db.comments.insert_one(doc)
        comment_id = str(doc["_id"])

        svc = CommentService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.update_comment(
                comment_id,
                CommentUpdate(content="Updated"),
                other_user_id,
            )

    @pytest.mark.asyncio
    async def test_comment_not_found(self, mock_db):
        svc = CommentService(mock_db)
        with pytest.raises(ValueError, match="Comment not found"):
            await svc.update_comment(
                str(ObjectId()),
                CommentUpdate(content="Updated"),
                str(ObjectId()),
            )


# ---------------------------------------------------------------------------
# delete_comment
# ---------------------------------------------------------------------------

class TestDeleteComment:

    @pytest.mark.asyncio
    async def test_author_can_delete(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        doc = make_comment_doc(user_id, service_id)
        await mock_db.comments.insert_one(doc)
        comment_id = str(doc["_id"])

        svc = CommentService(mock_db)
        result = await svc.delete_comment(comment_id, user_id)

        assert result is True
        remaining = await mock_db.comments.find_one({"_id": doc["_id"]})
        assert remaining is None

    @pytest.mark.asyncio
    async def test_non_author_rejected(self, mock_db):
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        service_id = str(ObjectId())
        doc = make_comment_doc(user_id, service_id)
        await mock_db.comments.insert_one(doc)
        comment_id = str(doc["_id"])

        svc = CommentService(mock_db)
        with pytest.raises(ValueError, match="Not authorized"):
            await svc.delete_comment(comment_id, other_user_id)

    @pytest.mark.asyncio
    async def test_comment_not_found(self, mock_db):
        svc = CommentService(mock_db)
        with pytest.raises(ValueError, match="Comment not found"):
            await svc.delete_comment(str(ObjectId()), str(ObjectId()))


# ---------------------------------------------------------------------------
# get_user_comments
# ---------------------------------------------------------------------------

class TestGetUserComments:

    @pytest.mark.asyncio
    async def test_returns_user_comments(self, mock_db):
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))
        await mock_db.users.insert_one(make_user_doc(other_user_id, "other"))

        for i in range(3):
            await mock_db.comments.insert_one(
                make_comment_doc(user_id, service_id, content=f"My comment {i}")
            )
        await mock_db.comments.insert_one(
            make_comment_doc(other_user_id, service_id, content="Other's comment")
        )

        svc = CommentService(mock_db)
        comments, total = await svc.get_user_comments(user_id)

        assert total == 3
        assert len(comments) == 3

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id))

        for i in range(5):
            await mock_db.comments.insert_one(
                make_comment_doc(user_id, service_id, content=f"Comment {i}")
            )

        svc = CommentService(mock_db)
        comments, total = await svc.get_user_comments(user_id, page=1, limit=2)

        assert total == 5
        assert len(comments) == 2

    @pytest.mark.asyncio
    async def test_empty_for_unknown_user(self, mock_db):
        svc = CommentService(mock_db)
        comments, total = await svc.get_user_comments(str(ObjectId()))

        assert total == 0
        assert comments == []
