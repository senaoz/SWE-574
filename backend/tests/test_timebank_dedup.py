"""
Tests for duplicate TimeBank balance update prevention.

Covers:
- Service-path completion does not double-credit when transactions are already completed
- Transaction-path completion does not double-credit when service is already completed
- Multi-receiver services credit the provider exactly once via the transaction path
"""

import pytest
from datetime import datetime
from bson import ObjectId

from app.services.service_service import ServiceService
from app.services.transaction_service import TransactionService
from app.services.user_service import UserService
from app.models.service import ServiceCreate, ServiceStatus
from app.models.transaction import TransactionCreate, TransactionStatus


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

async def _create_user(mock_db, username, balance=3.0):
    from app.services.auth_service import AuthService
    from app.models.user import UserCreate, UserRole

    auth = AuthService(mock_db)
    user = await auth.create_user(UserCreate(
        username=username,
        email=f"{username}@test.com",
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
    if balance != 3.0:
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": balance}},
        )
    return user


async def _create_service(mock_db, provider_id, duration=2.0, max_participants=1):
    svc = ServiceService(mock_db)
    return await svc.create_service(
        ServiceCreate(
            title="Test Service Title",
            description="A test service description long enough to pass validation",
            category="testing",
            tags=[],
            estimated_duration=duration,
            location={"latitude": 41.0, "longitude": 29.0, "address": "Istanbul"},
            service_type="offer",
            max_participants=max_participants,
        ),
        provider_id,
    )


async def _match_and_create_transaction(mock_db, service, receiver_id):
    """Simulate what join_request_service does: create the transaction and add
    the receiver to matched_user_ids.  We insert docs directly to bypass
    guards that conflict in a test-only mongomock environment."""
    from app.models.transaction import TransactionResponse

    service_doc = await mock_db.services.find_one({"_id": ObjectId(str(service.id))})

    tx_doc = {
        "service_id": ObjectId(str(service.id)),
        "provider_id": ObjectId(str(service.user_id)),
        "requester_id": ObjectId(receiver_id),
        "timebank_hours": float(service_doc["estimated_duration"]),
        "description": f"Service exchange: {service_doc['title']}",
        "status": TransactionStatus.PENDING,
        "provider_confirmed": False,
        "requester_confirmed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await mock_db.transactions.insert_one(tx_doc)
    tx_doc["_id"] = result.inserted_id

    # Add receiver to matched_user_ids and ensure service is in_progress
    await mock_db.services.update_one(
        {"_id": ObjectId(str(service.id))},
        {
            "$addToSet": {"matched_user_ids": ObjectId(receiver_id)},
            "$set": {"status": ServiceStatus.IN_PROGRESS, "updated_at": datetime.utcnow()},
        },
    )

    return TransactionResponse(**tx_doc)


async def _get_balance(mock_db, user_id):
    user_svc = UserService(mock_db)
    user = await user_svc.get_user_by_id(user_id)
    return user.timebank_balance


# ---------------------------------------------------------------------------
# tests
# ---------------------------------------------------------------------------

class TestTimeBankDedup:

    # -- transaction path then service path ----------------------------------

    @pytest.mark.asyncio
    async def test_transaction_completed_then_service_skips_timebank(self, mock_db):
        """When transactions are all completed first, _finalize_service_completion
        must skip TimeBank updates to avoid double-crediting."""
        provider = await _create_user(mock_db, "prov_a", balance=3.0)
        receiver = await _create_user(mock_db, "recv_a", balance=5.0)
        service = await _create_service(mock_db, str(provider.id))
        tx = await _match_and_create_transaction(mock_db, service, str(receiver.id))

        tx_svc = TransactionService(mock_db)
        # Both parties confirm the transaction
        await tx_svc.confirm_transaction_completion(str(tx.id), str(provider.id))
        await tx_svc.confirm_transaction_completion(str(tx.id), str(receiver.id))

        bal_provider_after_tx = await _get_balance(mock_db, str(provider.id))
        bal_receiver_after_tx = await _get_balance(mock_db, str(receiver.id))

        # Provider credited, receiver debited
        assert bal_provider_after_tx == 5.0  # 3 + 2
        assert bal_receiver_after_tx == 3.0  # 5 - 2

        # Now complete the service (provider marks as completed)
        svc_svc = ServiceService(mock_db)
        await svc_svc.complete_service(str(service.id), str(provider.id))

        # Balances must NOT change again
        assert await _get_balance(mock_db, str(provider.id)) == bal_provider_after_tx
        assert await _get_balance(mock_db, str(receiver.id)) == bal_receiver_after_tx

    # -- service path then transaction path ----------------------------------

    @pytest.mark.asyncio
    async def test_service_completed_then_transaction_skips_timebank(self, mock_db):
        """When service is completed first, _finalize_transaction must skip
        TimeBank updates to avoid double-crediting."""
        provider = await _create_user(mock_db, "prov_b", balance=3.0)
        receiver = await _create_user(mock_db, "recv_b", balance=5.0)
        service = await _create_service(mock_db, str(provider.id))
        tx = await _match_and_create_transaction(mock_db, service, str(receiver.id))

        svc_svc = ServiceService(mock_db)
        # Provider marks service as completed
        await svc_svc.complete_service(str(service.id), str(provider.id))

        bal_provider_after_svc = await _get_balance(mock_db, str(provider.id))
        bal_receiver_after_svc = await _get_balance(mock_db, str(receiver.id))

        assert bal_provider_after_svc == 5.0  # 3 + 2
        assert bal_receiver_after_svc == 3.0  # 5 - 2

        # Now complete the transaction (both confirm)
        tx_svc = TransactionService(mock_db)
        await tx_svc.confirm_transaction_completion(str(tx.id), str(provider.id))
        await tx_svc.confirm_transaction_completion(str(tx.id), str(receiver.id))

        # Balances must NOT change again
        assert await _get_balance(mock_db, str(provider.id)) == bal_provider_after_svc
        assert await _get_balance(mock_db, str(receiver.id)) == bal_receiver_after_svc

    # -- multi-receiver: provider credited once via transaction path ----------

    @pytest.mark.asyncio
    async def test_multi_receiver_provider_credited_once(self, mock_db):
        """With N receivers completing via transaction path, the provider must
        be credited exactly once (estimated_duration), not N times."""
        provider = await _create_user(mock_db, "prov_c", balance=3.0)
        recv1 = await _create_user(mock_db, "recv_c1", balance=5.0)
        recv2 = await _create_user(mock_db, "recv_c2", balance=5.0)
        service = await _create_service(mock_db, str(provider.id), duration=2.0, max_participants=2)

        tx1 = await _match_and_create_transaction(mock_db, service, str(recv1.id))
        tx2 = await _match_and_create_transaction(mock_db, service, str(recv2.id))

        tx_svc = TransactionService(mock_db)

        # Complete first transaction (provider + recv1)
        await tx_svc.confirm_transaction_completion(str(tx1.id), str(provider.id))
        await tx_svc.confirm_transaction_completion(str(tx1.id), str(recv1.id))

        assert await _get_balance(mock_db, str(provider.id)) == 5.0  # 3 + 2
        assert await _get_balance(mock_db, str(recv1.id)) == 3.0     # 5 - 2

        # Complete second transaction (provider + recv2)
        await tx_svc.confirm_transaction_completion(str(tx2.id), str(provider.id))
        await tx_svc.confirm_transaction_completion(str(tx2.id), str(recv2.id))

        # Provider should still be 5.0 (not 7.0) — credited only once
        assert await _get_balance(mock_db, str(provider.id)) == 5.0
        assert await _get_balance(mock_db, str(recv2.id)) == 3.0     # 5 - 2

    # -- single receiver: normal flow still works ----------------------------

    @pytest.mark.asyncio
    async def test_single_receiver_service_completion_credits_correctly(self, mock_db):
        """Basic happy-path: one provider, one receiver, service-path only."""
        provider = await _create_user(mock_db, "prov_d", balance=3.0)
        receiver = await _create_user(mock_db, "recv_d", balance=5.0)
        service = await _create_service(mock_db, str(provider.id))
        await _match_and_create_transaction(mock_db, service, str(receiver.id))

        svc_svc = ServiceService(mock_db)
        await svc_svc.complete_service(str(service.id), str(provider.id))

        assert await _get_balance(mock_db, str(provider.id)) == 5.0  # 3 + 2
        assert await _get_balance(mock_db, str(receiver.id)) == 3.0  # 5 - 2
