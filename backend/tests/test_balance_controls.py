"""
Tests for the 5-point balance control system.

Control points:
  CP1 - Create offer:        effective_max + hours > 10  → block
  CP2 - Create need:         effective_min - hours < 0   → block
  CP3 - JR to need:          effective_max + hours > 10  → block
  CP4 - JR to offer:         effective_min - hours < 0   → block
  CP5 - Approve need JR:     applicant effective_max >= 10 → block

Each class below covers one control point (blocking cases + happy-path cases)
plus helpers that verify the effective_max / effective_min calculations used
by those control points.
"""

import pytest
from bson import ObjectId
from datetime import datetime

from app.services.service_service import ServiceService
from app.services.join_request_service import JoinRequestService
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.models.service import ServiceCreate
from app.models.join_request import JoinRequestCreate, JoinRequestUpdate, JoinRequestStatus
from app.models.user import UserCreate, UserRole


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _make_user(mock_db, username="u", email="u@test.com", balance=3.0):
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
    # Adjust initial balance if needed (default is 3.0 in test fixtures)
    if balance != 3.0:
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": balance}},
        )
    return user


def _offer_data(hours: float = 2.0, title: str = "My offer") -> dict:
    return {
        "title": title,
        "description": "A long enough description for this service offer",
        "category": "tech",
        "tags": [],
        "estimated_duration": hours,
        "location": {"latitude": 41.0, "longitude": 29.0, "address": "Istanbul"},
        "service_type": "offer",
        "max_participants": 1,
    }


def _need_data(hours: float = 2.0, title: str = "My need") -> dict:
    return {
        "title": title,
        "description": "A long enough description for this service need",
        "category": "tech",
        "tags": [],
        "estimated_duration": hours,
        "location": {"latitude": 41.0, "longitude": 29.0, "address": "Istanbul"},
        "service_type": "need",
        "max_participants": 1,
    }


# ---------------------------------------------------------------------------
# Effective max / min balance calculations
# ---------------------------------------------------------------------------

