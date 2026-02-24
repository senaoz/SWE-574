from typing import List, Tuple, Optional
from datetime import datetime
import math
from bson import ObjectId

from ..models.service import ServiceCreate, ServiceUpdate, ServiceResponse, ServiceFilters, ServiceStatus
from ..models.user import UserResponse
from ..core.database import get_database


class ServiceService:
    def __init__(self, db):
        self.db = db
        self.services_collection = db.services
        self.users_collection = db.users
    
    def _normalize_tags(self, tags) -> List[dict]:
        """Normalize tags to entity format (handle backward compatibility with string tags)"""
        if not tags:
            return []
        
        normalized = []
        for tag in tags:
            if isinstance(tag, str):
                # Legacy string format - convert to entity format
                normalized.append({"label": tag, "entityId": ""})
            elif isinstance(tag, dict):
                # Already in entity format
                normalized.append({
                    "label": tag.get("label", ""),
                    "entityId": tag.get("entityId", ""),
                    "description": tag.get("description"),
                    "aliases": tag.get("aliases")
                })
            else:
                # Fallback
                normalized.append({"label": str(tag), "entityId": ""})
        
        return normalized
    
    def _get_tag_labels_for_query(self, tags: List[str]) -> List[str]:
        """Extract tag labels from filter tags (which are strings) for querying"""
        # For filtering, we need to match against tag labels in the database
        # Tags in DB are now dicts with "label" field
        return tags  # Return as-is, MongoDB query will handle matching

    def _normalize_service_doc(self, service_doc: dict) -> dict:
        """Normalize service document for response (handles backward compatibility)"""
        # Ensure optional confirmation fields are set
        if "provider_confirmed" not in service_doc:
            service_doc["provider_confirmed"] = False
        if "receiver_confirmed_ids" not in service_doc:
            service_doc["receiver_confirmed_ids"] = []
        
        # Normalize max_participants - ensure it's always a valid integer >= 1
        if "max_participants" not in service_doc or service_doc["max_participants"] is None:
            service_doc["max_participants"] = 1
        elif not isinstance(service_doc["max_participants"], int) or service_doc["max_participants"] < 1:
            service_doc["max_participants"] = 1

        # Default is_remote for documents created before the field existed
        if "is_remote" not in service_doc:
            service_doc["is_remote"] = False
        
        # Normalize tags for backward compatibility
        if "tags" in service_doc:
            service_doc["tags"] = self._normalize_tags(service_doc["tags"])
        
        return service_doc

    async def create_service(self, service_data: ServiceCreate, user_id: str) -> ServiceResponse:
        """Create a new service"""
        try:
            # Use dict(exclude_none=False, exclude_unset=False) to include all fields
            # This ensures scheduling fields are saved to the database
            service_dict = service_data.dict(exclude_none=False, exclude_unset=False)
            # User cannot create offers (give help) when they must create a Need first
            if service_dict.get("service_type") == "offer":
                from .user_service import UserService
                user_service = UserService(self.db)
                if await user_service.requires_need_creation(user_id):
                    raise ValueError(
                        "You must create a Need before you can give help. "
                        "You've reached the 10-hour surplus limit."
                    )
            # Normalize tags to entity format
            if "tags" in service_dict:
                service_dict["tags"] = self._normalize_tags(service_dict["tags"])
            
            service_doc = {
                **service_dict,
                "user_id": ObjectId(user_id),
                "status": ServiceStatus.ACTIVE,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "matched_user_ids": [],
                "completed_at": None
            }
            
            # Ensure scheduling_type is always set (defaults to "open" if not provided)
            if "scheduling_type" not in service_doc or not service_doc["scheduling_type"]:
                service_doc["scheduling_type"] = "open"
            
            result = await self.services_collection.insert_one(service_doc)
            service_doc["_id"] = result.inserted_id
            
            return ServiceResponse(**service_doc)
        except Exception as e:
            raise ValueError(f"Error creating service: {str(e)}")

    async def get_service_by_id(self, service_id: str) -> Optional[ServiceResponse]:
        """Get service by ID"""
        try:
            service_doc = await self.services_collection.find_one({"_id": ObjectId(service_id)})
            if service_doc:
                service_doc = self._normalize_service_doc(service_doc)
                return ServiceResponse(**service_doc)
            return None
        except Exception:
            return None

    async def get_services(self, filters: ServiceFilters, page: int, limit: int) -> Tuple[List[ServiceResponse], int]:
        """Get services with filters and pagination"""
        try:
            # Build MongoDB query
            query = {}
            
            if filters.service_type:
                query["service_type"] = filters.service_type
            if filters.category:
                query["category"] = filters.category
            if filters.tags:
                # Tags are now dicts with "label" field, so we need to match against labels
                # Support both old string tags and new entity tags
                tag_labels = filters.tags
                query["$or"] = [
                    {"tags": {"$in": tag_labels}},  # Match old string format
                    {"tags.label": {"$in": tag_labels}}  # Match new entity format
                ]
            if filters.status:
                query["status"] = filters.status
            if filters.user_id:
                # Convert string user_id to ObjectId for database query
                user_id_obj = ObjectId(filters.user_id) if isinstance(filters.user_id, str) else filters.user_id
                query["user_id"] = user_id_obj
            if filters.is_remote is not None:
                query["is_remote"] = filters.is_remote
            
            # Handle location-based filtering
            if filters.location and filters.radius:
                # For location-based queries, we need to use aggregation pipeline
                pipeline = [
                    {
                        "$geoNear": {
                            "near": {
                                "type": "Point",
                                "coordinates": [filters.location.longitude, filters.location.latitude]
                            },
                            "distanceField": "distance",
                            "maxDistance": filters.radius * 1000,  # Convert km to meters
                            "spherical": True
                        }
                    }
                ]
                
                # Add other filters to the pipeline
                match_stage = {}
                if filters.service_type:
                    match_stage["service_type"] = filters.service_type
                if filters.category:
                    match_stage["category"] = filters.category
                if filters.tags:
                    # Tags are now dicts with "label" field, so we need to match against labels
                    tag_labels = filters.tags
                    match_stage["$or"] = [
                        {"tags": {"$in": tag_labels}},  # Match old string format
                        {"tags.label": {"$in": tag_labels}}  # Match new entity format
                    ]
                if filters.status:
                    match_stage["status"] = filters.status
                if filters.user_id:
                    # Convert string user_id to ObjectId for database query
                    user_id_obj = ObjectId(filters.user_id) if isinstance(filters.user_id, str) else filters.user_id
                    match_stage["user_id"] = user_id_obj
                if filters.is_remote is not None:
                    match_stage["is_remote"] = filters.is_remote
                
                if match_stage:
                    pipeline.append({"$match": match_stage})
                
                # Add pagination
                pipeline.extend([
                    {"$sort": {"created_at": -1}},
                    {"$skip": (page - 1) * limit},
                    {"$limit": limit}
                ])
                
                # Get total count with the same filters
                count_pipeline = pipeline[:-2]  # Remove skip and limit
                count_pipeline.append({"$count": "total"})
                
                # Execute queries
                services_cursor = self.services_collection.aggregate(pipeline)
                count_cursor = self.services_collection.aggregate(count_pipeline)
                
                services = []
                async for service_doc in services_cursor:
                    # Remove the distance field added by geoNear
                    service_doc.pop("distance", None)
                    # Normalize service document
                    service_doc = self._normalize_service_doc(service_doc)
                    services.append(ServiceResponse(**service_doc))
                
                # Get total count
                total = 0
                async for count_doc in count_cursor:
                    total = count_doc["total"]
                
                return services, total
            else:
                # Regular query without location filtering
                # Get total count
                total = await self.services_collection.count_documents(query)
                
                # Get services with pagination
                skip = (page - 1) * limit
                cursor = self.services_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
                
                services = []
                async for service_doc in cursor:
                    # Normalize service document
                    service_doc = self._normalize_service_doc(service_doc)
                    services.append(ServiceResponse(**service_doc))
                
                return services, total
        except Exception as e:
            raise ValueError(f"Error fetching services: {str(e)}")

    async def update_service(self, service_id: str, service_update: ServiceUpdate, user_id: Optional[str] = None) -> Optional[ServiceResponse]:
        """Update service"""
        try:
            # Get current service to check deadline
            current_service = await self.get_service_by_id(service_id)
            if not current_service:
                return None
            
            # If status is being updated, validate the transition
            if service_update.status is not None:
                # Only allow status updates by service owner
                if user_id and str(current_service.user_id) != user_id:
                    raise ValueError("Only the service owner can update the service status")
                
                # Validate status transitions
                current_status = current_service.status
                new_status = service_update.status
                
                # Allow transitions: active -> in_progress, active -> cancelled, active -> expired, in_progress -> completed, in_progress -> cancelled
                # Note: Cannot transition directly from ACTIVE to COMPLETED - must go through IN_PROGRESS first
                valid_transitions = {
                    ServiceStatus.ACTIVE: [ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED, ServiceStatus.EXPIRED],
                    ServiceStatus.IN_PROGRESS: [ServiceStatus.COMPLETED, ServiceStatus.CANCELLED],
                }
                
                if current_status in valid_transitions:
                    if new_status not in valid_transitions[current_status]:
                        raise ValueError(f"Cannot transition from {current_status} to {new_status}")
                elif current_status == new_status:
                    # Same status is allowed
                    pass
                else:
                    # For other statuses, only allow if it's the same
                    if current_status != new_status:
                        raise ValueError(f"Cannot transition from {current_status} to {new_status}")
            
            update_data = {k: v for k, v in service_update.dict().items() if v is not None}
            if not update_data:
                return await self.get_service_by_id(service_id)
            
            # Normalize tags if they're being updated
            if "tags" in update_data:
                update_data["tags"] = self._normalize_tags(update_data["tags"])
            
            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.services_collection.update_one(
                {"_id": ObjectId(service_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                updated_service = await self.get_service_by_id(service_id)
                
                # Check if deadline has passed after update
                if updated_service.deadline:
                    if updated_service.deadline < datetime.utcnow():
                        # Deadline passed, reject pending requests
                        from .join_request_service import JoinRequestService
                        join_request_service = JoinRequestService(self.db)
                        try:
                            await join_request_service.reject_pending_requests_for_service(
                                service_id,
                                "Service deadline has passed"
                            )
                        except Exception as e:
                            print(f"Warning: Failed to reject pending requests: {str(e)}")
                
                return updated_service
            return None
        except Exception as e:
            raise ValueError(f"Error updating service: {str(e)}")

    async def delete_service(self, service_id: str) -> bool:
        """Delete service"""
        try:
            result = await self.services_collection.delete_one({"_id": ObjectId(service_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise ValueError(f"Error deleting service: {str(e)}")

    async def match_service(self, service_id: str, user_id: str) -> bool:
        """Match with a service"""
        try:
            service = await self.get_service_by_id(service_id)
            if not service:
                raise ValueError("Service not found")
            
            if service.status != ServiceStatus.ACTIVE:
                raise ValueError("Service is not available for matching")
            
            if str(service.user_id) == user_id:
                raise ValueError("Cannot match with your own service")
            
            # Update service status and add user to matched_user_ids
            result = await self.services_collection.update_one(
                {"_id": ObjectId(service_id)},
                {
                    "$addToSet": {"matched_user_ids": ObjectId(user_id)},
                    "$set": {
                        "status": ServiceStatus.IN_PROGRESS,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise ValueError(f"Error matching service: {str(e)}")

    async def confirm_service_completion(self, service_id: str, user_id: str) -> ServiceResponse:
        """Confirm service completion by provider or receiver"""
        try:
            service = await self.get_service_by_id(service_id)
            if not service:
                raise ValueError("Service not found")
            
            if service.status != ServiceStatus.IN_PROGRESS:
                raise ValueError("Service is not in progress")
            
            if not service.matched_user_ids or len(service.matched_user_ids) == 0:
                raise ValueError("Service has no matched users")
            
            # Determine which confirmation to update
            # Convert user_id to ObjectId for comparison
            user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
            if not user_id_obj:
                raise ValueError("Invalid user ID")
            
            is_provider = str(service.user_id) == user_id
            is_receiver = any(
                str(matched_id) == user_id or (isinstance(matched_id, ObjectId) and str(matched_id) == user_id)
                for matched_id in service.matched_user_ids
            )
            
            if not is_provider and not is_receiver:
                raise ValueError("Not authorized to confirm this service")
            
            # Provider cannot confirm (give help) when they must create a Need first
            if is_provider:
                from .user_service import UserService
                user_service = UserService(self.db)
                if await user_service.requires_need_creation(user_id):
                    raise ValueError(
                        "You must create a Need before you can give help. "
                        "You've reached the 10-hour surplus limit."
                    )
            
            # Update the appropriate confirmation
            if is_provider:
                # Set provider_confirmed
                result = await self.services_collection.update_one(
                    {"_id": ObjectId(service_id)},
                    {
                        "$set": {
                            "provider_confirmed": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            if is_receiver:
                # Add user to receiver_confirmed_ids list
                result = await self.services_collection.update_one(
                    {"_id": ObjectId(service_id)},
                    {
                        "$addToSet": {"receiver_confirmed_ids": user_id_obj},
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
            
            # Fetch the latest service document from database to check completion status
            # We need fresh data after the update
            service_doc = await self.services_collection.find_one({"_id": ObjectId(service_id)})
            if not service_doc:
                raise ValueError("Service not found after update")
            
            provider_confirmed = service_doc.get("provider_confirmed", False)
            receiver_confirmed_ids = service_doc.get("receiver_confirmed_ids", [])
            matched_user_ids = service_doc.get("matched_user_ids", [])
            
            # Convert all IDs to strings for comparison
            matched_user_ids_str = [str(mid) for mid in matched_user_ids]
            receiver_confirmed_ids_str = [str(rid) for rid in receiver_confirmed_ids]
            
            # Check if all receivers have confirmed
            all_receivers_confirmed = (
                len(matched_user_ids) > 0 and
                len(receiver_confirmed_ids_str) == len(matched_user_ids_str) and
                all(rid_str in matched_user_ids_str for rid_str in receiver_confirmed_ids_str)
            )
            
            # Debug logging (can be removed in production)
            print(f"Service {service_id} completion check:")
            print(f"  provider_confirmed: {provider_confirmed}")
            print(f"  matched_user_ids: {matched_user_ids_str}")
            print(f"  receiver_confirmed_ids: {receiver_confirmed_ids_str}")
            print(f"  all_receivers_confirmed: {all_receivers_confirmed}")
            
            if provider_confirmed and all_receivers_confirmed:
                # Provider and all receivers confirmed - complete the service and update TimeBank
                print(f"Both parties confirmed for service {service_id}, finalizing completion...")
                # Get the service response object for finalization
                updated_service = await self.get_service_by_id(service_id)
                try:
                    finalize_result = await self._finalize_service_completion(service_id, updated_service)
                    # Verify the status was updated
                    final_service_doc = await self.services_collection.find_one({"_id": ObjectId(service_id)})
                    if final_service_doc and final_service_doc.get("status") == ServiceStatus.COMPLETED:
                        if finalize_result:
                            print(f"Service {service_id} successfully finalized: status=COMPLETED, TimeBank updated")
                        else:
                            print(f"WARNING: Service {service_id} marked as COMPLETED but TimeBank transactions failed (check logs above for details)")
                    else:
                        print(f"ERROR: Service {service_id} finalization completed but status is {final_service_doc.get('status') if final_service_doc else 'unknown'}")
                except Exception as finalize_error:
                    print(f"Error finalizing service completion: {str(finalize_error)}")
                    import traceback
                    print(traceback.format_exc())
                    # Don't fail the confirmation, but log the error
                    raise ValueError(f"Service confirmed but failed to finalize: {str(finalize_error)}")
            
            # Return updated service with confirmation fields
            final_service = await self.get_service_by_id(service_id)
            # Log the final status for debugging
            if final_service:
                print(f"Returning service {service_id} with status: {final_service.status}")
            return final_service
        except Exception as e:
            raise ValueError(f"Error confirming service completion: {str(e)}")
    
    async def _finalize_service_completion(self, service_id: str, service: ServiceResponse) -> bool:
        """Finalize service completion and update TimeBank (called when both parties confirm)"""
        try:
            # Update service status
            await self.services_collection.update_one(
                {"_id": ObjectId(service_id)},
                {
                    "$set": {
                        "status": ServiceStatus.COMPLETED,
                        "completed_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Reject all pending join requests for this service
            from .join_request_service import JoinRequestService
            join_request_service = JoinRequestService(self.db)
            try:
                await join_request_service.reject_pending_requests_for_service(
                    service_id, 
                    "Service has been completed"
                )
            except Exception as e:
                # Log error but don't fail the completion
                print(f"Warning: Failed to reject pending requests: {str(e)}")
            
            # Update TimeBank balances
            from .user_service import UserService
            user_service = UserService(self.db)
            
            # Provider earns hours for each participant
            provider_hours = service.estimated_duration * len(service.matched_user_ids)
            provider_success = await user_service.add_timebank_transaction(
                str(service.user_id),
                provider_hours,
                f"Provided service: {service.title} (to {len(service.matched_user_ids)} participant(s))",
                service_id
            )
            
            if not provider_success:
                # Check why provider transaction failed
                provider_user = await user_service.get_user_by_id(str(service.user_id))
                if provider_user:
                    if provider_hours > 0 and provider_user.timebank_balance >= 10.0:
                        print(f"WARNING: Provider {service.user_id} cannot earn more hours (balance: {provider_user.timebank_balance}, limit: 10.0)")
                    else:
                        print(f"WARNING: Provider TimeBank transaction failed for unknown reason (balance: {provider_user.timebank_balance if provider_user else 'N/A'})")
                else:
                    print(f"WARNING: Provider user not found: {service.user_id}")
            
            # Each receiver spends hours
            receiver_success = True
            receiver_failures = []
            for matched_user_id in service.matched_user_ids:
                success = await user_service.add_timebank_transaction(
                    str(matched_user_id),
                    -service.estimated_duration,
                    f"Received service: {service.title}",
                    service_id
                )
                if not success:
                    receiver_success = False
                    # Check why receiver transaction failed
                    receiver_user = await user_service.get_user_by_id(str(matched_user_id))
                    if receiver_user:
                        new_balance = receiver_user.timebank_balance - service.estimated_duration
                        if new_balance < 0:
                            receiver_failures.append(f"User {matched_user_id} has insufficient balance ({receiver_user.timebank_balance} < {service.estimated_duration})")
                        else:
                            receiver_failures.append(f"User {matched_user_id} transaction failed for unknown reason")
                    else:
                        receiver_failures.append(f"User {matched_user_id} not found")
            
            if receiver_failures:
                print(f"WARNING: Receiver TimeBank transaction failures: {', '.join(receiver_failures)}")
            
            # Service is already marked as COMPLETED, so we return True even if TimeBank updates failed
            # The TimeBank failures are logged but don't prevent service completion
            if not provider_success or not receiver_success:
                print(f"WARNING: Service {service_id} marked as COMPLETED but some TimeBank transactions failed")
                return False  # Return False to indicate TimeBank issues, but service is still completed
            
            return True
        except Exception as e:
            raise ValueError(f"Error finalizing service completion: {str(e)}")

    async def cancel_service(self, service_id: str, user_id: str) -> bool:
        """Cancel a service (only by owner or matched user)"""
        try:
            service = await self.get_service_by_id(service_id)
            if not service:
                raise ValueError("Service not found")
            
            # Check if user is authorized to cancel this service
            is_provider = str(service.user_id) == user_id
            is_participant = any(str(matched_id) == user_id for matched_id in service.matched_user_ids)
            if not is_provider and not is_participant:
                raise ValueError("Not authorized to cancel this service")
            
            # Check if service can be cancelled (not completed)
            if service.status == ServiceStatus.COMPLETED:
                raise ValueError("Cannot cancel completed service")
            
            # Update service status
            result = await self.services_collection.update_one(
                {"_id": ObjectId(service_id)},
                {
                    "$set": {
                        "status": ServiceStatus.CANCELLED,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise ValueError(f"Error cancelling service: {str(e)}")

    async def get_service_participants(self, service_id: str) -> List[dict]:
        """Get service participants (provider and matched user)"""
        try:
            service = await self.get_service_by_id(service_id)
            if not service:
                raise ValueError("Service not found")
            
            participants = []
            
            # Get provider info - convert user_id to ObjectId if it's a string
            provider_id = ObjectId(service.user_id) if isinstance(service.user_id, str) else service.user_id
            provider = await self.users_collection.find_one({"_id": provider_id})
            if provider:
                # Handle ObjectId conversion
                provider_id_str = str(provider["_id"]) if isinstance(provider["_id"], ObjectId) else provider["_id"]
                participants.append({
                    "id": provider_id_str,
                    "username": provider["username"],
                    "full_name": provider.get("full_name"),
                    "role": "provider"
                })
            
            # Get matched users info if exists
            if service.matched_user_ids:
                for matched_user_id in service.matched_user_ids:
                    # Convert to ObjectId if it's a string
                    matched_id = ObjectId(matched_user_id) if isinstance(matched_user_id, str) else matched_user_id
                    matched_user = await self.users_collection.find_one({"_id": matched_id})
                    if matched_user:
                        # Handle ObjectId conversion
                        matched_id_str = str(matched_user["_id"]) if isinstance(matched_user["_id"], ObjectId) else matched_user["_id"]
                        participants.append({
                            "id": matched_id_str,
                            "username": matched_user["username"],
                            "full_name": matched_user.get("full_name"),
                            "role": "participant"
                        })
            
            return participants
        except Exception as e:
            raise ValueError(f"Error fetching participants: {str(e)}")

    async def check_and_handle_expired_services(self) -> int:
        """Check for services with passed deadlines and reject pending requests"""
        try:
            from .join_request_service import JoinRequestService
            
            now = datetime.utcnow()
            
            # Find active services with passed deadlines
            expired_services = await self.services_collection.find({
                "status": {"$in": [ServiceStatus.ACTIVE, ServiceStatus.IN_PROGRESS]},
                "deadline": {"$exists": True, "$lt": now}
            }).to_list(length=None)
            
            join_request_service = JoinRequestService(self.db)
            total_rejected = 0
            
            for service in expired_services:
                # Update service status to expired if it's still active
                if service["status"] == ServiceStatus.ACTIVE:
                    await self.services_collection.update_one(
                        {"_id": service["_id"]},
                        {
                            "$set": {
                                "status": ServiceStatus.EXPIRED,
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                
                # Reject all pending requests
                try:
                    rejected_count = await join_request_service.reject_pending_requests_for_service(
                        str(service["_id"]),
                        "Service deadline has passed"
                    )
                    total_rejected += rejected_count
                except Exception as e:
                    print(f"Warning: Failed to reject requests for service {service['_id']}: {str(e)}")
            
            return total_rejected
        except Exception as e:
            raise ValueError(f"Error checking expired services: {str(e)}")

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
