from typing import Optional, List, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.user import UserResponse, UserUpdate, TimeBankTransaction, TimeBankResponse, UserRole, UserRoleUpdate, UserSettingsUpdate, PasswordChange
from ..core.security import verify_password, get_password_hash
from ..core.database import get_database


class UserService:
    def __init__(self, db):
        self.db = db
        self.users_collection = db.users
        self.transactions_collection = db.timebank_transactions
        self.failed_transactions_collection = db.failed_timebank_transactions

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        try:
            user_doc = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                return UserResponse(**user_doc)
            return None
        except Exception:
            return None

    async def get_user_by_email(self, email: str) -> Optional[UserResponse]:
        """Get user by email"""
        try:
            user_doc = await self.users_collection.find_one({"email": email})
            if user_doc:
                return UserResponse(**user_doc)
            return None
        except Exception:
            return None

    async def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        """Get user by username"""
        try:
            user_doc = await self.users_collection.find_one({"username": username})
            if user_doc:
                return UserResponse(**user_doc)
            return None
        except Exception:
            return None

    async def search_users(self, query: str, exclude_user_id: Optional[str] = None, limit: int = 10) -> List[UserResponse]:
        """Search users by username or full_name"""
        try:
            filter_doc = {
                "$or": [
                    {"username": {"$regex": query, "$options": "i"}},
                    {"full_name": {"$regex": query, "$options": "i"}},
                ]
            }
            if exclude_user_id:
                filter_doc["_id"] = {"$ne": ObjectId(exclude_user_id)}

            cursor = self.users_collection.find(filter_doc).limit(limit)
            users = []
            async for user_doc in cursor:
                users.append(UserResponse(**user_doc))
            return users
        except Exception:
            return []

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserResponse]:
        """Update user profile"""
        try:
            update_data = {k: v for k, v in user_update.dict().items() if v is not None}
            if not update_data:
                return await self.get_user_by_id(user_id)
            
            if "social_links" in update_data and isinstance(update_data["social_links"], dict):
                update_data["social_links"] = {
                    k: v for k, v in update_data["social_links"].items()
                }
            
            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count or result.matched_count:
                return await self.get_user_by_id(user_id)
            return None
        except Exception:
            return None

    async def get_timebank_balance(self, user_id: str) -> TimeBankResponse:
        """Get user's TimeBank balance and transaction history"""
        try:
            # Get user's current balance
            user = await self.get_user_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Get transaction history
            transactions_cursor = self.transactions_collection.find(
                {"user_id": ObjectId(user_id)}
            ).sort("created_at", -1).limit(50)
            
            transactions = []
            async for transaction in transactions_cursor:
                transactions.append(TimeBankTransaction(**transaction))
            
            # Check if user can earn more (based on effective max balance)
            effective_max = await self.get_effective_max_balance(user_id)
            effective_min = await self.get_effective_min_balance(user_id)
            can_earn = effective_max < 10.0

            # Require Need creation when effective max balance hits 10 hours and user has no needs
            need_count = 0
            if effective_max >= 10.0:
                need_count = await self.db.services.count_documents({
                    "user_id": ObjectId(user_id),
                    "service_type": "need",
                })
            requires_need_creation = effective_max >= 10.0 and need_count == 0

            return TimeBankResponse(
                balance=user.timebank_balance,
                transactions=transactions,
                can_earn=can_earn,
                requires_need_creation=requires_need_creation,
                effective_max_balance=round(effective_max, 2),
                effective_min_balance=round(effective_min, 2),
            )
        except Exception as e:
            raise ValueError(f"Error getting TimeBank balance: {str(e)}")

    async def _log_failed_transaction(
        self,
        user_id: str,
        amount: float,
        description: str,
        reason: str,
        user_balance: Optional[float] = None,
        error_message: Optional[str] = None,
        service_id: Optional[str] = None
    ):
        """Log a failed TimeBank transaction to the database"""
        try:
            failed_transaction_data = {
                "user_id": ObjectId(user_id),
                "amount": amount,
                "description": description,
                "service_id": ObjectId(service_id) if service_id else None,
                "reason": reason,
                "user_balance_at_failure": user_balance,
                "error_message": error_message,
                "created_at": datetime.utcnow()
            }
            await self.failed_transactions_collection.insert_one(failed_transaction_data)
        except Exception as e:
            # Don't fail if logging fails, but print warning
            print(f"WARNING: Failed to log failed transaction: {str(e)}")

    async def add_timebank_transaction(
        self, 
        user_id: str, 
        amount: float, 
        description: str, 
        service_id: Optional[str] = None
    ) -> bool:
        """Add a TimeBank transaction"""
        try:
            # Get current user
            user = await self.get_user_by_id(user_id)
            if not user:
                await self._log_failed_transaction(
                    user_id=user_id,
                    amount=amount,
                    description=description,
                    reason="user_not_found",
                    error_message="User not found in database",
                    service_id=service_id
                )
                return False
            
            # Check if user can earn more (if amount is positive)
            if amount > 0 and user.timebank_balance >= 10.0:
                await self._log_failed_transaction(
                    user_id=user_id,
                    amount=amount,
                    description=description,
                    reason="provider_balance_limit",
                    user_balance=user.timebank_balance,
                    error_message=f"Provider balance ({user.timebank_balance}) exceeds earning limit (10.0). Create a Need to help balance the community.",
                    service_id=service_id
                )
                return False
            
            # Calculate new balance
            new_balance = user.timebank_balance + amount
            
            # Ensure balance doesn't go below 0
            if new_balance < 0:
                await self._log_failed_transaction(
                    user_id=user_id,
                    amount=amount,
                    description=description,
                    reason="insufficient_balance",
                    user_balance=user.timebank_balance,
                    error_message=f"Insufficient balance: {user.timebank_balance} + {amount} = {new_balance} < 0",
                    service_id=service_id
                )
                return False
            
            # Update user balance
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"timebank_balance": new_balance, "updated_at": datetime.utcnow()}}
            )
            
            # Create transaction record
            transaction_data = {
                "user_id": ObjectId(user_id),
                "amount": amount,
                "description": description,
                "service_id": ObjectId(service_id) if service_id else None,
                "created_at": datetime.utcnow()
            }
            
            await self.transactions_collection.insert_one(transaction_data)
            return True
            
        except Exception as e:
            # Try to get user balance for logging
            user_balance = None
            try:
                user = await self.get_user_by_id(user_id)
                if user:
                    user_balance = user.timebank_balance
            except:
                pass
            
            await self._log_failed_transaction(
                user_id=user_id,
                amount=amount,
                description=description,
                reason="unknown_error",
                user_balance=user_balance,
                error_message=str(e),
                service_id=service_id
            )
            return False

    async def can_user_earn(self, user_id: str) -> bool:
        """Check if user can earn more TimeBank hours"""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return False
            return user.timebank_balance < 10.0
        except Exception:
            return False

    async def get_effective_max_balance(self, user_id: str) -> float:
        """
        Returns the worst-case maximum balance if all pending incoming activities complete.

        Counts:
        1. User's own ACTIVE offers — provider earns once per offer regardless of participants.
           Transactions from these are sub-steps of the same activity; the offer's active status
           already covers them, so no separate transaction lookup is needed.
        2. User's PENDING join requests on NEED services — handshakes not yet accepted.
        3. Provider transactions from NEED applications (service.user_id != user) — covers the
           window after a need-application JR is approved but before the transaction completes.

        Used to enforce the 10-hour cap before allowing new earning activities.
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return 0.0

            # 1. User's own ACTIVE offers
            active_offers = await self.db.services.find({
                "user_id": ObjectId(user_id),
                "service_type": "offer",
                "status": "active"
            }).to_list(None)
            active_offer_hours = sum(
                float(offer.get("estimated_duration", 0.0)) for offer in active_offers
            )

            # 2. PENDING join requests sent by user on NEED services
            pending_jrs = await self.db.join_requests.find({
                "user_id": ObjectId(user_id),
                "status": "pending"
            }).to_list(None)
            pending_jr_hours = 0.0
            for jr in pending_jrs:
                svc_id = jr["service_id"]
                service = await self.db.services.find_one({"_id": ObjectId(svc_id) if not isinstance(svc_id, ObjectId) else svc_id})
                if service and service.get("service_type") == "need":
                    pending_jr_hours += float(service.get("estimated_duration", 0.0))

            # 3. Approved need-application transactions (service not owned by user)
            pipeline = [
                {"$match": {
                    "provider_id": ObjectId(user_id),
                    "status": {"$in": ["pending", "in_progress"]}
                }},
                {"$lookup": {
                    "from": "services",
                    "localField": "service_id",
                    "foreignField": "_id",
                    "as": "service"
                }},
                {"$unwind": "$service"},
                {"$match": {"service.user_id": {"$ne": ObjectId(user_id)}}},
                {"$group": {"_id": None, "total": {"$sum": "$timebank_hours"}}}
            ]
            result = await self.db.transactions.aggregate(pipeline).to_list(1)
            need_application_tx_hours = result[0]["total"] if result else 0.0

            return user.timebank_balance + active_offer_hours + pending_jr_hours + need_application_tx_hours
        except Exception:
            return 0.0

    async def get_effective_min_balance(self, user_id: str) -> float:
        """
        Returns the worst-case minimum balance if all pending outgoing activities complete.

        Counts:
        1. User's own ACTIVE needs — requester spends once per need regardless of participants.
        2. User's PENDING join requests on OFFER services — handshakes not yet accepted.
        3. Requester transactions from OFFER applications (service.user_id != user) — covers the
           window after an offer-application JR is approved but before the transaction completes.

        Used to enforce the 0-hour floor before allowing new spending activities.
        """
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return 0.0

            # 1. User's own ACTIVE needs
            active_needs = await self.db.services.find({
                "user_id": ObjectId(user_id),
                "service_type": "need",
                "status": "active"
            }).to_list(None)
            active_need_hours = sum(
                float(need.get("estimated_duration", 0.0)) for need in active_needs
            )

            # 2. PENDING join requests sent by user on OFFER services
            pending_jrs = await self.db.join_requests.find({
                "user_id": ObjectId(user_id),
                "status": "pending"
            }).to_list(None)
            pending_jr_hours = 0.0
            for jr in pending_jrs:
                svc_id = jr["service_id"]
                service = await self.db.services.find_one({"_id": ObjectId(svc_id) if not isinstance(svc_id, ObjectId) else svc_id})
                if service and service.get("service_type") == "offer":
                    pending_jr_hours += float(service.get("estimated_duration", 0.0))

            # 3. Approved offer-application transactions (service not owned by user)
            pipeline = [
                {"$match": {
                    "requester_id": ObjectId(user_id),
                    "status": {"$in": ["pending", "in_progress"]}
                }},
                {"$lookup": {
                    "from": "services",
                    "localField": "service_id",
                    "foreignField": "_id",
                    "as": "service"
                }},
                {"$unwind": "$service"},
                {"$match": {"service.user_id": {"$ne": ObjectId(user_id)}}},
                {"$group": {"_id": None, "total": {"$sum": "$timebank_hours"}}}
            ]
            result = await self.db.transactions.aggregate(pipeline).to_list(1)
            offer_application_tx_hours = result[0]["total"] if result else 0.0

            return user.timebank_balance - active_need_hours - pending_jr_hours - offer_application_tx_hours
        except Exception:
            return 0.0

    async def requires_need_creation(self, user_id: str) -> bool:
        """True when user's effective max balance is at 10+ hours and they have no Need services."""
        try:
            effective_max = await self.get_effective_max_balance(user_id)
            if effective_max < 10.0:
                return False
            need_count = await self.db.services.count_documents({
                "user_id": ObjectId(user_id),
                "service_type": "need",
            })
            return need_count == 0
        except Exception:
            return False

    async def get_all_timebank_transactions(self, page: int = 1, limit: int = 50) -> Tuple[List[dict], int]:
        """Get all TimeBank transactions with user info (admin or moderator only)"""
        try:
            skip = (page - 1) * limit
            total = await self.transactions_collection.count_documents({})
            
            cursor = self.transactions_collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
            
            transactions = []
            async for transaction_doc in cursor:
                # Populate user info
                user = await self.users_collection.find_one({"_id": transaction_doc["user_id"]})
                if user:
                    transaction_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user.get("username"),
                        "full_name": user.get("full_name")
                    }
                
                # Convert to dict for response
                transaction_dict = {
                    "id": str(transaction_doc["_id"]),
                    "user_id": str(transaction_doc["user_id"]),
                    "amount": float(transaction_doc.get("amount", 0)),
                    "description": transaction_doc.get("description", ""),
                    "service_id": str(transaction_doc["service_id"]) if transaction_doc.get("service_id") else None,
                    "created_at": transaction_doc.get("created_at"),
                    "user": transaction_doc.get("user")
                }
                transactions.append(transaction_dict)
            
            return transactions, total
        except Exception as e:
            raise ValueError(f"Error getting all TimeBank transactions: {str(e)}")

    async def update_user_role(self, user_id: str, role_update: UserRoleUpdate) -> Optional[UserResponse]:
        """Update user role (admin or moderator only)"""
        try:
            update_data = {
                "role": role_update.role,
                "updated_at": datetime.utcnow()
            }
            
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                return await self.get_user_by_id(user_id)
            return None
        except Exception:
            return None

    async def set_timebank_balance(
        self,
        user_id: str,
        new_balance: float,
        admin_user_id: str,
        admin_username: str,
    ) -> Optional[UserResponse]:
        """Set a user's TimeBank balance (admin/moderator only). Logs an audit transaction."""
        try:
            user = await self.get_user_by_id(user_id)
            if not user:
                return None
            old_balance = user.timebank_balance
            amount = new_balance - old_balance
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"timebank_balance": new_balance, "updated_at": datetime.utcnow()}},
            )
            description = f"Admin adjustment by {admin_username}: {old_balance:.1f}h → {new_balance:.1f}h"
            await self.transactions_collection.insert_one({
                "user_id": ObjectId(user_id),
                "amount": amount,
                "description": description,
                "service_id": None,
                "created_at": datetime.utcnow(),
            })
            return await self.get_user_by_id(user_id)
        except Exception:
            return None

    async def get_users_by_role(self, role: UserRole) -> List[UserResponse]:
        """Get all users with a specific role"""
        try:
            users = []
            cursor = self.users_collection.find({"role": role})
            async for user_doc in cursor:
                users.append(UserResponse(**user_doc))
            return users
        except Exception:
            return []

    async def is_admin(self, user_id: str) -> bool:
        """Check if user is an admin"""
        try:
            user = await self.get_user_by_id(user_id)
            return user and user.role == UserRole.ADMIN
        except Exception:
            return False

    async def is_moderator_or_admin(self, user_id: str) -> bool:
        """Check if user is a moderator or admin"""
        try:
            user = await self.get_user_by_id(user_id)
            return user and user.role in [UserRole.MODERATOR, UserRole.ADMIN]
        except Exception:
            return False

    async def update_user_settings(self, user_id: str, settings_update: UserSettingsUpdate) -> Optional[UserResponse]:
        """Update user privacy and notification settings"""
        try:
            update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
            if not update_data:
                return await self.get_user_by_id(user_id)
            
            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.modified_count or result.matched_count:
                return await self.get_user_by_id(user_id)
            return None
        except Exception:
            return None

    async def change_password(self, user_id: str, password_change: PasswordChange) -> bool:
        """Change user password"""
        try:
            # Get user document with password hash
            user_doc = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return False
            
            # Check if user has a password (OAuth users might not have one)
            if "password_hash" not in user_doc:
                return False
            
            # Verify current password
            if not verify_password(password_change.current_password, user_doc["password_hash"]):
                return False
            
            # Check if new passwords match
            if password_change.new_password != password_change.confirm_password:
                return False
            
            # Hash new password
            new_password = password_change.new_password
            if len(new_password) > 72:
                new_password = new_password[:72]
            hashed_password = get_password_hash(new_password)
            
            # Update password
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password_hash": hashed_password, "updated_at": datetime.utcnow()}}
            )
            
            return True
        except Exception:
            return False

    async def delete_account(self, user_id: str, password: str) -> bool:
        """Delete user account (soft delete by setting is_active to False)"""
        try:
            # Get user document with password hash
            user_doc = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return False
            
            # If user has a password, verify it
            if "password_hash" in user_doc:
                if not verify_password(password, user_doc["password_hash"]):
                    return False
            
            # Soft delete: set is_active to False
            await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            return True
        except Exception:
            return False
