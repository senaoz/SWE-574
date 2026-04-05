import pytest
from bson import ObjectId
from datetime import datetime

from app.services.rating_service import RatingService
from app.models.rating import RatingCreate


def make_transaction(provider_id, requester_id, requester_confirmed=True, provider_confirmed=True):
    return {
        "_id": ObjectId(),
        "provider_id": ObjectId(provider_id),
        "requester_id": ObjectId(requester_id),
        "requester_confirmed": requester_confirmed,
        "provider_confirmed": provider_confirmed,
        "created_at": datetime.utcnow(),
    }


def make_user(user_id, username="user"):
    return {
        "_id": ObjectId(user_id),
        "username": username,
        "full_name": f"{username} full",
    }


class TestRatingServiceCreate:
    """Tests for create_rating guard conditions and happy path"""

    @pytest.mark.asyncio
    async def test_create_rating_happy_path(self, mock_db):
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        txn = make_transaction(provider_id, requester_id)
        await mock_db.transactions.insert_one(txn)
        await mock_db.users.insert_one(make_user(provider_id, "provider"))
        await mock_db.users.insert_one(make_user(requester_id, "requester"))

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=provider_id,
            score=5,
            comment="Great service",
            tags=["punctual"],
        )

        rating = await service.create_rating(requester_id, rating_data)

        assert rating.score == 5
        assert rating.comment == "Great service"
        assert rating.tags == ["punctual"]
        assert str(rating.rater_id) == requester_id
        assert str(rating.rated_user_id) == provider_id

    @pytest.mark.asyncio
    async def test_create_rating_transaction_not_found(self, mock_db):
        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(ObjectId()),
            rated_user_id=str(ObjectId()),
            score=4,
        )

        with pytest.raises(ValueError, match="Transaction not found"):
            await service.create_rating(str(ObjectId()), rating_data)

    @pytest.mark.asyncio
    async def test_create_rating_requires_confirmation(self, mock_db):
        """Rater who has not confirmed their side cannot rate"""
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        # requester has NOT confirmed
        txn = make_transaction(provider_id, requester_id, requester_confirmed=False, provider_confirmed=False)
        await mock_db.transactions.insert_one(txn)

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=provider_id,
            score=3,
        )

        with pytest.raises(ValueError, match="You can only rate after confirming"):
            await service.create_rating(requester_id, rating_data)

    @pytest.mark.asyncio
    async def test_create_rating_provider_can_rate_after_own_confirmation(self, mock_db):
        """Provider can rate after they confirm, even if requester hasn't"""
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        txn = make_transaction(provider_id, requester_id, requester_confirmed=False, provider_confirmed=True)
        await mock_db.transactions.insert_one(txn)
        await mock_db.users.insert_one(make_user(requester_id, "requester"))

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=requester_id,
            score=4,
        )

        rating = await service.create_rating(provider_id, rating_data)
        assert rating.score == 4

    @pytest.mark.asyncio
    async def test_create_rating_self_rating_rejected(self, mock_db):
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        txn = make_transaction(provider_id, requester_id)
        await mock_db.transactions.insert_one(txn)

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=requester_id,  # same as rater_id
            score=5,
        )

        with pytest.raises(ValueError, match="You cannot rate yourself"):
            await service.create_rating(requester_id, rating_data)

    @pytest.mark.asyncio
    async def test_create_rating_duplicate_rejected(self, mock_db):
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        txn = make_transaction(provider_id, requester_id)
        await mock_db.transactions.insert_one(txn)
        await mock_db.users.insert_one(make_user(provider_id, "provider"))

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=provider_id,
            score=5,
        )

        await service.create_rating(requester_id, rating_data)

        with pytest.raises(ValueError, match="You have already rated this transaction"):
            await service.create_rating(requester_id, rating_data)

    @pytest.mark.asyncio
    async def test_create_rating_non_participant_rejected(self, mock_db):
        provider_id = str(ObjectId())
        requester_id = str(ObjectId())
        outsider_id = str(ObjectId())
        txn = make_transaction(provider_id, requester_id)
        await mock_db.transactions.insert_one(txn)

        service = RatingService(mock_db)
        rating_data = RatingCreate(
            transaction_id=str(txn["_id"]),
            rated_user_id=provider_id,
            score=3,
        )

        with pytest.raises(ValueError, match="not a participant"):
            await service.create_rating(outsider_id, rating_data)


