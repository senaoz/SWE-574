from typing import List, Tuple, Optional
from datetime import datetime
from bson import ObjectId

from ..models.join_request import JoinRequestCreate, JoinRequestUpdate, JoinRequestResponse, JoinRequestStatus
from ..core.database import get_database


class JoinRequestService:
    def __init__(self, db):
        self.db = db
        self.join_requests_collection = db.join_requests
        self.users_collection = db.users
        self.services_collection = db.services

    async def create_join_request(self, request_data: JoinRequestCreate, user_id: str) -> JoinRequestResponse:
        """Create a new join request"""
        try:
            # Check if service exists
            service = await self.services_collection.find_one({"_id": ObjectId(request_data.service_id)})
            if not service:
                raise ValueError("Service not found")
            
            # Check if user already has a pending request for this service
            existing_request = await self.join_requests_collection.find_one({
                "service_id": ObjectId(request_data.service_id),
                "user_id": ObjectId(user_id),
                "status": JoinRequestStatus.PENDING
            })
            if existing_request:
                raise ValueError("You already have a pending request for this service")
            
            # Check if user is the service owner
            if str(service["user_id"]) == user_id:
                raise ValueError("Cannot request to join your own service")
            
            request_doc = {
                **request_data.dict(),
                "service_id": ObjectId(request_data.service_id),
                "user_id": ObjectId(user_id),
                "status": JoinRequestStatus.PENDING,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.join_requests_collection.insert_one(request_doc)
            request_doc["_id"] = result.inserted_id
            
            # Get user info for the response
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                request_doc["user"] = {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "bio": user.get("bio")
                }
            
            return JoinRequestResponse(**request_doc)
        except Exception as e:
            raise ValueError(f"Error creating join request: {str(e)}")

    async def get_requests_by_service(self, service_id: str, page: int = 1, limit: int = 20) -> Tuple[List[JoinRequestResponse], int]:
        """Get join requests for a specific service"""
        try:
            query = {"service_id": ObjectId(service_id)}
            
            # Get total count
            total = await self.join_requests_collection.count_documents(query)
            
            # Get requests with pagination
            skip = (page - 1) * limit
            cursor = self.join_requests_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            requests = []
            async for request_doc in cursor:
                # Get user info for each request
                user = await self.users_collection.find_one({"_id": request_doc["user_id"]})
                if user:
                    request_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                requests.append(JoinRequestResponse(**request_doc))
            
            return requests, total
        except Exception as e:
            raise ValueError(f"Error fetching join requests: {str(e)}")

    async def get_user_requests(self, user_id: str, page: int = 1, limit: int = 20, status_filter: Optional[str] = None) -> Tuple[List[JoinRequestResponse], int]:
        """Get join requests made by a user"""
        try:
            query = {"user_id": ObjectId(user_id)}
            
            # Add status filter if provided
            if status_filter:
                query["status"] = status_filter
            
            # Get total count
            total = await self.join_requests_collection.count_documents(query)
            
            # Get requests with pagination
            skip = (page - 1) * limit
            cursor = self.join_requests_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            requests = []
            async for request_doc in cursor:
                # Get service info for each request
                service = await self.services_collection.find_one({"_id": request_doc["service_id"]})
                if service:
                    request_doc["service"] = {
                        "id": str(service["_id"]),
                        "title": service["title"],
                        "description": service.get("description"),
                        "category": service.get("category")
                    }
                
                requests.append(JoinRequestResponse(**request_doc))
            
            return requests, total
        except Exception as e:
            raise ValueError(f"Error fetching user requests: {str(e)}")

    async def update_request_status(self, request_id: str, update_data: JoinRequestUpdate, admin_user_id: str) -> JoinRequestResponse:
        """Update join request status (approve/reject)"""
        try:
            # Get the request
            request_doc = await self.join_requests_collection.find_one({"_id": ObjectId(request_id)})
            if not request_doc:
                raise ValueError("Join request not found")
            
            # Get the service to check if user is the owner
            service = await self.services_collection.find_one({"_id": request_doc["service_id"]})
            if not service:
                raise ValueError("Service not found")
            
            if str(service["user_id"]) != admin_user_id:
                raise ValueError("Only the service owner can approve/reject requests")
            
            print(f"Update data: {update_data}")
            print(f"matched_user_ids before: {service.get('matched_user_ids', [])}")
            
            # If approving, check max_participants limit BEFORE updating status
            if update_data.status == JoinRequestStatus.APPROVED:
                # Check max_participants limit (count BEFORE we approve this request)
                approved_count = await self.join_requests_collection.count_documents({
                    "service_id": request_doc["service_id"],
                    "status": JoinRequestStatus.APPROVED
                })
                
                max_participants = service.get("max_participants", 1)
                # Check if adding this approval would exceed the limit
                if approved_count >= max_participants:
                    raise ValueError(f"Service has reached maximum participants limit ({max_participants})")
            
            # Update the request
            update_fields = {
                "status": update_data.status,
                "updated_at": datetime.utcnow()
            }
            
            if update_data.admin_message:
                update_fields["admin_message"] = update_data.admin_message
            
            result = await self.join_requests_collection.update_one(
                {"_id": ObjectId(request_id)},
                {"$set": update_fields}
            )
            
            if result.modified_count == 0:
                raise ValueError("Failed to update join request")
            
            # If approved, update the service to match with the user and create a transaction
            if update_data.status == JoinRequestStatus.APPROVED:
                
                # Add user to matched_user_ids list (don't overwrite, use $addToSet)
                # Ensure user_id is an ObjectId
                user_id_to_add = request_doc["user_id"]
                if not isinstance(user_id_to_add, ObjectId):
                    user_id_to_add = ObjectId(user_id_to_add)
                
                update_result = await self.services_collection.update_one(
                    {"_id": request_doc["service_id"]},
                    {
                        "$addToSet": {"matched_user_ids": user_id_to_add},
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
                
                # Fetch updated service to verify the change
                updated_service = await self.services_collection.find_one({"_id": request_doc["service_id"]})
                print(f"matched_user_ids after: {updated_service.get('matched_user_ids', [])}")
                print(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
                
                # Automatically create a transaction for the approved request
                from .transaction_service import TransactionService
                from ..models.transaction import TransactionCreate
                transaction_service = TransactionService(self.db)
                
                try:
                    transaction_data = TransactionCreate(
                        service_id=str(request_doc["service_id"]),
                        provider_id=str(service["user_id"]),
                        requester_id=str(request_doc["user_id"]),
                        timebank_hours=service.get("estimated_duration", 0),
                        description=f"Service exchange: {service.get('title', 'Service')}"
                    )
                    await transaction_service.create_transaction(transaction_data)
                except Exception as e:
                    # Log error but don't fail the approval
                    print(f"Warning: Failed to create transaction for approved request: {str(e)}")
            
            # Get updated request with user info
            updated_request = await self.join_requests_collection.find_one({"_id": ObjectId(request_id)})
            user = await self.users_collection.find_one({"_id": updated_request["user_id"]})
            if user:
                updated_request["user"] = {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "bio": user.get("bio")
                }
            
            return JoinRequestResponse(**updated_request)
        except Exception as e:
            raise ValueError(f"Error updating join request: {str(e)}")

    async def get_request_by_id(self, request_id: str) -> Optional[JoinRequestResponse]:
        """Get join request by ID"""
        try:
            request_doc = await self.join_requests_collection.find_one({"_id": ObjectId(request_id)})
            if request_doc:
                # Get user info
                user = await self.users_collection.find_one({"_id": request_doc["user_id"]})
                if user:
                    request_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                return JoinRequestResponse(**request_doc)
            return None
        except Exception:
            return None

    async def cancel_user_request(self, request_id: str, user_id: str) -> JoinRequestResponse:
        """Cancel a join request (only by the user who created it)"""
        try:
            # Get the request
            request_doc = await self.join_requests_collection.find_one({"_id": ObjectId(request_id)})
            if not request_doc:
                raise ValueError("Join request not found")
            
            # Check if user is the owner of the request
            if str(request_doc["user_id"]) != user_id:
                raise ValueError("You can only cancel your own join requests")
            
            # Check if request is already cancelled or not pending
            if request_doc["status"] == JoinRequestStatus.CANCELLED:
                raise ValueError("Join request is already cancelled")
            
            if request_doc["status"] != JoinRequestStatus.PENDING:
                raise ValueError("You can only cancel pending requests")
            
            # Update the request status to cancelled
            result = await self.join_requests_collection.update_one(
                {"_id": ObjectId(request_id)},
                {
                    "$set": {
                        "status": JoinRequestStatus.CANCELLED,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count == 0:
                raise ValueError("Failed to cancel join request")
            
            # Get updated request with user info
            updated_request = await self.join_requests_collection.find_one({"_id": ObjectId(request_id)})
            user = await self.users_collection.find_one({"_id": updated_request["user_id"]})
            if user:
                updated_request["user"] = {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "bio": user.get("bio")
                }
            
            return JoinRequestResponse(**updated_request)
        except Exception as e:
            raise ValueError(f"Error cancelling join request: {str(e)}")

    async def get_pending_request_for_service(self, service_id: str, user_id: str) -> Optional[JoinRequestResponse]:
        """Get pending join request for a service by a user"""
        try:
            request_doc = await self.join_requests_collection.find_one({
                "service_id": ObjectId(service_id),
                "user_id": ObjectId(user_id),
                "status": JoinRequestStatus.PENDING
            })
            
            if request_doc:
                # Get user info
                user = await self.users_collection.find_one({"_id": request_doc["user_id"]})
                if user:
                    request_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                return JoinRequestResponse(**request_doc)
            return None
        except Exception:
            return None

    async def reject_pending_requests_for_service(self, service_id: str, reason: str = "Service deadline passed or service completed") -> int:
        """Reject all pending join requests for a service"""
        try:
            result = await self.join_requests_collection.update_many(
                {
                    "service_id": ObjectId(service_id),
                    "status": JoinRequestStatus.PENDING
                },
                {
                    "$set": {
                        "status": JoinRequestStatus.REJECTED,
                        "admin_message": reason,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count
        except Exception as e:
            raise ValueError(f"Error rejecting pending requests: {str(e)}")