class TestEffectiveMaxBalance:
    """Unit tests for the effective_max calculation components."""

    @pytest.mark.asyncio
    async def test_base_case_no_pending_activities(self, mock_db):
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 3.0

    @pytest.mark.asyncio
    async def test_own_active_offer_adds_to_max(self, mock_db):
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        # Insert an active offer (4 hours)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 4.0,
            "title": "My offer",
            "created_at": datetime.utcnow(),
        })
        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 7.0  # 3 + 4

    @pytest.mark.asyncio
    async def test_pending_jr_on_need_adds_to_max(self, mock_db):
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        # Create a need owned by owner (user will apply → earns hours)
        need_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 3.0,
            "title": "A need",
            "created_at": datetime.utcnow(),
        })).inserted_id

        # Pending join request from user to that need
        await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_id": ObjectId(str(need_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 6.0  # 3 + 3

    @pytest.mark.asyncio
    async def test_pending_jr_on_offer_does_not_add_to_max(self, mock_db):
        """Applying to an offer costs hours, so it should not increase max."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        offer_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 5.0,
            "title": "An offer",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_id": ObjectId(str(offer_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 3.0  # unchanged

    @pytest.mark.asyncio
    async def test_approved_need_application_tx_adds_to_max(self, mock_db):
        """An approved (pending tx) need application counts toward effective_max."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        need_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "need",
            "status": "in_progress",
            "estimated_duration": 2.0,
            "title": "A need",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.transactions.insert_one({
            "provider_id": ObjectId(str(user.id)),
            "requester_id": ObjectId(str(owner.id)),
            "service_id": ObjectId(str(need_id)),
            "timebank_hours": 2.0,
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 5.0  # 3 + 2

    @pytest.mark.asyncio
    async def test_completed_transaction_does_not_add_to_max(self, mock_db):
        """Completed transactions don't count — they're already reflected in balance."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=5.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        need_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "need",
            "status": "completed",
            "estimated_duration": 2.0,
            "title": "A need",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.transactions.insert_one({
            "provider_id": ObjectId(str(user.id)),
            "requester_id": ObjectId(str(owner.id)),
            "service_id": ObjectId(str(need_id)),
            "timebank_hours": 2.0,
            "status": "completed",  # already done
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_max_balance(str(user.id))
        assert result == 5.0  # only current balance


class TestEffectiveMinBalance:
    """Unit tests for the effective_min calculation components."""

    @pytest.mark.asyncio
    async def test_base_case_no_pending_activities(self, mock_db):
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        svc = UserService(mock_db)
        result = await svc.get_effective_min_balance(str(user.id))
        assert result == 3.0

    @pytest.mark.asyncio
    async def test_own_active_need_reduces_min(self, mock_db):
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "My need",
            "created_at": datetime.utcnow(),
        })
        svc = UserService(mock_db)
        result = await svc.get_effective_min_balance(str(user.id))
        assert result == 1.0  # 3 - 2

    @pytest.mark.asyncio
    async def test_pending_jr_on_offer_reduces_min(self, mock_db):
        """Applying to an offer costs hours, so it reduces effective_min."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        offer_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "An offer",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_id": ObjectId(str(offer_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_min_balance(str(user.id))
        assert result == 1.0  # 3 - 2

    @pytest.mark.asyncio
    async def test_pending_jr_on_need_does_not_reduce_min(self, mock_db):
        """Applying to a need earns hours, so it should not lower the min."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        need_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 4.0,
            "title": "A need",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_id": ObjectId(str(need_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_min_balance(str(user.id))
        assert result == 3.0  # unchanged

    @pytest.mark.asyncio
    async def test_approved_offer_application_tx_reduces_min(self, mock_db):
        """An approved offer-application transaction (pending tx) counts toward effective_min."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=5.0)
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)

        offer_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "offer",
            "status": "in_progress",
            "estimated_duration": 3.0,
            "title": "An offer",
            "created_at": datetime.utcnow(),
        })).inserted_id

        await mock_db.transactions.insert_one({
            "provider_id": ObjectId(str(owner.id)),
            "requester_id": ObjectId(str(user.id)),
            "service_id": ObjectId(str(offer_id)),
            "timebank_hours": 3.0,
            "status": "pending",
            "created_at": datetime.utcnow(),
        })

        svc = UserService(mock_db)
        result = await svc.get_effective_min_balance(str(user.id))
        assert result == 2.0  # 5 - 3


# ---------------------------------------------------------------------------
# CP1 — Create offer blocked when effective_max + hours > 10
# ---------------------------------------------------------------------------

class TestCP1CreateOffer:

    @pytest.mark.asyncio
    async def test_create_offer_allowed_when_max_within_limit(self, mock_db):
        """User with 7h balance can open a 3h offer (7 + 3 == 10, not > 10)."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=7.0)
        svc = ServiceService(mock_db)
        service = await svc.create_service(ServiceCreate(**_offer_data(3.0)), str(user.id))
        assert service is not None
        assert service.estimated_duration == 3.0

    @pytest.mark.asyncio
    async def test_create_offer_blocked_when_max_would_exceed_limit(self, mock_db):
        """User with 8h balance cannot open a 3h offer (8 + 3 > 10)."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=8.0)
        svc = ServiceService(mock_db)
        with pytest.raises(ValueError, match="10-hour limit"):
            await svc.create_service(ServiceCreate(**_offer_data(3.0)), str(user.id))

    @pytest.mark.asyncio
    async def test_create_offer_blocked_when_existing_active_offer_pushes_max_over(self, mock_db):
        """
        Balance=3h + existing 6h active offer → effective_max=9h.
        New 2h offer would push it to 11h → block.
        """
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 6.0,
            "title": "Existing offer",
            "created_at": datetime.utcnow(),
        })
        svc = ServiceService(mock_db)
        with pytest.raises(ValueError, match="10-hour limit"):
            await svc.create_service(ServiceCreate(**_offer_data(2.0)), str(user.id))

    @pytest.mark.asyncio
    async def test_create_offer_allowed_when_existing_offer_still_within_limit(self, mock_db):
        """
        Balance=3h + existing 4h active offer → effective_max=7h.
        New 2h offer → projected 9h ≤ 10h → allowed.
        """
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 4.0,
            "title": "Existing offer",
            "created_at": datetime.utcnow(),
        })
        svc = ServiceService(mock_db)
        service = await svc.create_service(ServiceCreate(**_offer_data(2.0)), str(user.id))
        assert service is not None


