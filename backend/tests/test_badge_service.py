import pytest
from bson import ObjectId
from datetime import datetime

from app.services.badge_service import BadgeService, BADGE_DEFINITIONS
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserRole


async def _make_user(mock_db, username="badgeuser", email="badge@test.com", **overrides):
    auth = AuthService(mock_db)
    user = await auth.create_user(UserCreate(
        username=username,
        email=email,
        password="testpassword123",
        confirm_password="testpassword123",
        full_name=username.title(),
        bio="bio",
        location="Istanbul",
        role=UserRole.USER,
        profile_visible=True,
        show_email=False,
        show_location=True,
        email_notifications=True,
        service_matches_notifications=True,
        messages_notifications=True,
    ))
    if overrides:
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": overrides},
        )
    return user


async def _add_completed_transactions(mock_db, user_id, count, as_provider=True, hours=2.0):
    for i in range(count):
        other_id = ObjectId()
        doc = {
            "provider_id": ObjectId(user_id) if as_provider else other_id,
            "requester_id": other_id if as_provider else ObjectId(user_id),
            "status": "completed",
            "timebank_hours": hours,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await mock_db.transactions.insert_one(doc)


async def _add_ratings(mock_db, user_id, count):
    for i in range(count):
        await mock_db.ratings.insert_one({
            "rated_user_id": ObjectId(user_id),
            "rater_id": ObjectId(),
            "score": 5,
            "created_at": datetime.utcnow(),
        })


class TestComputeMetrics:

    @pytest.mark.asyncio
    async def test_new_user_metrics(self, mock_db):
        user = await _make_user(mock_db)
        svc = BadgeService(mock_db)
        user_doc = await mock_db.users.find_one({"_id": ObjectId(str(user.id))})
        metrics = await svc._compute_metrics(str(user.id), user_doc)

        assert metrics["always"] == 1
        assert metrics["exchange_count"] == 0
        assert metrics["rating_count"] == 0
        assert metrics["contributed_hours"] == 0.0
        assert metrics["profile_tags_count"] == 0
        assert metrics["has_profile_picture"] == 0

    @pytest.mark.asyncio
    async def test_metrics_with_exchanges(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 3, as_provider=True, hours=2.0)
        await _add_completed_transactions(mock_db, uid, 2, as_provider=False, hours=1.0)

        svc = BadgeService(mock_db)
        user_doc = await mock_db.users.find_one({"_id": ObjectId(uid)})
        metrics = await svc._compute_metrics(uid, user_doc)

        assert metrics["exchange_count"] == 5
        assert metrics["contributed_hours"] == 6.0

    @pytest.mark.asyncio
    async def test_metrics_with_ratings(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_ratings(mock_db, uid, 7)

        svc = BadgeService(mock_db)
        user_doc = await mock_db.users.find_one({"_id": ObjectId(uid)})
        metrics = await svc._compute_metrics(uid, user_doc)
        assert metrics["rating_count"] == 7

    @pytest.mark.asyncio
    async def test_metrics_with_profile_picture(self, mock_db):
        user = await _make_user(mock_db, profile_picture="https://example.com/pic.jpg")
        svc = BadgeService(mock_db)
        user_doc = await mock_db.users.find_one({"_id": ObjectId(str(user.id))})
        metrics = await svc._compute_metrics(str(user.id), user_doc)
        assert metrics["has_profile_picture"] == 1

    @pytest.mark.asyncio
    async def test_metrics_with_interests(self, mock_db):
        user = await _make_user(mock_db, interests=["python", "music", "cooking"])
        svc = BadgeService(mock_db)
        user_doc = await mock_db.users.find_one({"_id": ObjectId(str(user.id))})
        metrics = await svc._compute_metrics(str(user.id), user_doc)
        assert metrics["profile_tags_count"] == 3


class TestEvaluateBadges:

    @pytest.mark.asyncio
    async def test_new_user_earns_newcomer_only(self, mock_db):
        user = await _make_user(mock_db)
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))

        earned = [b for b in badges if b["earned"]]
        assert len(earned) == 1
        assert earned[0]["key"] == "newcomer"

    @pytest.mark.asyncio
    async def test_all_badge_definitions_present(self, mock_db):
        user = await _make_user(mock_db)
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))
        assert len(badges) == len(BADGE_DEFINITIONS)
        keys = {b["key"] for b in badges}
        expected_keys = {d["key"] for d in BADGE_DEFINITIONS}
        assert keys == expected_keys

    @pytest.mark.asyncio
    async def test_badge_progress_tracking(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 3)

        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(uid)

        first_exchange = next(b for b in badges if b["key"] == "first_exchange")
        assert first_exchange["earned"] is True
        assert first_exchange["progress"]["current"] == 1
        assert first_exchange["progress"]["target"] == 1

        helper = next(b for b in badges if b["key"] == "helper")
        assert helper["earned"] is False
        assert helper["progress"]["current"] == 3
        assert helper["progress"]["target"] == 5

    @pytest.mark.asyncio
    async def test_profile_complete_badge(self, mock_db):
        user = await _make_user(mock_db, profile_picture="https://example.com/pic.jpg")
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))
        profile = next(b for b in badges if b["key"] == "profile_complete")
        assert profile["earned"] is True

    @pytest.mark.asyncio
    async def test_profile_complete_badge_not_earned(self, mock_db):
        user = await _make_user(mock_db)
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))
        profile = next(b for b in badges if b["key"] == "profile_complete")
        assert profile["earned"] is False

    @pytest.mark.asyncio
    async def test_tagged_badges(self, mock_db):
        user = await _make_user(
            mock_db, interests=["a", "b", "c", "d", "e"]
        )
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))

        tagged = next(b for b in badges if b["key"] == "tagged")
        assert tagged["earned"] is True

        well_tagged = next(b for b in badges if b["key"] == "well_tagged")
        assert well_tagged["earned"] is True

    @pytest.mark.asyncio
    async def test_tagged_badge_boundary(self, mock_db):
        user = await _make_user(mock_db, interests=["a", "b", "c", "d"])
        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(str(user.id))

        tagged = next(b for b in badges if b["key"] == "tagged")
        assert tagged["earned"] is True

        well_tagged = next(b for b in badges if b["key"] == "well_tagged")
        assert well_tagged["earned"] is False

    @pytest.mark.asyncio
    async def test_rating_badges_progression(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_ratings(mock_db, uid, 10)

        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(uid)

        rated = next(b for b in badges if b["key"] == "rated")
        assert rated["earned"] is True

        popular = next(b for b in badges if b["key"] == "popular")
        assert popular["earned"] is True

        community_fav = next(b for b in badges if b["key"] == "community_favorite")
        assert community_fav["earned"] is True

    @pytest.mark.asyncio
    async def test_exchange_badges_progression(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 25)

        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(uid)

        for key in ("first_exchange", "helper", "helper_hero", "master_helper"):
            badge = next(b for b in badges if b["key"] == key)
            assert badge["earned"] is True, f"{key} should be earned with 25 exchanges"

    @pytest.mark.asyncio
    async def test_generous_giver_badge(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 10, as_provider=True, hours=5.0)

        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(uid)

        giver = next(b for b in badges if b["key"] == "generous_giver")
        assert giver["earned"] is True

    @pytest.mark.asyncio
    async def test_generous_giver_not_earned(self, mock_db):
        user = await _make_user(mock_db)
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 5, as_provider=True, hours=2.0)

        svc = BadgeService(mock_db)
        badges = await svc.evaluate_badges(uid)

        giver = next(b for b in badges if b["key"] == "generous_giver")
        assert giver["earned"] is False
        assert giver["progress"]["current"] == 10
        assert giver["progress"]["target"] == 50

    @pytest.mark.asyncio
    async def test_evaluate_badges_nonexistent_user(self, mock_db):
        svc = BadgeService(mock_db)
        with pytest.raises(ValueError, match="User not found"):
            await svc.evaluate_badges(str(ObjectId()))


