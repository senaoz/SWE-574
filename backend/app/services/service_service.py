from typing import List, Tuple, Optional, Set
from datetime import datetime
import math
import re
from bson import ObjectId

from ..models.service import (
    PotentialMatchItem,
    ServiceCreate,
    ServiceFilters,
    ServiceResponse,
    ServiceStatus,
    ServiceType,
    ServiceUpdate,
)
from ..models.user import UserResponse
from ..core.database import get_database
from .content_moderation_service import is_offensive

def _ensure_non_offensive(value: Optional[str], field_name: str) -> None:
    if isinstance(value, str) and value.strip() and is_offensive(value):
        raise ValueError(f"{field_name} contains offensive language")

class ServiceService:
    def __init__(self, db):
        self.db = db
        self.services_collection = db.services
        self.users_collection = db.users
        self.saved_services_collection = db.saved_services
        self.join_requests_collection = db.join_requests
        self.transactions_collection = db.transactions
    
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
        if "receiver_confirmed_ids" not in service_doc or service_doc["receiver_confirmed_ids"] is None or not isinstance(service_doc["receiver_confirmed_ids"], list):
            service_doc["receiver_confirmed_ids"] = []
        
        # Normalize max_participants - ensure it's always a valid integer >= 1
        if "max_participants" not in service_doc or service_doc["max_participants"] is None:
            service_doc["max_participants"] = 1
        elif not isinstance(service_doc["max_participants"], int) or service_doc["max_participants"] < 1:
            service_doc["max_participants"] = 1

        # Default is_remote for documents created before the field existed
        if "is_remote" not in service_doc:
            service_doc["is_remote"] = False

        # Normalize image_url (legacy) -> image_urls for backward compatibility
        if "image_urls" not in service_doc or service_doc["image_urls"] is None:
            service_doc["image_urls"] = []
        if not service_doc["image_urls"] and service_doc.get("image_url"):
            service_doc["image_urls"] = [service_doc["image_url"]]
        
        # Normalize tags for backward compatibility
        if "tags" in service_doc:
            service_doc["tags"] = self._normalize_tags(service_doc["tags"])
        
        return service_doc

    def _normalize_object_id(self, value):
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str) and ObjectId.is_valid(value):
            return ObjectId(value)
        return value

    def _get_tag_labels(self, tags) -> Set[str]:
        labels: Set[str] = set()
        if not tags:
            return labels

        for tag in tags:
            if isinstance(tag, str):
                label = tag
            elif isinstance(tag, dict):
                label = tag.get("label", "")
            else:
                label = str(tag)

            normalized_label = label.strip().lower()
            if normalized_label:
                labels.add(normalized_label)

        return labels

    def _tokenize_text(self, *values: Optional[str]) -> Set[str]:
        tokens: Set[str] = set()
        for value in values:
            if not value:
                continue
            for token in re.findall(r"\b[\wçğıöşü]+\b", str(value).lower()):
                if len(token) > 2:
                    tokens.add(token)
        return tokens

    def _jaccard_similarity(self, left: Set[str], right: Set[str]) -> float:
        if not left or not right:
            return 0.0

        union = left | right
        if not union:
            return 0.0

        return len(left & right) / len(union)

    def _is_service_full(self, service_doc: dict) -> bool:
        matched_user_ids = service_doc.get("matched_user_ids") or []
        if not isinstance(matched_user_ids, list):
            matched_user_ids = [matched_user_ids]

        max_participants = service_doc.get("max_participants", 1)
        try:
            max_participants = int(max_participants)
        except (TypeError, ValueError):
            max_participants = 1

        return max_participants > 0 and len(matched_user_ids) >= max_participants

    def _calculate_recency_score(self, service_doc: dict) -> float:
        created_at = service_doc.get("created_at")
        if not isinstance(created_at, datetime):
            return 0.0

        age_days = max((datetime.utcnow() - created_at).total_seconds() / 86400, 0)
        return math.exp(-age_days / 14)

    def _calculate_proximity_score(self, source_service: ServiceResponse, candidate_doc: dict) -> float:
        candidate_is_remote = bool(candidate_doc.get("is_remote"))
        if source_service.is_remote and candidate_is_remote:
            return 1.0
        if source_service.is_remote or candidate_is_remote:
            return 0.7

        candidate_location = candidate_doc.get("location") or {}
        latitude = candidate_location.get("latitude")
        longitude = candidate_location.get("longitude")
        if latitude is None or longitude is None:
            return 0.0

        distance_km = self.calculate_distance(
            source_service.location.latitude,
            source_service.location.longitude,
            latitude,
            longitude,
        )
        return math.exp(-distance_km / 10)

    def _resolve_potential_match_reason(
        self,
        tag_similarity: float,
        category_similarity: float,
        keyword_similarity: float,
        proximity_score: float,
        viewer_interest_match: float,
        viewer_activity_match: float,
        source_service: ServiceResponse,
        candidate_doc: dict,
    ) -> str:
        proximity_label = "Near this post"
        if source_service.is_remote or candidate_doc.get("is_remote"):
            proximity_label = "Works well remotely"

        reason_scores = [
            ("Matching tags", tag_similarity),
            ("Matches your interests", viewer_interest_match),
            ("Similar to your activity", viewer_activity_match),
            ("Same category", category_similarity),
            ("Similar details", keyword_similarity),
            (proximity_label, proximity_score),
        ]
        best_reason, best_score = max(reason_scores, key=lambda item: item[1])
        return best_reason if best_score > 0 else "Potential match"

    async def _get_saved_service_ids(self, user_id: str) -> Set[str]:
        cursor = self.saved_services_collection.find({"user_id": user_id})
        saved_docs = await cursor.to_list(length=500)
        return {str(doc["service_id"]) for doc in saved_docs if doc.get("service_id")}

    async def _get_applied_service_ids(self, user_id: str) -> Set[str]:
        user_id_filter = {"$or": [{"user_id": user_id}]}
        normalized_user_id = self._normalize_object_id(user_id)
        if isinstance(normalized_user_id, ObjectId):
            user_id_filter["$or"].append({"user_id": normalized_user_id})

        cursor = self.join_requests_collection.find(user_id_filter)
        request_docs = await cursor.to_list(length=500)
        return {
            str(doc["service_id"])
            for doc in request_docs
            if doc.get("service_id") and doc.get("status") != "cancelled"
        }

    async def _get_completed_service_ids(self, user_id: str) -> Set[str]:
        user_query = {"$or": [{"provider_id": user_id}, {"requester_id": user_id}]}
        normalized_user_id = self._normalize_object_id(user_id)
        if isinstance(normalized_user_id, ObjectId):
            user_query["$or"].extend(
                [{"provider_id": normalized_user_id}, {"requester_id": normalized_user_id}]
            )

        cursor = self.transactions_collection.find(user_query)
        transaction_docs = await cursor.to_list(length=500)

        completed_service_ids: Set[str] = set()
        for doc in transaction_docs:
            is_completed = (
                doc.get("status") == "completed"
                or doc.get("completed_at") is not None
                or (doc.get("provider_confirmed") and doc.get("requester_confirmed"))
            )
            if is_completed and doc.get("service_id"):
                completed_service_ids.add(str(doc["service_id"]))

        return completed_service_ids

    async def _collect_service_tags(self, service_ids: Set[str]) -> Set[str]:
        tag_labels: Set[str] = set()

        for service_id in service_ids:
            service_doc = await self.services_collection.find_one(
                {"_id": self._normalize_object_id(service_id)}
            )
            if not service_doc:
                continue

            normalized_service_doc = self._normalize_service_doc(service_doc)
            tag_labels.update(self._get_tag_labels(normalized_service_doc.get("tags")))

        return tag_labels

    async def _get_user_preference_profile(
        self, user_id: Optional[str]
    ) -> Tuple[Set[str], Set[str], Set[str], Set[str]]:
        if not user_id:
            return set(), set(), set(), set()

        user_doc = await self.users_collection.find_one(
            {"_id": self._normalize_object_id(user_id)}
        )
        interests = {
            interest.strip().lower()
            for interest in (user_doc or {}).get("interests", []) or []
            if isinstance(interest, str) and interest.strip()
        }

        saved_service_ids = await self._get_saved_service_ids(user_id)
        applied_service_ids = await self._get_applied_service_ids(user_id)
        completed_service_ids = await self._get_completed_service_ids(user_id)
        activity_service_ids = saved_service_ids | applied_service_ids | completed_service_ids
        activity_tags = await self._collect_service_tags(activity_service_ids)

        return interests, activity_tags, saved_service_ids, applied_service_ids

    async def _collect_match_candidates(
        self,
        source_service: ServiceResponse,
        target_service_type: ServiceType,
        current_tags: Set[str],
        current_category: str,
        current_keywords: Set[str],
        viewer_interest_tags: Set[str],
        viewer_activity_tags: Set[str],
        saved_service_ids: Set[str],
        applied_service_ids: Set[str],
        current_user_id: Optional[str],
        exclude_service_ids: Set[str],
    ) -> List[PotentialMatchItem]:
        cursor = (
            self.services_collection.find(
                {"service_type": target_service_type, "status": ServiceStatus.ACTIVE}
            )
            .sort("created_at", -1)
            .limit(200)
        )

        matches: List[PotentialMatchItem] = []
        async for candidate_doc in cursor:
            candidate_doc = self._normalize_service_doc(candidate_doc)
            candidate_id = str(candidate_doc.get("_id"))

            if candidate_id in exclude_service_ids:
                continue
            if current_user_id and (
                candidate_id in saved_service_ids or candidate_id in applied_service_ids
            ):
                continue
            if self._is_service_full(candidate_doc):
                continue

            candidate_tags = self._get_tag_labels(candidate_doc.get("tags"))
            candidate_category = str(candidate_doc.get("category") or "").strip().lower()
            candidate_keywords = self._tokenize_text(
                candidate_doc.get("title"),
                candidate_doc.get("description"),
                candidate_doc.get("category"),
            )

            tag_similarity = self._jaccard_similarity(current_tags, candidate_tags)
            common_tag_count = len(current_tags & candidate_tags)
            category_similarity = 1.0 if current_category and current_category == candidate_category else 0.0
            keyword_similarity = self._jaccard_similarity(current_keywords, candidate_keywords)

            # One shared tag is enough to qualify; category/keyword similarity can also qualify.
            if common_tag_count == 0 and category_similarity == 0 and keyword_similarity == 0:
                continue

            proximity_score = self._calculate_proximity_score(source_service, candidate_doc)
            recency_score = self._calculate_recency_score(candidate_doc)
            viewer_interest_match = self._jaccard_similarity(
                viewer_interest_tags, candidate_tags
            )
            viewer_activity_match = self._jaccard_similarity(
                viewer_activity_tags, candidate_tags
            )

            base_score = (
                0.45 * tag_similarity
                + 0.20 * category_similarity
                + 0.15 * keyword_similarity
                + 0.15 * proximity_score
                + 0.05 * recency_score
            )
            final_score = base_score
            if viewer_interest_tags or viewer_activity_tags:
                final_score = (
                    0.85 * base_score
                    + 0.10 * viewer_interest_match
                    + 0.05 * viewer_activity_match
                )

            if final_score <= 0:
                continue

            matches.append(
                PotentialMatchItem(
                    service=ServiceResponse(**candidate_doc),
                    relevance_score=round(final_score, 4),
                    reason_label=self._resolve_potential_match_reason(
                        tag_similarity=tag_similarity,
                        category_similarity=category_similarity,
                        keyword_similarity=keyword_similarity,
                        proximity_score=proximity_score,
                        viewer_interest_match=viewer_interest_match,
                        viewer_activity_match=viewer_activity_match,
                        source_service=source_service,
                        candidate_doc=candidate_doc,
                    ),
                )
            )

        matches.sort(
            key=lambda item: (
                item.relevance_score,
                item.service.created_at,
            ),
            reverse=True,
        )
        return matches

    async def get_potential_matches(
        self,
        service_id: str,
        current_user_id: Optional[str] = None,
        limit: int = 6,
    ) -> Tuple[List[PotentialMatchItem], int]:
        current_service = await self.get_service_by_id(service_id)
        if not current_service:
            return [], 0

        opposite_service_type = (
            ServiceType.NEED
            if current_service.service_type == ServiceType.OFFER
            else ServiceType.OFFER
        )
        current_tags = self._get_tag_labels(current_service.tags)
        current_category = (current_service.category or "").strip().lower()
        current_keywords = self._tokenize_text(
            current_service.title,
            current_service.description,
            current_service.category,
        )
        (
            viewer_interest_tags,
            viewer_activity_tags,
            saved_service_ids,
            applied_service_ids,
        ) = await self._get_user_preference_profile(current_user_id)
        exclude_service_ids = {service_id}

        potential_matches = await self._collect_match_candidates(
            source_service=current_service,
            target_service_type=opposite_service_type,
            current_tags=current_tags,
            current_category=current_category,
            current_keywords=current_keywords,
            viewer_interest_tags=viewer_interest_tags,
            viewer_activity_tags=viewer_activity_tags,
            saved_service_ids=saved_service_ids,
            applied_service_ids=applied_service_ids,
            current_user_id=current_user_id,
            exclude_service_ids=exclude_service_ids,
        )

        if len(potential_matches) < limit:
            exclude_service_ids.update(
                {item.service.id for item in potential_matches}
            )
            fallback_matches = await self._collect_match_candidates(
                source_service=current_service,
                target_service_type=current_service.service_type,
                current_tags=current_tags,
                current_category=current_category,
                current_keywords=current_keywords,
                viewer_interest_tags=viewer_interest_tags,
                viewer_activity_tags=viewer_activity_tags,
                saved_service_ids=saved_service_ids,
                applied_service_ids=applied_service_ids,
                current_user_id=current_user_id,
                exclude_service_ids=exclude_service_ids,
            )
            potential_matches.extend(
                fallback_matches[: max(limit - len(potential_matches), 0)]
            )

        total = len(potential_matches)
        return potential_matches[:limit], total

    async def create_service(self, service_data: ServiceCreate, user_id: str) -> ServiceResponse:
        """Create a new service"""
        try:
            # Use dict(exclude_none=False, exclude_unset=False) to include all fields
            # This ensures scheduling fields are saved to the database
            service_dict = service_data.dict(exclude_none=False, exclude_unset=False)

            _ensure_non_offensive(service_dict.get("title"), "Title")
            _ensure_non_offensive(service_dict.get("description"), "Description")
            _ensure_non_offensive(service_dict.get("open_availability"), "Open availability")
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

            _ensure_non_offensive(update_data.get("title"), "Title")
            _ensure_non_offensive(update_data.get("description"), "Description")
            _ensure_non_offensive(update_data.get("open_availability"), "Open availability")

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

    async def complete_service(self, service_id: str, user_id: str) -> bool:
        """Mark service as completed (owner only). Updates status and linked transactions."""
        service = await self.get_service_by_id(service_id)
        if not service:
            raise ValueError("Service not found")
        if str(service.user_id) != user_id:
            raise ValueError("Only the service owner can mark the service as completed")
        if service.status not in (ServiceStatus.ACTIVE, ServiceStatus.IN_PROGRESS):
            raise ValueError("Service is not in a state that can be completed")
        # Only owners of OFFER services are constrained by the "must create need"
        # rule because that rule applies while giving help.
        if service.service_type == "offer":
            from .user_service import UserService
            user_service = UserService(self.db)
            if await user_service.requires_need_creation(user_id):
                raise ValueError(
                    "You must create a Need before you can give help. "
                    "You've reached the 10-hour surplus limit."
                )
        await self._ensure_transactions_for_approved_requests(service_id, service)
        return await self._finalize_service_completion(service_id, service)

    async def _ensure_transactions_for_approved_requests(
        self,
        service_id: str,
        service: ServiceResponse,
    ) -> None:
        """Backfill missing transactions for approved join requests."""
        approved_requests = await self.db.join_requests.find(
            {"service_id": ObjectId(service_id), "status": "approved"}
        ).to_list(length=None)

        if not approved_requests:
            return

        from .transaction_service import TransactionService
        from ..models.transaction import TransactionCreate

        transaction_service = TransactionService(self.db)
        owner_id = str(service.user_id)
        duration = float(service.estimated_duration)
        title = service.title or "Service"

        for req in approved_requests:
            applicant_id = str(req["user_id"])
            if service.service_type == "need":
                provider_id = applicant_id
                requester_id = owner_id
            else:
                provider_id = owner_id
                requester_id = applicant_id

            existing_tx = await self.db.transactions.find_one(
                {
                    "service_id": ObjectId(service_id),
                    "provider_id": ObjectId(provider_id),
                    "requester_id": ObjectId(requester_id),
                }
            )
            if existing_tx:
                continue

            try:
                await transaction_service.create_transaction(
                    TransactionCreate(
                        service_id=service_id,
                        provider_id=provider_id,
                        requester_id=requester_id,
                        timebank_hours=duration,
                        description=f"Service exchange: {title}",
                    )
                )
            except Exception as e:
                raise ValueError(
                    f"Could not create transaction for approved participant {applicant_id}: {str(e)}"
                )

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
            
            # TimeBank is updated only when BOTH provider and requester confirm each
            # transaction (via confirm_transaction_completion -> _finalize_transaction).
            # Do NOT update TimeBank here — the transaction path is the single source of truth.
            from ..models.transaction import TransactionStatus
            transactions_collection = self.db.transactions

            # Record owner's confirmation on all linked transactions.
            # Offer owner is provider; need owner is requester.
            owner_confirm_field = (
                "provider_confirmed"
                if service.service_type == "offer"
                else "requester_confirmed"
            )
            await transactions_collection.update_many(
                {"service_id": ObjectId(service_id), "status": {"$ne": TransactionStatus.COMPLETED}},
                {
                    "$set": {
                        owner_confirm_field: True,
                        "updated_at": datetime.utcnow(),
                    }
                }
            )
            
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
