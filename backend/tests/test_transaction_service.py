import pytest
from bson import ObjectId
from datetime import datetime

from app.models.service import ServiceCreate, ServiceStatus
from app.models.transaction import TransactionCreate, TransactionStatus, TransactionUpdate
from app.models.user import UserCreate, UserRole
from app.services.auth_service import AuthService
from app.services.service_service import ServiceService
from app.services.transaction_service import TransactionService
from app.services.user_service import UserService


async def _create_user(mock_db, username: str, balance: float = 3.0):
    auth = AuthService(mock_db)
    user = await auth.create_user(
        UserCreate(
            username=username,
            email=f"{username}@test.com",
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
    if balance != 3.0:
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": balance}},
        )
    return user


async def _create_service(
    mock_db,
    provider_id: str,
    status: ServiceStatus = ServiceStatus.ACTIVE,
    duration: float = 2.0,
):
    service_service = ServiceService(mock_db)
    service = await service_service.create_service(
        ServiceCreate(
            title="Test Service",
            description="A service description long enough for validation.",
            category="testing",
            tags=[],
            estimated_duration=duration,
            location={"latitude": 41.0, "longitude": 29.0, "address": "Istanbul"},
            service_type="offer",
            max_participants=2,
        ),
        provider_id,
    )
    if status != ServiceStatus.ACTIVE:
        await mock_db.services.update_one(
            {"_id": ObjectId(str(service.id))},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )
    return service


async def _insert_approved_join_request(mock_db, service_id: str, requester_id: str):
    await mock_db.join_requests.insert_one(
        {
            "service_id": ObjectId(service_id),
            "user_id": ObjectId(requester_id),
            "status": "approved",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    )


async def _insert_transaction(
    mock_db,
    service_id: str,
    provider_id: str,
    requester_id: str,
    *,
    status: TransactionStatus = TransactionStatus.PENDING,
    provider_confirmed: bool = False,
    requester_confirmed: bool = False,
    timebank_hours: float = 2.0,
    use_string_ids: bool = False,
    include_legacy_hours: bool = False,
):
    service_ref = service_id if use_string_ids else ObjectId(service_id)
    provider_ref = provider_id if use_string_ids else ObjectId(provider_id)
    requester_ref = requester_id if use_string_ids else ObjectId(requester_id)

    tx_doc = {
        "service_id": service_ref,
        "provider_id": provider_ref,
        "requester_id": requester_ref,
        "timebank_hours": timebank_hours,
        "description": "Service exchange",
        "status": status,
        "provider_confirmed": provider_confirmed,
        "requester_confirmed": requester_confirmed,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    if include_legacy_hours:
        tx_doc["hours"] = timebank_hours
    result = await mock_db.transactions.insert_one(tx_doc)
    tx_doc["_id"] = result.inserted_id
    return tx_doc


class TestTransactionServiceCreate:
    @pytest.mark.asyncio
    async def test_create_transaction_happy_path(self, mock_db):
        provider = await _create_user(mock_db, "txprov_create_ok")
        requester = await _create_user(mock_db, "txreq_create_ok")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_approved_join_request(mock_db, str(service.id), str(requester.id))

        svc = TransactionService(mock_db)
        created = await svc.create_transaction(
            TransactionCreate(
                service_id=str(service.id),
                provider_id=str(provider.id),
                requester_id=str(requester.id),
                timebank_hours=2.0,
                description="desc",
            )
        )

        assert created is not None
        assert created.status == TransactionStatus.PENDING
        assert created.provider_confirmed is False
        assert created.requester_confirmed is False

    @pytest.mark.asyncio
    async def test_create_transaction_missing_join_request(self, mock_db):
        provider = await _create_user(mock_db, "txprov_create_nojr")
        requester = await _create_user(mock_db, "txreq_create_nojr")
        service = await _create_service(mock_db, str(provider.id))

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="No approved join request found"):
            await svc.create_transaction(
                TransactionCreate(
                    service_id=str(service.id),
                    provider_id=str(provider.id),
                    requester_id=str(requester.id),
                    timebank_hours=2.0,
                )
            )

    @pytest.mark.asyncio
    async def test_create_transaction_missing_service(self, mock_db):
        provider = await _create_user(mock_db, "txprov_create_nosvc")
        requester = await _create_user(mock_db, "txreq_create_nosvc")

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="Service not found"):
            await svc.create_transaction(
                TransactionCreate(
                    service_id=str(ObjectId()),
                    provider_id=str(provider.id),
                    requester_id=str(requester.id),
                    timebank_hours=2.0,
                )
            )

    @pytest.mark.asyncio
    async def test_create_transaction_non_active_service(self, mock_db):
        provider = await _create_user(mock_db, "txprov_create_inactive")
        requester = await _create_user(mock_db, "txreq_create_inactive")
        service = await _create_service(mock_db, str(provider.id), status=ServiceStatus.CANCELLED)
        await _insert_approved_join_request(mock_db, str(service.id), str(requester.id))

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="Service is not active"):
            await svc.create_transaction(
                TransactionCreate(
                    service_id=str(service.id),
                    provider_id=str(provider.id),
                    requester_id=str(requester.id),
                    timebank_hours=2.0,
                )
            )

    @pytest.mark.asyncio
    async def test_create_transaction_duplicate_allows_second_record(self, mock_db):
        provider = await _create_user(mock_db, "txprov_create_dup")
        requester = await _create_user(mock_db, "txreq_create_dup")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_approved_join_request(mock_db, str(service.id), str(requester.id))

        svc = TransactionService(mock_db)
        payload = TransactionCreate(
            service_id=str(service.id),
            provider_id=str(provider.id),
            requester_id=str(requester.id),
            timebank_hours=2.0,
        )
        await svc.create_transaction(payload)
        await svc.create_transaction(payload)

        total = await mock_db.transactions.count_documents(
            {
                "service_id": ObjectId(str(service.id)),
                "provider_id": ObjectId(str(provider.id)),
                "requester_id": ObjectId(str(requester.id)),
            }
        )
        assert total == 2