class TestGetBadgeSummary:

    @pytest.mark.asyncio
    async def test_summary_new_user(self, mock_db):
        user = await _make_user(mock_db)
        svc = BadgeService(mock_db)
        summary = await svc.get_badge_summary(str(user.id))

        assert summary["total_count"] == len(BADGE_DEFINITIONS)
        assert summary["earned_count"] == 1
        assert len(summary["badges"]) == len(BADGE_DEFINITIONS)

    @pytest.mark.asyncio
    async def test_summary_active_user(self, mock_db):
        user = await _make_user(
            mock_db,
            profile_picture="https://example.com/pic.jpg",
            interests=["a", "b", "c", "d", "e"],
        )
        uid = str(user.id)
        await _add_completed_transactions(mock_db, uid, 5)
        await _add_ratings(mock_db, uid, 5)

        svc = BadgeService(mock_db)
        summary = await svc.get_badge_summary(uid)

        earned_keys = {b["key"] for b in summary["badges"] if b["earned"]}
        assert "newcomer" in earned_keys
        assert "profile_complete" in earned_keys
        assert "tagged" in earned_keys
        assert "well_tagged" in earned_keys
        assert "first_exchange" in earned_keys
        assert "helper" in earned_keys
        assert "rated" in earned_keys
        assert "popular" in earned_keys
        assert summary["earned_count"] == len(earned_keys)

    @pytest.mark.asyncio
    async def test_summary_nonexistent_user(self, mock_db):
        svc = BadgeService(mock_db)
        with pytest.raises(ValueError, match="User not found"):
            await svc.get_badge_summary(str(ObjectId()))