# ---------------------------------------------------------------------------
# CP2 — Create need blocked when effective_min - hours < 0
# ---------------------------------------------------------------------------

class TestCP2CreateNeed:

    @pytest.mark.asyncio
    async def test_create_need_allowed_when_min_stays_non_negative(self, mock_db):
        """User with 3h balance can open a 3h need (3 - 3 == 0, not < 0)."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        svc = ServiceService(mock_db)
        service = await svc.create_service(ServiceCreate(**_need_data(3.0)), str(user.id))
        assert service is not None

    @pytest.mark.asyncio
    async def test_create_need_blocked_when_min_would_go_negative(self, mock_db):
        """User with 2h balance cannot open a 3h need (2 - 3 < 0)."""
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=2.0)
        svc = ServiceService(mock_db)
        with pytest.raises(ValueError, match="projected minimum balance"):
            await svc.create_service(ServiceCreate(**_need_data(3.0)), str(user.id))

    @pytest.mark.asyncio
    async def test_create_need_blocked_when_existing_need_pushes_min_negative(self, mock_db):
        """
        Balance=3h + existing 2h active need → effective_min=1h.
        New 2h need → projected -1h < 0 → block.
        """
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=3.0)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "Existing need",
            "created_at": datetime.utcnow(),
        })
        svc = ServiceService(mock_db)
        with pytest.raises(ValueError, match="projected minimum balance"):
            await svc.create_service(ServiceCreate(**_need_data(2.0)), str(user.id))

    @pytest.mark.asyncio
    async def test_create_need_allowed_when_existing_need_still_leaves_room(self, mock_db):
        """
        Balance=5h + existing 2h active need → effective_min=3h.
        New 2h need → projected 1h ≥ 0 → allowed.
        """
        user = await _make_user(mock_db, "u1", "u1@test.com", balance=5.0)
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "Existing need",
            "created_at": datetime.utcnow(),
        })
        svc = ServiceService(mock_db)
        service = await svc.create_service(ServiceCreate(**_need_data(2.0)), str(user.id))
        assert service is not None


# ---------------------------------------------------------------------------
# CP3 — Join request to a need blocked when effective_max + hours > 10
# ---------------------------------------------------------------------------

class TestCP3JoinRequestToNeed:

    @pytest.mark.asyncio
    async def test_join_need_allowed_when_max_within_limit(self, mock_db):
        """Applicant with 5h balance applies to a 4h need → projected 9h ≤ 10h → OK."""
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=5.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        svc = ServiceService(mock_db)
        need = await svc.create_service(ServiceCreate(**_need_data(4.0, "Help needed")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        jr = await jr_svc.create_join_request(
            JoinRequestCreate(service_id=str(need.id), message="I can help"),
            str(applicant.id),
        )
        assert jr is not None
        assert jr.status == JoinRequestStatus.PENDING

    @pytest.mark.asyncio
    async def test_join_need_blocked_when_max_would_exceed_limit(self, mock_db):
        """Applicant with 8h balance cannot apply to a 3h need (8 + 3 > 10)."""
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=8.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        svc = ServiceService(mock_db)
        need = await svc.create_service(ServiceCreate(**_need_data(3.0, "Help needed")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="projected maximum balance"):
            await jr_svc.create_join_request(
                JoinRequestCreate(service_id=str(need.id), message="I can help"),
                str(applicant.id),
            )

    @pytest.mark.asyncio
    async def test_join_need_blocked_when_pending_offers_push_max_over(self, mock_db):
        """
        Balance=3h + existing 6h active offer → effective_max=9h.
        Applying to a 2h need → projected 11h > 10 → block.
        """
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=3.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        # Applicant already has a 6h active offer
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 6.0,
            "title": "My offer",
            "created_at": datetime.utcnow(),
        })

        svc = ServiceService(mock_db)
        need = await svc.create_service(ServiceCreate(**_need_data(2.0, "Need help")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="projected maximum balance"):
            await jr_svc.create_join_request(
                JoinRequestCreate(service_id=str(need.id), message="I can help"),
                str(applicant.id),
            )

    @pytest.mark.asyncio
    async def test_join_need_allowed_when_projected_max_exactly_10(self, mock_db):
        """Projected max == 10 is allowed (not strictly greater)."""
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=6.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        svc = ServiceService(mock_db)
        need = await svc.create_service(ServiceCreate(**_need_data(4.0, "Need help")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        jr = await jr_svc.create_join_request(
            JoinRequestCreate(service_id=str(need.id), message="I can help"),
            str(applicant.id),
        )
        assert jr is not None


# ---------------------------------------------------------------------------
# CP4 — Join request to an offer blocked when effective_min - hours < 0
# ---------------------------------------------------------------------------

class TestCP4JoinRequestToOffer:

    @pytest.mark.asyncio
    async def test_join_offer_allowed_when_min_stays_non_negative(self, mock_db):
        """Applicant with 4h balance applies to a 4h offer → projected 0h ≥ 0 → OK."""
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=4.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        svc = ServiceService(mock_db)
        offer = await svc.create_service(ServiceCreate(**_offer_data(4.0, "I can help")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        jr = await jr_svc.create_join_request(
            JoinRequestCreate(service_id=str(offer.id), message="I need help"),
            str(applicant.id),
        )
        assert jr is not None
        assert jr.status == JoinRequestStatus.PENDING

    @pytest.mark.asyncio
    async def test_join_offer_blocked_when_min_would_go_negative(self, mock_db):
        """Applicant with 2h balance cannot apply to a 3h offer (2 - 3 < 0)."""
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=2.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        svc = ServiceService(mock_db)
        offer = await svc.create_service(ServiceCreate(**_offer_data(3.0, "I can help")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="projected minimum balance"):
            await jr_svc.create_join_request(
                JoinRequestCreate(service_id=str(offer.id), message="I need help"),
                str(applicant.id),
            )

    @pytest.mark.asyncio
    async def test_join_offer_blocked_when_existing_need_pushes_min_negative(self, mock_db):
        """
        Balance=3h + existing 2h active need → effective_min=1h.
        Applying to a 2h offer → projected -1h < 0 → block.
        """
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=3.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=3.0)

        # Applicant already has a 2h active need
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "My need",
            "created_at": datetime.utcnow(),
        })

        svc = ServiceService(mock_db)
        offer = await svc.create_service(ServiceCreate(**_offer_data(2.0, "I can help")), str(owner.id))

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="projected minimum balance"):
            await jr_svc.create_join_request(
                JoinRequestCreate(service_id=str(offer.id), message="I need help"),
                str(applicant.id),
            )

    @pytest.mark.asyncio
    async def test_join_offer_blocked_when_provider_at_surplus_limit(self, mock_db):
        """
        Even when applicant has enough balance, if the provider's effective_max
        is at the limit (and they have no needs), the request is blocked.
        """
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=5.0)
        owner = await _make_user(mock_db, "ow", "ow@test.com", balance=10.0)  # at the cap

        svc = ServiceService(mock_db)
        # Owner cannot create a new offer (effective_max already at 10),
        # so we insert directly for test purposes
        offer_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "I can help",
            "description": "A long enough description for this service offer",
            "category": "tech",
            "tags": [],
            "created_at": datetime.utcnow(),
            "matched_user_ids": [],
            "max_participants": 1,
        })).inserted_id

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="surplus limit"):
            await jr_svc.create_join_request(
                JoinRequestCreate(service_id=str(offer_id), message="I need help"),
                str(applicant.id),
            )


# ---------------------------------------------------------------------------
# CP5 — Approve a need's join request blocked when applicant effective_max >= 10
# ---------------------------------------------------------------------------

class TestCP5ApproveNeedJoinRequest:

    async def _setup_need_and_jr(self, mock_db, applicant_balance: float):
        """
        Helper: owner has a need; applicant submits a join request.
        Returns (owner, applicant, need_id, jr_id).
        """
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=applicant_balance)

        need_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "Need help",
            "description": "Description",
            "max_participants": 5,
            "matched_user_ids": [],
            "created_at": datetime.utcnow(),
        })).inserted_id

        jr_id = (await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_id": ObjectId(str(need_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })).inserted_id

        return owner, applicant, need_id, jr_id

    @pytest.mark.asyncio
    async def test_approve_need_jr_allowed_when_applicant_max_under_limit(self, mock_db):
        """Applicant with 7h effective_max can be approved (7 < 10)."""
        owner, applicant, need_id, jr_id = await self._setup_need_and_jr(mock_db, 7.0)

        jr_svc = JoinRequestService(mock_db)
        result = await jr_svc.update_request_status(
            str(jr_id),
            JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
            str(owner.id),
        )
        assert result.status == JoinRequestStatus.APPROVED

    @pytest.mark.asyncio
    async def test_approve_need_jr_blocked_when_applicant_max_equals_10(self, mock_db):
        """Applicant with exactly 10h balance (effective_max == 10) cannot be approved."""
        owner, applicant, need_id, jr_id = await self._setup_need_and_jr(mock_db, 10.0)

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="10-hour limit"):
            await jr_svc.update_request_status(
                str(jr_id),
                JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
                str(owner.id),
            )

    @pytest.mark.asyncio
    async def test_approve_need_jr_blocked_when_applicant_max_above_10(self, mock_db):
        """
        Applicant has 8h balance + a 3h active offer → effective_max=11h.
        Approval should be blocked.
        """
        owner, applicant, need_id, jr_id = await self._setup_need_and_jr(mock_db, 8.0)

        # Give applicant an active offer that pushes their max over 10
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 3.0,
            "title": "Applicant offer",
            "created_at": datetime.utcnow(),
        })

        jr_svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="10-hour limit"):
            await jr_svc.update_request_status(
                str(jr_id),
                JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
                str(owner.id),
            )

    @pytest.mark.asyncio
    async def test_approve_need_jr_blocked_even_when_applicant_has_existing_need(self, mock_db):
        """
        Key regression: applicant's effective_max >= 10 should block approval
        even if they already have a need (the old buggy code used requires_need_creation
        which would not block in this case).
        """
        owner, applicant, need_id, jr_id = await self._setup_need_and_jr(mock_db, 9.0)

        # Applicant already has a need — old code would NOT block here
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_type": "need",
            "status": "active",
            "estimated_duration": 1.0,
            "title": "Applicant need",
            "created_at": datetime.utcnow(),
        })

        # And an active offer pushing effective_max to 9 + 2 = 11
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "Applicant offer",
            "created_at": datetime.utcnow(),
        })

        jr_svc = JoinRequestService(mock_db)
        # Should still block because effective_max (11) >= 10, regardless of existing need
        with pytest.raises(ValueError, match="10-hour limit"):
            await jr_svc.update_request_status(
                str(jr_id),
                JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
                str(owner.id),
            )

    @pytest.mark.asyncio
    async def test_approve_offer_jr_checks_provider_not_applicant(self, mock_db):
        """
        When approving a join request on an OFFER, the constraint is on the
        service owner (provider) — not on the applicant.
        Applicant here has 10h balance but is the requester (spender), not the earner.
        """
        owner = await _make_user(mock_db, "owner", "owner@test.com", balance=3.0)
        applicant = await _make_user(mock_db, "ap", "ap@test.com", balance=10.0)

        offer_id = (await mock_db.services.insert_one({
            "user_id": ObjectId(str(owner.id)),
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "title": "I can help",
            "description": "Description",
            "max_participants": 5,
            "matched_user_ids": [],
            "created_at": datetime.utcnow(),
        })).inserted_id

        jr_id = (await mock_db.join_requests.insert_one({
            "user_id": ObjectId(str(applicant.id)),
            "service_id": ObjectId(str(offer_id)),
            "status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })).inserted_id

        jr_svc = JoinRequestService(mock_db)
        # Owner has 3h balance so requires_need_creation is False → should succeed
        result = await jr_svc.update_request_status(
            str(jr_id),
            JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
            str(owner.id),
        )
        assert result.status == JoinRequestStatus.APPROVED