class TestTransactionServiceGetters:
    @pytest.mark.asyncio
    async def test_get_user_transactions_with_pagination(self, mock_db):
        provider = await _create_user(mock_db, "txprov_user_page")
        requester = await _create_user(mock_db, "txreq_user_page")
        other = await _create_user(mock_db, "txother_user_page")
        service = await _create_service(mock_db, str(provider.id))

        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(other.id))

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_user_transactions(str(provider.id), page=1, limit=1)

        assert total == 2
        assert len(transactions) == 1

    @pytest.mark.asyncio
    async def test_get_user_transactions_empty_result(self, mock_db):
        user = await _create_user(mock_db, "txuser_user_empty")
        svc = TransactionService(mock_db)
        transactions, total = await svc.get_user_transactions(str(user.id), page=1, limit=10)
        assert transactions == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_get_user_transactions_supports_legacy_string_ids(self, mock_db):
        provider = await _create_user(mock_db, "txprov_user_legacy")
        requester = await _create_user(mock_db, "txreq_user_legacy")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester.id),
            use_string_ids=True,
        )

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_user_transactions(str(provider.id))

        assert total == 1
        assert len(transactions) == 1
        assert str(transactions[0].provider_id) == str(provider.id)

    @pytest.mark.asyncio
    async def test_get_user_transactions_normalizes_both_confirmed_status(self, mock_db):
        provider = await _create_user(mock_db, "txprov_user_norm")
        requester = await _create_user(mock_db, "txreq_user_norm")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester.id),
            status=TransactionStatus.PENDING,
            provider_confirmed=True,
            requester_confirmed=True,
        )

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_user_transactions(str(requester.id))

        assert total == 1
        assert transactions[0].status == TransactionStatus.COMPLETED
        assert transactions[0].completed_at is not None

    @pytest.mark.asyncio
    async def test_get_service_transactions_with_pagination(self, mock_db):
        provider = await _create_user(mock_db, "txprov_service_page")
        requester1 = await _create_user(mock_db, "txreq1_service_page")
        requester2 = await _create_user(mock_db, "txreq2_service_page")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester1.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester2.id))

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_service_transactions(str(service.id), page=1, limit=1)

        assert total == 2
        assert len(transactions) == 1

    @pytest.mark.asyncio
    async def test_get_service_transactions_empty_result(self, mock_db):
        provider = await _create_user(mock_db, "txprov_service_empty")
        service = await _create_service(mock_db, str(provider.id))

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_service_transactions(str(service.id))

        assert transactions == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_get_transaction_by_id_happy_path(self, mock_db):
        provider = await _create_user(mock_db, "txprov_get_by_id")
        requester = await _create_user(mock_db, "txreq_get_by_id")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        found = await svc.get_transaction_by_id(str(tx["_id"]))

        assert found is not None
        assert str(found.id) == str(tx["_id"])

    @pytest.mark.asyncio
    async def test_get_transaction_by_id_nonexistent(self, mock_db):
        svc = TransactionService(mock_db)
        not_found = await svc.get_transaction_by_id(str(ObjectId()))
        assert not_found is None

    @pytest.mark.asyncio
    async def test_get_all_transactions_pagination(self, mock_db):
        provider = await _create_user(mock_db, "txprov_admin_page")
        requester1 = await _create_user(mock_db, "txreq1_admin_page")
        requester2 = await _create_user(mock_db, "txreq2_admin_page")
        requester3 = await _create_user(mock_db, "txreq3_admin_page")
        service = await _create_service(mock_db, str(provider.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester1.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester2.id))
        await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester3.id))

        svc = TransactionService(mock_db)
        transactions, total = await svc.get_all_transactions(page=1, limit=2)

        assert total == 3
        assert len(transactions) == 2

    @pytest.mark.asyncio
    async def test_get_all_transactions_empty_result(self, mock_db):
        svc = TransactionService(mock_db)
        transactions, total = await svc.get_all_transactions(page=1, limit=20)
        assert transactions == []
        assert total == 0