class TestRatingServiceRead:
    """Tests for read methods: get_ratings_for_user, get_ratings_for_transaction,
    get_rating_count, get_average_rating"""

    @pytest.mark.asyncio
    async def test_get_ratings_for_user_returns_ratings_and_average(self, mock_db):
        user_id = str(ObjectId())
        rater_id = str(ObjectId())
        txn_id = ObjectId()

        await mock_db.users.insert_one(make_user(rater_id, "rater"))
        await mock_db.ratings.insert_one({
            "_id": ObjectId(),
            "transaction_id": txn_id,
            "rater_id": ObjectId(rater_id),
            "rated_user_id": ObjectId(user_id),
            "score": 4,
            "comment": "Good",
            "tags": [],
            "created_at": datetime.utcnow(),
        })
        await mock_db.ratings.insert_one({
            "_id": ObjectId(),
            "transaction_id": ObjectId(),
            "rater_id": ObjectId(rater_id),
            "rated_user_id": ObjectId(user_id),
            "score": 2,
            "comment": "OK",
            "tags": [],
            "created_at": datetime.utcnow(),
        })

        service = RatingService(mock_db)
        ratings, total, avg = await service.get_ratings_for_user(user_id)

        assert total == 2
        assert len(ratings) == 2
        assert avg == 3.0

    @pytest.mark.asyncio
    async def test_get_ratings_for_user_empty(self, mock_db):
        service = RatingService(mock_db)
        ratings, total, avg = await service.get_ratings_for_user(str(ObjectId()))

        assert total == 0
        assert ratings == []
        assert avg is None

    @pytest.mark.asyncio
    async def test_get_ratings_for_user_pagination(self, mock_db):
        user_id = str(ObjectId())
        rater_id = str(ObjectId())
        await mock_db.users.insert_one(make_user(rater_id, "rater"))

        for score in range(1, 6):
            await mock_db.ratings.insert_one({
                "_id": ObjectId(),
                "transaction_id": ObjectId(),
                "rater_id": ObjectId(rater_id),
                "rated_user_id": ObjectId(user_id),
                "score": score,
                "comment": None,
                "tags": [],
                "created_at": datetime.utcnow(),
            })

        service = RatingService(mock_db)
        ratings, total, _ = await service.get_ratings_for_user(user_id, page=1, limit=2)

        assert total == 5
        assert len(ratings) == 2

    @pytest.mark.asyncio
    async def test_get_ratings_for_transaction_returns_ratings(self, mock_db):
        txn_id = ObjectId()
        rater_id = str(ObjectId())
        await mock_db.users.insert_one(make_user(rater_id, "rater"))
        await mock_db.ratings.insert_one({
            "_id": ObjectId(),
            "transaction_id": txn_id,
            "rater_id": ObjectId(rater_id),
            "rated_user_id": ObjectId(),
            "score": 5,
            "comment": None,
            "tags": [],
            "created_at": datetime.utcnow(),
        })

        service = RatingService(mock_db)
        ratings = await service.get_ratings_for_transaction(str(txn_id))

        assert len(ratings) == 1
        assert ratings[0].score == 5

    @pytest.mark.asyncio
    async def test_get_ratings_for_transaction_none_exist(self, mock_db):
        service = RatingService(mock_db)
        ratings = await service.get_ratings_for_transaction(str(ObjectId()))

        assert ratings == []

    @pytest.mark.asyncio
    async def test_get_rating_count_correct(self, mock_db):
        user_id = str(ObjectId())
        for _ in range(3):
            await mock_db.ratings.insert_one({
                "_id": ObjectId(),
                "transaction_id": ObjectId(),
                "rater_id": ObjectId(),
                "rated_user_id": ObjectId(user_id),
                "score": 4,
                "comment": None,
                "tags": [],
                "created_at": datetime.utcnow(),
            })

        service = RatingService(mock_db)
        count = await service.get_rating_count(user_id)

        assert count == 3

    @pytest.mark.asyncio
    async def test_get_rating_count_zero_for_new_user(self, mock_db):
        service = RatingService(mock_db)
        count = await service.get_rating_count(str(ObjectId()))

        assert count == 0

    @pytest.mark.asyncio
    async def test_get_average_rating_correct(self, mock_db):
        user_id = str(ObjectId())
        for score in [3, 4, 5]:
            await mock_db.ratings.insert_one({
                "_id": ObjectId(),
                "transaction_id": ObjectId(),
                "rater_id": ObjectId(),
                "rated_user_id": ObjectId(user_id),
                "score": score,
                "comment": None,
                "tags": [],
                "created_at": datetime.utcnow(),
            })

        service = RatingService(mock_db)
        avg = await service.get_average_rating(user_id)

        assert avg == 4.0

    @pytest.mark.asyncio
    async def test_get_average_rating_none_for_unrated_user(self, mock_db):
        service = RatingService(mock_db)
        avg = await service.get_average_rating(str(ObjectId()))

        assert avg is None
