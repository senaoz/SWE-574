from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionStatus
from ..models.service import ServiceStatus
from ..core.database import get_database


class TransactionService:
    def __init__(self, db):
        self.db = db
        self.transactions_collection = db.transactions
        self.services_collection = db.services
        self.users_collection = db.users
        self.join_requests_collection = db.join_requests

    async def create_transaction(self, transaction_data: TransactionCreate) -> TransactionResponse:
        """Create a new transaction"""
        try:
            # Verify service exists and is active
            service = await self.services_collection.find_one({"_id": ObjectId(transaction_data.service_id)})
            if not service:
                raise ValueError("Service not found")
            if service["status"] != ServiceStatus.ACTIVE:
                raise ValueError("Service is not active")
            
            # Verify users exist
            provider = await self.users_collection.find_one({"_id": ObjectId(transaction_data.provider_id)})
            requester = await self.users_collection.find_one({"_id": ObjectId(transaction_data.requester_id)})
            
            if not provider or not requester:
                raise ValueError("Provider or requester not found")
            
            # Check if there's an approved join request
            approved_request = await self.join_requests_collection.find_one({
                "service_id": ObjectId(transaction_data.service_id),
                "user_id": ObjectId(transaction_data.requester_id),
                "status": "approved"
            })
            
            if not approved_request:
                raise ValueError("No approved join request found for this service and user")

            raw = transaction_data.dict()
            transaction_doc = {
                "service_id": ObjectId(raw["service_id"]),
                "provider_id": ObjectId(raw["provider_id"]),
                "requester_id": ObjectId(raw["requester_id"]),
                "timebank_hours": raw["timebank_hours"],
                "description": raw.get("description"),
                "status": TransactionStatus.PENDING,
                "provider_confirmed": False,
                "requester_confirmed": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.transactions_collection.insert_one(transaction_doc)
            transaction_doc["_id"] = result.inserted_id
            
            return TransactionResponse(**transaction_doc)
        except Exception as e:
            raise ValueError(f"Error creating transaction: {str(e)}")

    async def get_user_transactions(self, user_id: str, page: int = 1, limit: int = 20) -> Tuple[List[TransactionResponse], int]:
        """Get transactions for a specific user with pagination"""
        try:
            # Match both ObjectId and string (legacy docs may have string IDs)
            user_oid = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
            if user_oid is not None:
                query = {
                    "$or": [
                        {"provider_id": user_oid},
                        {"requester_id": user_oid},
                        {"provider_id": user_id},
                        {"requester_id": user_id}
                    ]
                }
            else:
                query = {
                    "$or": [
                        {"provider_id": user_id},
                        {"requester_id": user_id}
                    ]
                }
            total = await self.transactions_collection.count_documents(query)
            
            def to_oid(v):
                """Normalize id for lookups (users/services use ObjectId _id)."""
                return ObjectId(v) if isinstance(v, str) and ObjectId.is_valid(v) else v

            skip = (page - 1) * limit
            cursor = self.transactions_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            transactions = []
            async for transaction_doc in cursor:
                # Populate service info
                service = await self.services_collection.find_one({"_id": to_oid(transaction_doc["service_id"])})
                if service:
                    transaction_doc["service"] = {
                        "id": str(service["_id"]),
                        "title": service.get("title", "Service"),
                        "description": service.get("description")
                    }
                
                # Populate provider info
                provider = await self.users_collection.find_one({"_id": to_oid(transaction_doc["provider_id"])})
                if provider:
                    transaction_doc["provider"] = {
                        "id": str(provider["_id"]),
                        "username": provider.get("username"),
                        "full_name": provider.get("full_name")
                    }
                
                # Populate requester info
                requester = await self.users_collection.find_one({"_id": to_oid(transaction_doc["requester_id"])})
                if requester:
                    transaction_doc["requester"] = {
                        "id": str(requester["_id"]),
                        "username": requester.get("username"),
                        "full_name": requester.get("full_name")
                    }
                
                # Ensure boolean fields are not None
                if transaction_doc.get("provider_confirmed") is None:
                    transaction_doc["provider_confirmed"] = False
                if transaction_doc.get("requester_confirmed") is None:
                    transaction_doc["requester_confirmed"] = False
                
                transactions.append(TransactionResponse(**transaction_doc))
            
            return transactions, total
        except Exception as e:
            raise ValueError(f"Error fetching user transactions: {str(e)}")

    async def get_service_transactions(self, service_id: str, page: int = 1, limit: int = 20) -> Tuple[List[TransactionResponse], int]:
        """Get transactions for a specific service with pagination"""
        try:
            query = {"service_id": ObjectId(service_id)}
            total = await self.transactions_collection.count_documents(query)
            
            skip = (page - 1) * limit
            cursor = self.transactions_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            transactions = []
            async for transaction_doc in cursor:
                # Populate service info
                service = await self.services_collection.find_one({"_id": transaction_doc["service_id"]})
                if service:
                    transaction_doc["service"] = {
                        "id": str(service["_id"]),
                        "title": service.get("title", "Service"),
                        "description": service.get("description")
                    }
                
                # Populate provider info
                provider = await self.users_collection.find_one({"_id": transaction_doc["provider_id"]})
                if provider:
                    transaction_doc["provider"] = {
                        "id": str(provider["_id"]),
                        "username": provider.get("username"),
                        "full_name": provider.get("full_name")
                    }
                
                # Populate requester info
                requester = await self.users_collection.find_one({"_id": transaction_doc["requester_id"]})
                if requester:
                    transaction_doc["requester"] = {
                        "id": str(requester["_id"]),
                        "username": requester.get("username"),
                        "full_name": requester.get("full_name")
                    }
                
                # Ensure boolean fields are not None
                if transaction_doc.get("provider_confirmed") is None:
                    transaction_doc["provider_confirmed"] = False
                if transaction_doc.get("requester_confirmed") is None:
                    transaction_doc["requester_confirmed"] = False
                
                transactions.append(TransactionResponse(**transaction_doc))
            
            return transactions, total
        except Exception as e:
            raise ValueError(f"Error fetching service transactions: {str(e)}")

    async def update_transaction_status(self, transaction_id: str, update_data: TransactionUpdate, current_user_id: str) -> Optional[TransactionResponse]:
        """Update the status of a transaction"""
        try:
            transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            if not transaction:
                raise ValueError("Transaction not found")
            
            # Check if user is authorized to update this transaction
            if (str(transaction["provider_id"]) != current_user_id and 
                str(transaction["requester_id"]) != current_user_id):
                raise ValueError("You are not authorized to update this transaction")
            
            # Prevent status changes if already completed/cancelled
            if transaction["status"] in [TransactionStatus.COMPLETED, TransactionStatus.CANCELLED]:
                raise ValueError(f"Transaction is already {transaction['status']} and cannot be changed")

            update_doc = {
                "updated_at": datetime.utcnow()
            }
            
            if update_data.status is not None:
                update_doc["status"] = update_data.status
                if update_data.status == TransactionStatus.COMPLETED:
                    update_doc["completed_at"] = datetime.utcnow()
            
            if update_data.description is not None:
                update_doc["description"] = update_data.description

            result = await self.transactions_collection.update_one(
                {"_id": ObjectId(transaction_id)},
                {"$set": update_doc}
            )

            if result.modified_count > 0:
                updated_transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
                # Ensure boolean fields are not None
                if updated_transaction.get("provider_confirmed") is None:
                    updated_transaction["provider_confirmed"] = False
                if updated_transaction.get("requester_confirmed") is None:
                    updated_transaction["requester_confirmed"] = False
                return TransactionResponse(**updated_transaction)
            return None
        except Exception as e:
            raise ValueError(f"Error updating transaction status: {str(e)}")

    async def get_transaction_by_id(self, transaction_id: str) -> Optional[TransactionResponse]:
        """Get a transaction by its ID"""
        try:
            transaction_doc = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            if transaction_doc:
                # Populate service info
                service = await self.services_collection.find_one({"_id": transaction_doc["service_id"]})
                if service:
                    transaction_doc["service"] = {
                        "id": str(service["_id"]),
                        "title": service.get("title", "Service"),
                        "description": service.get("description")
                    }
                
                # Populate provider info
                provider = await self.users_collection.find_one({"_id": transaction_doc["provider_id"]})
                if provider:
                    transaction_doc["provider"] = {
                        "id": str(provider["_id"]),
                        "username": provider.get("username"),
                        "full_name": provider.get("full_name")
                    }
                
                # Populate requester info
                requester = await self.users_collection.find_one({"_id": transaction_doc["requester_id"]})
                if requester:
                    transaction_doc["requester"] = {
                        "id": str(requester["_id"]),
                        "username": requester.get("username"),
                        "full_name": requester.get("full_name")
                    }
                
                # Ensure boolean fields are not None
                if transaction_doc.get("provider_confirmed") is None:
                    transaction_doc["provider_confirmed"] = False
                if transaction_doc.get("requester_confirmed") is None:
                    transaction_doc["requester_confirmed"] = False
                
                return TransactionResponse(**transaction_doc)
            return None
        except Exception:
            return None

    async def confirm_transaction_completion(self, transaction_id: str, current_user_id: str) -> TransactionResponse:
        """Confirm transaction completion by provider or requester"""
        try:
            transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            if not transaction:
                raise ValueError("Transaction not found")
            
            # Check if user is authorized to confirm this transaction
            is_provider = str(transaction["provider_id"]) == current_user_id
            is_requester = str(transaction["requester_id"]) == current_user_id
            
            if not is_provider and not is_requester:
                raise ValueError("You are not authorized to confirm this transaction")
            
            # Update the appropriate confirmation
            update_fields = {"updated_at": datetime.utcnow()}
            if is_provider:
                update_fields["provider_confirmed"] = True
            if is_requester:
                update_fields["requester_confirmed"] = True
            
            await self.transactions_collection.update_one(
                {"_id": ObjectId(transaction_id)},
                {"$set": update_fields}
            )
            
            # Check if both parties have confirmed
            updated_transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            provider_confirmed = updated_transaction.get("provider_confirmed", False)
            requester_confirmed = updated_transaction.get("requester_confirmed", False)
            
            if provider_confirmed and requester_confirmed:
                # Both confirmed - finalize transaction and create TimeBank logs
                await self._finalize_transaction(transaction_id, updated_transaction)
                updated_transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            
            # Populate service/provider/requester info
            service = await self.services_collection.find_one({"_id": updated_transaction["service_id"]})
            if service:
                updated_transaction["service"] = {
                    "id": str(service["_id"]),
                    "title": service.get("title", "Service"),
                    "description": service.get("description")
                }
            
            provider = await self.users_collection.find_one({"_id": updated_transaction["provider_id"]})
            if provider:
                updated_transaction["provider"] = {
                    "id": str(provider["_id"]),
                    "username": provider.get("username"),
                    "full_name": provider.get("full_name")
                }
            
            requester = await self.users_collection.find_one({"_id": updated_transaction["requester_id"]})
            if requester:
                updated_transaction["requester"] = {
                    "id": str(requester["_id"]),
                    "username": requester.get("username"),
                    "full_name": requester.get("full_name")
                }
            
            # Ensure boolean fields are not None
            if updated_transaction.get("provider_confirmed") is None:
                updated_transaction["provider_confirmed"] = False
            if updated_transaction.get("requester_confirmed") is None:
                updated_transaction["requester_confirmed"] = False
            
            return TransactionResponse(**updated_transaction)
        except Exception as e:
            raise ValueError(f"Error confirming transaction completion: {str(e)}")
    
    async def _finalize_transaction(self, transaction_id: str, transaction) -> bool:
        """Finalize transaction and create TimeBank transaction logs (called when both parties confirm)"""
        try:
            # Update transaction status
            await self.transactions_collection.update_one(
                {"_id": ObjectId(transaction_id)},
                {
                    "$set": {
                        "status": TransactionStatus.COMPLETED,
                        "completed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Create TimeBank transaction logs using UserService
            from .user_service import UserService
            user_service = UserService(self.db)
            
            # Get service info for description
            service = await self.services_collection.find_one({"_id": transaction["service_id"]})
            service_title = service.get("title", "Service") if service else "Service"
            
            # Provider earns hours
            provider_success = await user_service.add_timebank_transaction(
                str(transaction["provider_id"]),
                float(transaction["timebank_hours"]),
                f"Provided service: {service_title}",
                str(transaction["service_id"])
            )
            
            # Requester spends hours
            requester_success = await user_service.add_timebank_transaction(
                str(transaction["requester_id"]),
                -float(transaction["timebank_hours"]),
                f"Received service: {service_title}",
                str(transaction["service_id"])
            )
            
            return provider_success and requester_success
        except Exception as e:
            raise ValueError(f"Error finalizing transaction: {str(e)}")

    async def complete_transaction(self, transaction_id: str, current_user_id: str, completion_notes: str = None) -> Optional[TransactionResponse]:
        """Mark a transaction as completed (deprecated - use confirm_transaction_completion instead)"""
        try:
            transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            if not transaction:
                raise ValueError("Transaction not found")
            
            # Check if user is authorized to complete this transaction
            if (str(transaction["provider_id"]) != current_user_id and 
                str(transaction["requester_id"]) != current_user_id):
                raise ValueError("You are not authorized to complete this transaction")
            
            if transaction["status"] != TransactionStatus.PENDING:
                raise ValueError(f"Transaction is already {transaction['status']} and cannot be completed")

            update_doc = {
                "status": TransactionStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if completion_notes:
                update_doc["completion_notes"] = completion_notes

            result = await self.transactions_collection.update_one(
                {"_id": ObjectId(transaction_id)},
                {"$set": update_doc}
            )

            if result.modified_count > 0:
                # Update timebank balances
                await self._update_timebank_balances(transaction)
                
                updated_transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
                # Ensure boolean fields are not None
                if updated_transaction.get("provider_confirmed") is None:
                    updated_transaction["provider_confirmed"] = False
                if updated_transaction.get("requester_confirmed") is None:
                    updated_transaction["requester_confirmed"] = False
                return TransactionResponse(**updated_transaction)
            return None
        except Exception as e:
            raise ValueError(f"Error completing transaction: {str(e)}")

    async def _update_timebank_balances(self, transaction):
        """Update timebank balances for both users"""
        try:
            # Add hours to provider
            await self.users_collection.update_one(
                {"_id": transaction["provider_id"]},
                {"$inc": {"timebank_balance": transaction["hours"]}}
            )
            
            # Subtract hours from requester
            await self.users_collection.update_one(
                {"_id": transaction["requester_id"]},
                {"$inc": {"timebank_balance": -transaction["hours"]}}
            )
            
            # Record timebank transactions
            timebank_collection = self.db.timebank_transactions
            
            # Provider earns hours
            await timebank_collection.insert_one({
                "user_id": transaction["provider_id"],
                "amount": transaction["hours"],
                "description": f"Completed service: {transaction.get('description', 'Service exchange')}",
                "transaction_type": "earned",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
            # Requester spends hours
            await timebank_collection.insert_one({
                "user_id": transaction["requester_id"],
                "amount": -transaction["hours"],
                "description": f"Used service: {transaction.get('description', 'Service exchange')}",
                "transaction_type": "spent",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            
        except Exception as e:
            print(f"Warning: Error updating timebank balances: {e}")

    async def get_all_transactions(self, page: int = 1, limit: int = 20) -> tuple[List[TransactionResponse], int]:
        """Get all transactions (admin or moderator only)"""
        try:
            skip = (page - 1) * limit
            
            # Get total count
            total = await self.transactions_collection.count_documents({})
            
            # Get transactions with pagination
            cursor = self.transactions_collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
            transactions = []
            
            async for transaction_doc in cursor:
                # Populate service info
                service = await self.services_collection.find_one({"_id": transaction_doc["service_id"]})
                if service:
                    transaction_doc["service"] = {
                        "id": str(service["_id"]),
                        "title": service.get("title", "Service"),
                        "description": service.get("description")
                    }
                
                # Populate provider info
                provider = await self.users_collection.find_one({"_id": transaction_doc["provider_id"]})
                if provider:
                    transaction_doc["provider"] = {
                        "id": str(provider["_id"]),
                        "username": provider.get("username"),
                        "full_name": provider.get("full_name")
                    }
                
                # Populate requester info
                requester = await self.users_collection.find_one({"_id": transaction_doc["requester_id"]})
                if requester:
                    transaction_doc["requester"] = {
                        "id": str(requester["_id"]),
                        "username": requester.get("username"),
                        "full_name": requester.get("full_name")
                    }
                
                # Ensure boolean fields are not None
                if transaction_doc.get("provider_confirmed") is None:
                    transaction_doc["provider_confirmed"] = False
                if transaction_doc.get("requester_confirmed") is None:
                    transaction_doc["requester_confirmed"] = False
                
                transactions.append(TransactionResponse(**transaction_doc))
            
            return transactions, total
        except Exception as e:
            raise ValueError(f"Error getting all transactions: {str(e)}")
