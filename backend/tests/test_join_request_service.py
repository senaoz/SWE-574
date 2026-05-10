import pytest
from bson import ObjectId
from datetime import datetime

from app.services.join_request_service import JoinRequestService
from app.models.join_request import JoinRequestCreate, JoinRequestUpdate, JoinRequestStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user_doc(user_id, username="user", timebank_balance=5.0):
    return {
        "_id": ObjectId(user_id),
        "username": username,
        "full_name": f"{username} full",
        "bio": None,
        "email": f"{username}@example.com",
        "password_hash": "hash",
        "is_active": True,
        "is_verified": True,
        "role": "user",
        "timebank_balance": timebank_balance,
        "profile_visible": True,
        "show_email": False,
        "show_location": True,
        "email_notifications": True,
        "service_matches_notifications": True,
        "messages_notifications": True,
        "interests": [],
        "social_links": None,
        "profile_picture": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_service_doc(owner_id, service_type="offer", status="active",
                     estimated_duration=2.0, max_participants=10, title="Test Service"):
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(owner_id),
        "title": title,
        "description": "A test service",
        "category": "test",
        "tags": [],
        "service_type": service_type,
        "status": status,
        "estimated_duration": estimated_duration,
        "max_participants": max_participants,
        "matched_user_ids": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


def make_join_request_doc(service_id, user_id, status=JoinRequestStatus.PENDING):
    return {
        "_id": ObjectId(),
        "service_id": ObjectId(service_id),
        "user_id": ObjectId(user_id),
        "message": "Please let me join",
        "status": status,
        "admin_message": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ---------------------------------------------------------------------------
# create_join_request
# ---------------------------------------------------------------------------

class TestCreateJoinRequest:

    @pytest.mark.asyncio
    async def test_happy_path_offer_service(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        service = make_service_doc(owner_id, service_type="offer", estimated_duration=2.0)
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner", timebank_balance=3.0))
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant", timebank_balance=5.0))

        svc = JoinRequestService(mock_db)
        request = await svc.create_join_request(
            JoinRequestCreate(service_id=str(service["_id"]), message="Hi"),
            applicant_id,
        )

        assert request.status == JoinRequestStatus.PENDING
        assert request.service_id == str(service["_id"])
        assert request.user_id == applicant_id

    @pytest.mark.asyncio
    async def test_happy_path_need_service(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        service = make_service_doc(owner_id, service_type="need", estimated_duration=2.0)
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner", timebank_balance=3.0))
        # applicant will earn 2 hrs; current balance 3.0 → projected max 5.0 < 10
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant", timebank_balance=3.0))

        svc = JoinRequestService(mock_db)
        request = await svc.create_join_request(
            JoinRequestCreate(service_id=str(service["_id"])),
            applicant_id,
        )

        assert request.status == JoinRequestStatus.PENDING

    @pytest.mark.asyncio
    async def test_service_not_found(self, mock_db):
        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="Service not found"):
            await svc.create_join_request(
                JoinRequestCreate(service_id=str(ObjectId())),
                str(ObjectId()),
            )

    @pytest.mark.asyncio
    async def test_duplicate_request_rejected(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        service = make_service_doc(owner_id, service_type="offer")
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner", timebank_balance=3.0))
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant", timebank_balance=5.0))
        # pre-insert a pending request
        await mock_db.join_requests.insert_one(
            make_join_request_doc(str(service["_id"]), applicant_id)
        )

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="already have a pending request"):
            await svc.create_join_request(
                JoinRequestCreate(service_id=str(service["_id"])),
                applicant_id,
            )

    @pytest.mark.asyncio
    async def test_own_service_rejected(self, mock_db):
        owner_id = str(ObjectId())
        service = make_service_doc(owner_id, service_type="offer")
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner"))

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="Cannot request to join your own service"):
            await svc.create_join_request(
                JoinRequestCreate(service_id=str(service["_id"])),
                owner_id,
            )


# ---------------------------------------------------------------------------
# get_requests_by_service
# ---------------------------------------------------------------------------

class TestGetRequestsByService:

    @pytest.mark.asyncio
    async def test_returns_requests(self, mock_db):
        owner_id = str(ObjectId())
        service = make_service_doc(owner_id)
        await mock_db.services.insert_one(service)
        applicant_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant"))
        await mock_db.join_requests.insert_one(
            make_join_request_doc(str(service["_id"]), applicant_id)
        )

        svc = JoinRequestService(mock_db)
        requests, total = await svc.get_requests_by_service(str(service["_id"]))

        assert total == 1
        assert len(requests) == 1
        assert requests[0].service_id == str(service["_id"])

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        owner_id = str(ObjectId())
        service = make_service_doc(owner_id)
        await mock_db.services.insert_one(service)
        for i in range(5):
            uid = str(ObjectId())
            await mock_db.users.insert_one(make_user_doc(uid, f"user{i}"))
            await mock_db.join_requests.insert_one(
                make_join_request_doc(str(service["_id"]), uid)
            )

        svc = JoinRequestService(mock_db)
        requests, total = await svc.get_requests_by_service(str(service["_id"]), page=1, limit=2)

        assert total == 5
        assert len(requests) == 2


# ---------------------------------------------------------------------------
# get_user_requests
# ---------------------------------------------------------------------------

class TestGetUserRequests:

    @pytest.mark.asyncio
    async def test_returns_requests(self, mock_db):
        user_id = str(ObjectId())
        service = make_service_doc(str(ObjectId()))
        await mock_db.services.insert_one(service)
        await mock_db.join_requests.insert_one(
            make_join_request_doc(str(service["_id"]), user_id)
        )

        svc = JoinRequestService(mock_db)
        requests, total = await svc.get_user_requests(user_id)

        assert total == 1
        assert requests[0].user_id == user_id

    @pytest.mark.asyncio
    async def test_status_filter(self, mock_db):
        user_id = str(ObjectId())
        service = make_service_doc(str(ObjectId()))
        await mock_db.services.insert_one(service)
        await mock_db.join_requests.insert_one(
            make_join_request_doc(str(service["_id"]), user_id, status=JoinRequestStatus.PENDING)
        )
        await mock_db.join_requests.insert_one(
            make_join_request_doc(str(service["_id"]), user_id, status=JoinRequestStatus.APPROVED)
        )

        svc = JoinRequestService(mock_db)
        requests, total = await svc.get_user_requests(user_id, status_filter="pending")

        assert total == 1
        assert requests[0].status == JoinRequestStatus.PENDING

    @pytest.mark.asyncio
    async def test_pagination(self, mock_db):
        user_id = str(ObjectId())
        for i in range(4):
            service = make_service_doc(str(ObjectId()))
            await mock_db.services.insert_one(service)
            await mock_db.join_requests.insert_one(
                make_join_request_doc(str(service["_id"]), user_id)
            )

        svc = JoinRequestService(mock_db)
        requests, total = await svc.get_user_requests(user_id, page=1, limit=2)

        assert total == 4
        assert len(requests) == 2


# ---------------------------------------------------------------------------
# get_request_by_id
# ---------------------------------------------------------------------------

class TestGetRequestById:

    @pytest.mark.asyncio
    async def test_happy_path(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "user"))
        jr = make_join_request_doc(service_id, user_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.get_request_by_id(str(jr["_id"]))

        assert result is not None
        assert result.user_id == user_id

    @pytest.mark.asyncio
    async def test_nonexistent_returns_none(self, mock_db):
        svc = JoinRequestService(mock_db)
        result = await svc.get_request_by_id(str(ObjectId()))

        assert result is None


# ---------------------------------------------------------------------------
# update_request_status (approve / reject)
# ---------------------------------------------------------------------------

class TestUpdateRequestStatus:

    @pytest.mark.asyncio
    async def test_owner_rejects_request(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        service = make_service_doc(owner_id, service_type="offer", status="active")
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner"))
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant"))
        jr = make_join_request_doc(str(service["_id"]), applicant_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.update_request_status(
            str(jr["_id"]),
            JoinRequestUpdate(status=JoinRequestStatus.REJECTED, admin_message="Not a fit"),
            owner_id,
        )

        assert result.status == JoinRequestStatus.REJECTED
        assert result.admin_message == "Not a fit"

    @pytest.mark.asyncio
    async def test_owner_approves_request_and_creates_transaction(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        service = make_service_doc(
            owner_id, service_type="offer", status="active", estimated_duration=2.0
        )
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner", timebank_balance=3.0))
        await mock_db.users.insert_one(make_user_doc(applicant_id, "applicant", timebank_balance=5.0))
        jr = make_join_request_doc(str(service["_id"]), applicant_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.update_request_status(
            str(jr["_id"]),
            JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
            owner_id,
        )

        assert result.status == JoinRequestStatus.APPROVED

        # Verify transaction was created
        transaction = await mock_db.transactions.find_one({
            "service_id": service["_id"],
        })
        assert transaction is not None
        assert str(transaction["provider_id"]) == owner_id
        assert str(transaction["requester_id"]) == applicant_id
        assert transaction["timebank_hours"] == 2.0

    @pytest.mark.asyncio
    async def test_non_owner_cannot_approve(self, mock_db):
        owner_id = str(ObjectId())
        applicant_id = str(ObjectId())
        intruder_id = str(ObjectId())
        service = make_service_doc(owner_id)
        await mock_db.services.insert_one(service)
        jr = make_join_request_doc(str(service["_id"]), applicant_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="Only the service owner"):
            await svc.update_request_status(
                str(jr["_id"]),
                JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
                intruder_id,
            )

    @pytest.mark.asyncio
    async def test_request_not_found(self, mock_db):
        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="Join request not found"):
            await svc.update_request_status(
                str(ObjectId()),
                JoinRequestUpdate(status=JoinRequestStatus.REJECTED),
                str(ObjectId()),
            )

    @pytest.mark.asyncio
    async def test_max_participants_limit_enforced(self, mock_db):
        owner_id = str(ObjectId())
        service = make_service_doc(owner_id, max_participants=1, status="active")
        await mock_db.services.insert_one(service)
        await mock_db.users.insert_one(make_user_doc(owner_id, "owner", timebank_balance=3.0))

        # Approve first applicant through the service so status is stored in production format
        applicant1_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(applicant1_id, "applicant1", timebank_balance=5.0))
        jr1 = make_join_request_doc(str(service["_id"]), applicant1_id)
        await mock_db.join_requests.insert_one(jr1)

        svc = JoinRequestService(mock_db)
        await svc.update_request_status(
            str(jr1["_id"]),
            JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
            owner_id,
        )

        # Second applicant — should be blocked because slot is full
        applicant2_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(applicant2_id, "applicant2", timebank_balance=5.0))
        jr2 = make_join_request_doc(str(service["_id"]), applicant2_id)
        await mock_db.join_requests.insert_one(jr2)

        with pytest.raises(ValueError, match="maximum participants limit"):
            await svc.update_request_status(
                str(jr2["_id"]),
                JoinRequestUpdate(status=JoinRequestStatus.APPROVED),
                owner_id,
            )


# ---------------------------------------------------------------------------
# cancel_user_request
# ---------------------------------------------------------------------------

class TestCancelUserRequest:

    @pytest.mark.asyncio
    async def test_requester_cancels_pending(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "user"))
        jr = make_join_request_doc(service_id, user_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.cancel_user_request(str(jr["_id"]), user_id)

        assert result.status == JoinRequestStatus.CANCELLED

    @pytest.mark.asyncio
    async def test_non_requester_rejected(self, mock_db):
        user_id = str(ObjectId())
        intruder_id = str(ObjectId())
        service_id = str(ObjectId())
        jr = make_join_request_doc(service_id, user_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="only cancel your own"):
            await svc.cancel_user_request(str(jr["_id"]), intruder_id)

    @pytest.mark.asyncio
    async def test_already_cancelled_rejected(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        jr = make_join_request_doc(service_id, user_id, status=JoinRequestStatus.CANCELLED)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="already cancelled"):
            await svc.cancel_user_request(str(jr["_id"]), user_id)

    @pytest.mark.asyncio
    async def test_approved_request_cannot_be_cancelled(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        jr = make_join_request_doc(service_id, user_id, status=JoinRequestStatus.APPROVED)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        with pytest.raises(ValueError, match="only cancel pending"):
            await svc.cancel_user_request(str(jr["_id"]), user_id)


# ---------------------------------------------------------------------------
# get_pending_request_for_service
# ---------------------------------------------------------------------------

class TestGetPendingRequestForService:

    @pytest.mark.asyncio
    async def test_returns_pending_request(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        await mock_db.users.insert_one(make_user_doc(user_id, "user"))
        jr = make_join_request_doc(service_id, user_id)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.get_pending_request_for_service(service_id, user_id)

        assert result is not None
        assert result.status == JoinRequestStatus.PENDING

    @pytest.mark.asyncio
    async def test_returns_none_when_no_pending(self, mock_db):
        svc = JoinRequestService(mock_db)
        result = await svc.get_pending_request_for_service(str(ObjectId()), str(ObjectId()))

        assert result is None

    @pytest.mark.asyncio
    async def test_approved_request_not_returned(self, mock_db):
        user_id = str(ObjectId())
        service_id = str(ObjectId())
        jr = make_join_request_doc(service_id, user_id, status=JoinRequestStatus.APPROVED)
        await mock_db.join_requests.insert_one(jr)

        svc = JoinRequestService(mock_db)
        result = await svc.get_pending_request_for_service(service_id, user_id)

        assert result is None


# ---------------------------------------------------------------------------
# reject_pending_requests_for_service
# ---------------------------------------------------------------------------

class TestRejectPendingRequestsForService:

    @pytest.mark.asyncio
    async def test_rejects_all_pending(self, mock_db):
        service_id = str(ObjectId())
        for _ in range(3):
            uid = str(ObjectId())
            await mock_db.join_requests.insert_one(
                make_join_request_doc(service_id, uid)
            )

        svc = JoinRequestService(mock_db)
        count = await svc.reject_pending_requests_for_service(service_id)

        assert count == 3
        remaining = await mock_db.join_requests.count_documents(
            {"service_id": ObjectId(service_id), "status": JoinRequestStatus.PENDING}
        )
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_no_pending_is_noop(self, mock_db):
        svc = JoinRequestService(mock_db)
        count = await svc.reject_pending_requests_for_service(str(ObjectId()))

        assert count == 0

    @pytest.mark.asyncio
    async def test_custom_reason_stored(self, mock_db):
        service_id = str(ObjectId())
        uid = str(ObjectId())
        await mock_db.join_requests.insert_one(make_join_request_doc(service_id, uid))

        svc = JoinRequestService(mock_db)
        await svc.reject_pending_requests_for_service(service_id, reason="Service cancelled")

        doc = await mock_db.join_requests.find_one({"service_id": ObjectId(service_id)})
        assert doc["admin_message"] == "Service cancelled"
        assert doc["status"] == JoinRequestStatus.REJECTED
