import pytest
from bson import ObjectId
from datetime import datetime

from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.models.user import (
    UserCreate, UserRole, UserUpdate, UserRoleUpdate,
    UserSettingsUpdate, PasswordChange,
)


async def _make_user(mock_db, username="svcuser", email="svc@test.com", role=UserRole.USER):
    auth = AuthService(mock_db)
    return await auth.create_user(UserCreate(
        username=username,
        email=email,
        password="testpassword123",
        confirm_password="testpassword123",
        full_name=username.title(),
        bio="bio",
        location="Istanbul",
        role=role,
        profile_visible=True,
        show_email=False,
        show_location=True,
        email_notifications=True,
        service_matches_notifications=True,
        messages_notifications=True,
    ))


class TestUserServiceGetters:

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.get_user_by_id(str(user.id))
        assert result is not None
        assert result.id == user.id
        assert result.username == "svcuser"

    @pytest.mark.asyncio
    async def test_get_user_by_id_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.get_user_by_id(str(ObjectId()))
        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_by_id_invalid_id(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.get_user_by_id("not-an-objectid")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_by_email(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.get_user_by_email("svc@test.com")
        assert result is not None
        assert result.id == user.id

    @pytest.mark.asyncio
    async def test_get_user_by_email_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        assert await svc.get_user_by_email("nope@test.com") is None

    @pytest.mark.asyncio
    async def test_get_user_by_username(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.get_user_by_username("svcuser")
        assert result is not None
        assert result.id == user.id

    @pytest.mark.asyncio
    async def test_get_user_by_username_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        assert await svc.get_user_by_username("ghost") is None


class TestUserServiceUpdate:

    @pytest.mark.asyncio
    async def test_update_user_full_name(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        updated = await svc.update_user(str(user.id), UserUpdate(full_name="New Name"))
        assert updated is not None
        assert updated.full_name == "New Name"

    @pytest.mark.asyncio
    async def test_update_user_bio_and_location(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        updated = await svc.update_user(
            str(user.id), UserUpdate(bio="Updated bio", location="Ankara")
        )
        assert updated.bio == "Updated bio"
        assert updated.location == "Ankara"

    @pytest.mark.asyncio
    async def test_update_user_empty_update_returns_current(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.update_user(str(user.id), UserUpdate())
        assert result is not None
        assert result.id == user.id

    @pytest.mark.asyncio
    async def test_update_user_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.update_user(str(ObjectId()), UserUpdate(full_name="X"))
        assert result is None

    @pytest.mark.asyncio
    async def test_update_user_interests(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        updated = await svc.update_user(
            str(user.id), UserUpdate(interests=["python", "music"])
        )
        assert updated is not None
        assert updated.interests == ["python", "music"]


class TestTimeBankOperations:

    @pytest.mark.asyncio
    async def test_get_timebank_balance(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        tb = await svc.get_timebank_balance(str(user.id))
        assert tb.balance == 3.0
        assert tb.can_earn is True
        assert tb.requires_need_creation is False
        assert isinstance(tb.transactions, list)

    @pytest.mark.asyncio
    async def test_get_timebank_balance_user_not_found(self, mock_db):
        svc = UserService(mock_db)
        with pytest.raises(ValueError, match="User not found"):
            await svc.get_timebank_balance(str(ObjectId()))

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_credit(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.add_timebank_transaction(str(user.id), 2.0, "Helped someone")
        assert result is True
        updated = await svc.get_user_by_id(str(user.id))
        assert updated.timebank_balance == 5.0

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_debit(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.add_timebank_transaction(str(user.id), -2.0, "Received help")
        assert result is True
        updated = await svc.get_user_by_id(str(user.id))
        assert updated.timebank_balance == 1.0

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_insufficient_balance(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.add_timebank_transaction(str(user.id), -10.0, "Too much")
        assert result is False
        updated = await svc.get_user_by_id(str(user.id))
        assert updated.timebank_balance == 3.0

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_over_earning_limit(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": 10.0}},
        )
        result = await svc.add_timebank_transaction(str(user.id), 1.0, "Extra credit")
        assert result is False

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_user_not_found(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.add_timebank_transaction(str(ObjectId()), 1.0, "Ghost")
        assert result is False

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_with_service_id(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        service_id = str(ObjectId())
        result = await svc.add_timebank_transaction(
            str(user.id), 1.0, "Service credit", service_id=service_id
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_add_timebank_transaction_logs_record(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await svc.add_timebank_transaction(str(user.id), 2.0, "Test transaction")
        tb = await svc.get_timebank_balance(str(user.id))
        assert len(tb.transactions) >= 1
        assert any(t.description == "Test transaction" for t in tb.transactions)

    @pytest.mark.asyncio
    async def test_can_user_earn_under_limit(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        assert await svc.can_user_earn(str(user.id)) is True

    @pytest.mark.asyncio
    async def test_can_user_earn_at_limit(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": 10.0}},
        )
        assert await svc.can_user_earn(str(user.id)) is False

    @pytest.mark.asyncio
    async def test_can_user_earn_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        assert await svc.can_user_earn(str(ObjectId())) is False

    @pytest.mark.asyncio
    async def test_requires_need_creation_under_threshold(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        assert await svc.requires_need_creation(str(user.id)) is False

    @pytest.mark.asyncio
    async def test_requires_need_creation_at_threshold_no_needs(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": 10.0}},
        )
        assert await svc.requires_need_creation(str(user.id)) is True

    @pytest.mark.asyncio
    async def test_requires_need_creation_at_threshold_with_need(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": 10.0}},
        )
        await mock_db.services.insert_one({
            "user_id": ObjectId(str(user.id)),
            "service_type": "need",
            "title": "I need help",
            "status": "active",
            "created_at": datetime.utcnow(),
        })
        assert await svc.requires_need_creation(str(user.id)) is False

    @pytest.mark.asyncio
    async def test_requires_need_creation_nonexistent_user(self, mock_db):
        svc = UserService(mock_db)
        assert await svc.requires_need_creation(str(ObjectId())) is False

    @pytest.mark.asyncio
    async def test_get_timebank_balance_requires_need(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await mock_db.users.update_one(
            {"_id": ObjectId(str(user.id))},
            {"$set": {"timebank_balance": 10.0}},
        )
        tb = await svc.get_timebank_balance(str(user.id))
        assert tb.can_earn is False
        assert tb.requires_need_creation is True


class TestAdminOperations:

    @pytest.mark.asyncio
    async def test_set_timebank_balance(self, mock_db):
        user = await _make_user(mock_db)
        admin = await _make_user(mock_db, "admin", "admin@test.com", UserRole.ADMIN)
        svc = UserService(mock_db)

        result = await svc.set_timebank_balance(
            str(user.id), 7.5, str(admin.id), "admin"
        )
        assert result is not None
        assert result.timebank_balance == 7.5

    @pytest.mark.asyncio
    async def test_set_timebank_balance_creates_audit_log(self, mock_db):
        user = await _make_user(mock_db)
        admin = await _make_user(mock_db, "admin", "admin@test.com", UserRole.ADMIN)
        svc = UserService(mock_db)

        await svc.set_timebank_balance(str(user.id), 8.0, str(admin.id), "admin")
        tb = await svc.get_timebank_balance(str(user.id))
        assert any("Admin adjustment" in t.description for t in tb.transactions)

    @pytest.mark.asyncio
    async def test_set_timebank_balance_nonexistent_user(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.set_timebank_balance(str(ObjectId()), 5.0, str(ObjectId()), "admin")
        assert result is None

    @pytest.mark.asyncio
    async def test_update_user_role(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.update_user_role(
            str(user.id), UserRoleUpdate(role=UserRole.MODERATOR)
        )
        assert result is not None
        assert result.role == UserRole.MODERATOR

    @pytest.mark.asyncio
    async def test_update_user_role_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.update_user_role(
            str(ObjectId()), UserRoleUpdate(role=UserRole.ADMIN)
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_get_users_by_role(self, mock_db):
        await _make_user(mock_db, "user1", "u1@test.com", UserRole.USER)
        await _make_user(mock_db, "mod1", "m1@test.com", UserRole.MODERATOR)
        await _make_user(mock_db, "mod2", "m2@test.com", UserRole.MODERATOR)
        svc = UserService(mock_db)

        mods = await svc.get_users_by_role(UserRole.MODERATOR)
        assert len(mods) == 2
        assert all(u.role == UserRole.MODERATOR for u in mods)

    @pytest.mark.asyncio
    async def test_get_users_by_role_empty(self, mock_db):
        await _make_user(mock_db)
        svc = UserService(mock_db)
        admins = await svc.get_users_by_role(UserRole.ADMIN)
        assert admins == []

    @pytest.mark.asyncio
    async def test_get_all_timebank_transactions(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await svc.add_timebank_transaction(str(user.id), 1.0, "tx1")
        await svc.add_timebank_transaction(str(user.id), 2.0, "tx2")

        txs, total = await svc.get_all_timebank_transactions(page=1, limit=10)
        assert total == 2
        assert len(txs) == 2

    @pytest.mark.asyncio
    async def test_get_all_timebank_transactions_empty(self, mock_db):
        svc = UserService(mock_db)
        txs, total = await svc.get_all_timebank_transactions()
        assert total == 0
        assert txs == []

    @pytest.mark.asyncio
    async def test_get_all_timebank_transactions_pagination(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        for i in range(5):
            await svc.add_timebank_transaction(str(user.id), 0.5, f"tx{i}")

        page1, total = await svc.get_all_timebank_transactions(page=1, limit=2)
        assert total == 5
        assert len(page1) == 2

        page2, _ = await svc.get_all_timebank_transactions(page=2, limit=2)
        assert len(page2) == 2


class TestRoleChecks:

    @pytest.mark.asyncio
    async def test_is_admin_true(self, mock_db):
        admin = await _make_user(mock_db, "admin", "admin@test.com", UserRole.ADMIN)
        svc = UserService(mock_db)
        assert await svc.is_admin(str(admin.id)) is True

    @pytest.mark.asyncio
    async def test_is_admin_false(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        assert await svc.is_admin(str(user.id)) is False

    @pytest.mark.asyncio
    async def test_is_admin_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        assert not await svc.is_admin(str(ObjectId()))

    @pytest.mark.asyncio
    async def test_is_moderator_or_admin_moderator(self, mock_db):
        mod = await _make_user(mock_db, "mod", "mod@test.com", UserRole.MODERATOR)
        svc = UserService(mock_db)
        assert await svc.is_moderator_or_admin(str(mod.id)) is True

    @pytest.mark.asyncio
    async def test_is_moderator_or_admin_admin(self, mock_db):
        admin = await _make_user(mock_db, "admin", "admin@test.com", UserRole.ADMIN)
        svc = UserService(mock_db)
        assert await svc.is_moderator_or_admin(str(admin.id)) is True

    @pytest.mark.asyncio
    async def test_is_moderator_or_admin_regular_user(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        assert await svc.is_moderator_or_admin(str(user.id)) is False

    @pytest.mark.asyncio
    async def test_is_moderator_or_admin_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        assert not await svc.is_moderator_or_admin(str(ObjectId()))


class TestUserSettings:

    @pytest.mark.asyncio
    async def test_update_settings_privacy(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.update_user_settings(
            str(user.id),
            UserSettingsUpdate(profile_visible=False, show_email=True),
        )
        assert result is not None
        assert result.profile_visible is False
        assert result.show_email is True

    @pytest.mark.asyncio
    async def test_update_settings_notifications(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.update_user_settings(
            str(user.id),
            UserSettingsUpdate(email_notifications=False),
        )
        assert result is not None
        assert result.email_notifications is False

    @pytest.mark.asyncio
    async def test_update_settings_empty_returns_current(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.update_user_settings(str(user.id), UserSettingsUpdate())
        assert result is not None
        assert result.id == user.id

    @pytest.mark.asyncio
    async def test_update_settings_nonexistent_user(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.update_user_settings(
            str(ObjectId()), UserSettingsUpdate(show_email=True)
        )
        assert result is None


class TestPasswordAndAccount:

    @pytest.mark.asyncio
    async def test_change_password_success(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.change_password(
            str(user.id),
            PasswordChange(
                current_password="testpassword123",
                new_password="newpassword456",
                confirm_password="newpassword456",
            ),
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.change_password(
            str(user.id),
            PasswordChange(
                current_password="wrongpassword",
                new_password="newpassword456",
                confirm_password="newpassword456",
            ),
        )
        assert result is False

    @pytest.mark.asyncio
    async def test_change_password_mismatch(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.change_password(
            str(user.id),
            PasswordChange(
                current_password="testpassword123",
                new_password="newpassword456",
                confirm_password="differentpassword",
            ),
        )
        assert result is False

    @pytest.mark.asyncio
    async def test_change_password_nonexistent_user(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.change_password(
            str(ObjectId()),
            PasswordChange(
                current_password="x",
                new_password="newpassword456",
                confirm_password="newpassword456",
            ),
        )
        assert result is False

    @pytest.mark.asyncio
    async def test_change_password_then_authenticate(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        await svc.change_password(
            str(user.id),
            PasswordChange(
                current_password="testpassword123",
                new_password="newpassword456",
                confirm_password="newpassword456",
            ),
        )
        auth = AuthService(mock_db)
        assert await auth.authenticate_user("svc@test.com", "newpassword456") is not None
        assert await auth.authenticate_user("svc@test.com", "testpassword123") is None

    @pytest.mark.asyncio
    async def test_delete_account_success(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.delete_account(str(user.id), "testpassword123")
        assert result is True
        deleted = await svc.get_user_by_id(str(user.id))
        assert deleted.is_active is False

    @pytest.mark.asyncio
    async def test_delete_account_wrong_password(self, mock_db):
        user = await _make_user(mock_db)
        svc = UserService(mock_db)
        result = await svc.delete_account(str(user.id), "wrongpassword")
        assert result is False
        still_active = await svc.get_user_by_id(str(user.id))
        assert still_active.is_active is True

    @pytest.mark.asyncio
    async def test_delete_account_nonexistent(self, mock_db):
        svc = UserService(mock_db)
        result = await svc.delete_account(str(ObjectId()), "password")
        assert result is False