class TestTransactionServiceUpdateAndConfirm:
    @pytest.mark.asyncio
    async def test_update_transaction_status_happy_path(self, mock_db):
        provider = await _create_user(mock_db, "txprov_update_ok")
        requester = await _create_user(mock_db, "txreq_update_ok")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        updated = await svc.update_transaction_status(
            str(tx["_id"]),
            TransactionUpdate(status=TransactionStatus.IN_PROGRESS, completion_notes="started"),
            str(provider.id),
        )

        assert updated is not None
        assert updated.status == TransactionStatus.IN_PROGRESS
        assert updated.completion_notes == "started"

    @pytest.mark.asyncio
    async def test_update_transaction_status_unauthorized(self, mock_db):
        provider = await _create_user(mock_db, "txprov_update_unauth")
        requester = await _create_user(mock_db, "txreq_update_unauth")
        outsider = await _create_user(mock_db, "txouts_update_unauth")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="not authorized"):
            await svc.update_transaction_status(
                str(tx["_id"]),
                TransactionUpdate(status=TransactionStatus.CANCELLED),
                str(outsider.id),
            )

    @pytest.mark.asyncio
    async def test_update_transaction_status_nonexistent(self, mock_db):
        user = await _create_user(mock_db, "txuser_update_notfound")
        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="Transaction not found"):
            await svc.update_transaction_status(
                str(ObjectId()),
                TransactionUpdate(status=TransactionStatus.CANCELLED),
                str(user.id),
            )

    @pytest.mark.asyncio
    async def test_update_transaction_status_invalid_state_transition(self, mock_db):
        provider = await _create_user(mock_db, "txprov_update_invalid")
        requester = await _create_user(mock_db, "txreq_update_invalid")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester.id),
            status=TransactionStatus.COMPLETED,
        )

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="cannot be changed"):
            await svc.update_transaction_status(
                str(tx["_id"]),
                TransactionUpdate(status=TransactionStatus.CANCELLED),
                str(provider.id),
            )

    @pytest.mark.asyncio
    async def test_confirm_transaction_completion_provider_then_requester(self, mock_db):
        provider = await _create_user(mock_db, "txprov_confirm_ok", balance=3.0)
        requester = await _create_user(mock_db, "txreq_confirm_ok", balance=5.0)
        service = await _create_service(mock_db, str(provider.id), duration=2.0)
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id), timebank_hours=2.0)

        svc = TransactionService(mock_db)
        first = await svc.confirm_transaction_completion(str(tx["_id"]), str(provider.id))
        second = await svc.confirm_transaction_completion(str(tx["_id"]), str(requester.id))

        assert first.provider_confirmed is True
        assert first.requester_confirmed is False
        assert second.status == TransactionStatus.COMPLETED
        assert second.provider_confirmed is True
        assert second.requester_confirmed is True

        user_service = UserService(mock_db)
        provider_after = await user_service.get_user_by_id(str(provider.id))
        requester_after = await user_service.get_user_by_id(str(requester.id))
        assert provider_after.timebank_balance == 5.0
        assert requester_after.timebank_balance == 3.0

    @pytest.mark.asyncio
    async def test_confirm_transaction_completion_unauthorized(self, mock_db):
        provider = await _create_user(mock_db, "txprov_confirm_unauth")
        requester = await _create_user(mock_db, "txreq_confirm_unauth")
        outsider = await _create_user(mock_db, "txouts_confirm_unauth")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="not authorized"):
            await svc.confirm_transaction_completion(str(tx["_id"]), str(outsider.id))

    @pytest.mark.asyncio
    async def test_confirm_transaction_completion_provider_requires_need(self, mock_db):
        provider = await _create_user(mock_db, "txprov_confirm_need", balance=3.0)
        requester = await _create_user(mock_db, "txreq_confirm_need")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))
        await mock_db.users.update_one(
            {"_id": ObjectId(str(provider.id))},
            {"$set": {"timebank_balance": 10.0, "updated_at": datetime.utcnow()}},
        )

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="must create a Need"):
            await svc.confirm_transaction_completion(str(tx["_id"]), str(provider.id))

    @pytest.mark.asyncio
    async def test_confirm_transaction_completion_requester_insufficient_balance(self, mock_db):
        provider = await _create_user(mock_db, "txprov_confirm_insufficient", balance=3.0)
        requester = await _create_user(mock_db, "txreq_confirm_insufficient", balance=1.0)
        service = await _create_service(mock_db, str(provider.id), duration=2.0)
        tx = await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester.id),
            timebank_hours=2.0,
        )

        svc = TransactionService(mock_db)
        await svc.confirm_transaction_completion(str(tx["_id"]), str(provider.id))
        with pytest.raises(ValueError, match="Insufficient TimeBank balance"):
            await svc.confirm_transaction_completion(str(tx["_id"]), str(requester.id))

        tx_after = await mock_db.transactions.find_one({"_id": ObjectId(str(tx["_id"]))})
        assert tx_after["status"] == TransactionStatus.PENDING
        assert tx_after["provider_confirmed"] is True
        assert tx_after["requester_confirmed"] is False

        user_service = UserService(mock_db)
        provider_after = await user_service.get_user_by_id(str(provider.id))
        requester_after = await user_service.get_user_by_id(str(requester.id))
        assert provider_after.timebank_balance == 3.0
        assert requester_after.timebank_balance == 1.0


class TestTransactionServiceFinalizeAndLegacy:
    @pytest.mark.asyncio
    async def test_multi_participant_offer_provider_earns_once_requesters_each_pay_one_hour(self, mock_db):
        provider = await _create_user(mock_db, "txprov_multi_one_hour", balance=3.0)
        requester1 = await _create_user(mock_db, "txreq1_multi_one_hour", balance=5.0)
        requester2 = await _create_user(mock_db, "txreq2_multi_one_hour", balance=5.0)
        service = await _create_service(mock_db, str(provider.id), duration=1.0)

        tx1 = await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester1.id),
            timebank_hours=1.0,
        )
        tx2 = await _insert_transaction(
            mock_db,
            str(service.id),
            str(provider.id),
            str(requester2.id),
            timebank_hours=1.0,
        )

        svc = TransactionService(mock_db)
        await svc.confirm_transaction_completion(str(tx1["_id"]), str(provider.id))
        await svc.confirm_transaction_completion(str(tx1["_id"]), str(requester1.id))
        await svc.confirm_transaction_completion(str(tx2["_id"]), str(provider.id))
        await svc.confirm_transaction_completion(str(tx2["_id"]), str(requester2.id))

        user_service = UserService(mock_db)
        provider_after = await user_service.get_user_by_id(str(provider.id))
        requester1_after = await user_service.get_user_by_id(str(requester1.id))
        requester2_after = await user_service.get_user_by_id(str(requester2.id))

        assert provider_after.timebank_balance == 4.0
        assert requester1_after.timebank_balance == 4.0
        assert requester2_after.timebank_balance == 4.0

        tx1_after = await mock_db.transactions.find_one({"_id": ObjectId(str(tx1["_id"]))})
        tx2_after = await mock_db.transactions.find_one({"_id": ObjectId(str(tx2["_id"]))})
        assert tx1_after["status"] == TransactionStatus.COMPLETED
        assert tx2_after["status"] == TransactionStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_complete_transaction_legacy_happy_path(self, mock_db):
        provider = await _create_user(mock_db, "txprov_complete_legacy", balance=3.0)
        requester = await _create_user(mock_db, "txreq_complete_legacy", balance=5.0)
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        updated = await svc.complete_transaction(str(tx["_id"]), str(provider.id), completion_notes="done")

        assert updated is not None
        assert updated.status == TransactionStatus.COMPLETED
        assert updated.completion_notes == "done"
        assert updated.completed_at is not None

    @pytest.mark.asyncio
    async def test_complete_transaction_legacy_unauthorized(self, mock_db):
        provider = await _create_user(mock_db, "txprov_complete_unauth")
        requester = await _create_user(mock_db, "txreq_complete_unauth")
        outsider = await _create_user(mock_db, "txouts_complete_unauth")
        service = await _create_service(mock_db, str(provider.id))
        tx = await _insert_transaction(mock_db, str(service.id), str(provider.id), str(requester.id))

        svc = TransactionService(mock_db)
        with pytest.raises(ValueError, match="not authorized"):
            await svc.complete_transaction(str(tx["_id"]), str(outsider.id))
