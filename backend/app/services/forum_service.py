from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.forum import (
    ForumDiscussionCreate, ForumDiscussionUpdate, ForumDiscussionResponse,
    ForumEventCreate, ForumEventUpdate, ForumEventResponse,
    ForumCommentCreate, ForumCommentUpdate, ForumCommentResponse,
)


class ForumService:
    def __init__(self, db):
        self.db = db
        self.discussions = db.forum_discussions
        self.events = db.forum_events
        self.forum_comments = db.forum_comments
        self.users = db.users
        self.services = db.services

    # ---- helpers ----

    async def _enrich_user(self, doc: dict) -> dict:
        """Attach author summary to a document."""
        uid = doc.get("user_id")
        if uid:
            user = await self.users.find_one({"_id": uid if isinstance(uid, ObjectId) else ObjectId(uid)})
            if user:
                doc["user"] = {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "profile_picture": user.get("profile_picture"),
                }
        return doc

    async def _enrich_service(self, doc: dict) -> dict:
        """Attach linked service summary to an event document."""
        sid = doc.get("service_id")
        if sid:
            oid = sid if isinstance(sid, ObjectId) else ObjectId(sid)
            svc = await self.services.find_one({"_id": oid})
            if svc:
                doc["service"] = {
                    "id": str(svc["_id"]),
                    "title": svc.get("title"),
                    "service_type": svc.get("service_type"),
                }
        return doc

    async def _comment_count(self, target_type: str, target_id) -> int:
        oid = target_id if isinstance(target_id, ObjectId) else ObjectId(str(target_id))
        return await self.forum_comments.count_documents({
            "target_type": target_type,
            "$or": [{"target_id": oid}, {"target_id": str(oid)}],
        })

    # ---- Discussions ----

    async def create_discussion(self, data: ForumDiscussionCreate, user_id: str) -> ForumDiscussionResponse:
        doc = {
            **data.dict(),
            "user_id": ObjectId(user_id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.discussions.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc = await self._enrich_user(doc)
        doc["comment_count"] = 0
        return ForumDiscussionResponse(**doc)

    def _upvote_fields(self, doc: dict, user_id: Optional[str]) -> dict:
        """Populate upvote_count and user_upvoted from the upvoted_by array."""
        upvoted_by = doc.get("upvoted_by") or []
        doc["upvote_count"] = doc.get("upvote_count") or len(upvoted_by)
        doc["user_upvoted"] = user_id in [str(uid) for uid in upvoted_by] if user_id else False
        return doc

    async def get_discussions(
        self,
        page: int = 1,
        limit: int = 20,
        tag: Optional[str] = None,
        q: Optional[str] = None,
        sort_by: str = "created_at",
        user_id: Optional[str] = None,
    ) -> Tuple[List[ForumDiscussionResponse], int]:
        query: dict = {}
        if tag:
            query["tags.label"] = tag
        if q:
            query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"body": {"$regex": q, "$options": "i"}},
            ]

        sort_field = "upvote_count" if sort_by == "upvote_count" else "created_at"
        total = await self.discussions.count_documents(query)
        skip = (page - 1) * limit
        cursor = self.discussions.find(query).sort(sort_field, -1).skip(skip).limit(limit)

        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc["comment_count"] = await self._comment_count("discussion", doc["_id"])
            doc = self._upvote_fields(doc, user_id)
            results.append(ForumDiscussionResponse(**doc))
        return results, total

    async def get_discussion_by_id(self, discussion_id: str, user_id: Optional[str] = None) -> Optional[ForumDiscussionResponse]:
        doc = await self.discussions.find_one({"_id": ObjectId(discussion_id)})
        if not doc:
            return None
        doc = await self._enrich_user(doc)
        doc["comment_count"] = await self._comment_count("discussion", doc["_id"])
        doc = self._upvote_fields(doc, user_id)
        return ForumDiscussionResponse(**doc)

    async def update_discussion(
        self, discussion_id: str, data: ForumDiscussionUpdate, user_id: str
    ) -> Optional[ForumDiscussionResponse]:
        existing = await self.discussions.find_one({"_id": ObjectId(discussion_id)})
        if not existing:
            raise ValueError("Discussion not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to update this discussion")

        update_data = {k: v for k, v in data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        await self.discussions.update_one({"_id": ObjectId(discussion_id)}, {"$set": update_data})
        return await self.get_discussion_by_id(discussion_id)

    async def delete_discussion(self, discussion_id: str, user_id: str) -> bool:
        existing = await self.discussions.find_one({"_id": ObjectId(discussion_id)})
        if not existing:
            raise ValueError("Discussion not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to delete this discussion")
        result = await self.discussions.delete_one({"_id": ObjectId(discussion_id)})
        if result.deleted_count:
            await self.forum_comments.delete_many({
                "target_type": "discussion",
                "$or": [{"target_id": ObjectId(discussion_id)}, {"target_id": discussion_id}],
            })
        return result.deleted_count > 0

    # ---- Events ----

    def _populate_attendee_fields(self, doc: dict) -> dict:
        """Ensure attendee_ids / attendee_count are present on event docs."""
        raw = doc.get("attendee_ids") or []
        doc["attendee_ids"] = [str(aid) for aid in raw]
        doc["attendee_count"] = len(doc["attendee_ids"])
        return doc

    async def create_event(self, data: ForumEventCreate, user_id: str) -> ForumEventResponse:
        doc = data.dict()
        doc["user_id"] = ObjectId(user_id)
        if doc.get("service_id"):
            svc = await self.services.find_one({"_id": ObjectId(doc["service_id"])})
            if not svc:
                raise ValueError("Linked service not found")
            doc["service_id"] = ObjectId(doc["service_id"])
        else:
            doc["service_id"] = None
        doc["attendee_ids"] = []
        doc["created_at"] = datetime.utcnow()
        doc["updated_at"] = datetime.utcnow()

        result = await self.events.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc = await self._enrich_user(doc)
        doc = await self._enrich_service(doc)
        doc["comment_count"] = 0
        doc = self._populate_attendee_fields(doc)
        return ForumEventResponse(**doc)

    async def get_events(
        self,
        page: int = 1,
        limit: int = 20,
        tag: Optional[str] = None,
        q: Optional[str] = None,
        has_location: bool = False,
        user_id: Optional[str] = None,
        sort_by: str = "event_at",
    ) -> Tuple[List[ForumEventResponse], int]:
        query: dict = {}
        if tag:
            query["tags.label"] = tag
        if q:
            query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
            ]
        if has_location:
            query["latitude"] = {"$ne": None}
            query["longitude"] = {"$ne": None}

        total = await self.events.count_documents(query)
        skip = (page - 1) * limit
        sort_field = sort_by if sort_by in ("event_at", "upvote_count", "created_at") else "event_at"
        cursor = self.events.find(query).sort(sort_field, -1).skip(skip).limit(limit)

        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc = await self._enrich_service(doc)
            doc["comment_count"] = await self._comment_count("event", doc["_id"])
            doc = self._populate_attendee_fields(doc)
            doc = self._upvote_fields(doc, user_id)
            results.append(ForumEventResponse(**doc))
        return results, total

    async def get_event_by_id(self, event_id: str, user_id: Optional[str] = None) -> Optional[ForumEventResponse]:
        doc = await self.events.find_one({"_id": ObjectId(event_id)})
        if not doc:
            return None
        doc = await self._enrich_user(doc)
        doc = await self._enrich_service(doc)
        doc["comment_count"] = await self._comment_count("event", doc["_id"])
        doc = self._populate_attendee_fields(doc)
        doc = self._upvote_fields(doc, user_id)
        return ForumEventResponse(**doc)

    async def update_event(
        self, event_id: str, data: ForumEventUpdate, user_id: str
    ) -> Optional[ForumEventResponse]:
        existing = await self.events.find_one({"_id": ObjectId(event_id)})
        if not existing:
            raise ValueError("Event not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to update this event")

        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if "service_id" in update_data and update_data["service_id"]:
            svc = await self.services.find_one({"_id": ObjectId(update_data["service_id"])})
            if not svc:
                raise ValueError("Linked service not found")
            update_data["service_id"] = ObjectId(update_data["service_id"])
        update_data["updated_at"] = datetime.utcnow()
        await self.events.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
        return await self.get_event_by_id(event_id)

    async def delete_event(self, event_id: str, user_id: str) -> bool:
        existing = await self.events.find_one({"_id": ObjectId(event_id)})
        if not existing:
            raise ValueError("Event not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to delete this event")
        result = await self.events.delete_one({"_id": ObjectId(event_id)})
        if result.deleted_count:
            await self.forum_comments.delete_many({
                "target_type": "event",
                "$or": [{"target_id": ObjectId(event_id)}, {"target_id": event_id}],
            })
        return result.deleted_count > 0

    async def get_events_for_service(self, service_id: str) -> List[ForumEventResponse]:
        """Return all events linked to a given service (for ServiceDetail)."""
        query = {
            "$or": [
                {"service_id": ObjectId(service_id)},
                {"service_id": service_id},
            ]
        }
        cursor = self.events.find(query).sort("event_at", -1)
        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc = await self._enrich_service(doc)
            doc["comment_count"] = await self._comment_count("event", doc["_id"])
            doc = self._populate_attendee_fields(doc)
            results.append(ForumEventResponse(**doc))
        return results

    async def get_events_for_community(self, community_id: str, limit: int = 20) -> List[ForumEventResponse]:
        """Return events associated with a given community."""
        query = {"community_id": community_id}
        cursor = self.events.find(query).sort("event_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc = await self._enrich_service(doc)
            doc["comment_count"] = await self._comment_count("event", doc["_id"])
            doc = self._populate_attendee_fields(doc)
            doc = self._upvote_fields(doc, None)
            results.append(ForumEventResponse(**doc))
        return results

    async def get_discussions_for_community(self, community_id: str, limit: int = 20) -> List[ForumDiscussionResponse]:
        """Return discussions associated with a given community."""
        query = {"community_id": community_id}
        cursor = self.discussions.find(query).sort("created_at", -1).limit(limit)
        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc["comment_count"] = await self._comment_count("discussion", doc["_id"])
            doc = self._upvote_fields(doc, None)
            results.append(ForumDiscussionResponse(**doc))
        return results

    # ---- Attendance ----

    async def attend_event(self, event_id: str, user_id: str) -> ForumEventResponse:
        oid = ObjectId(event_id)
        uid = ObjectId(user_id)
        doc = await self.events.find_one({"_id": oid})
        if not doc:
            raise ValueError("Event not found")
        existing = [str(a) for a in (doc.get("attendee_ids") or [])]
        if user_id in existing:
            raise ValueError("Already attending this event")
        await self.events.update_one({"_id": oid}, {"$push": {"attendee_ids": uid}})
        return await self.get_event_by_id(event_id)

    async def unattend_event(self, event_id: str, user_id: str) -> ForumEventResponse:
        oid = ObjectId(event_id)
        uid = ObjectId(user_id)
        doc = await self.events.find_one({"_id": oid})
        if not doc:
            raise ValueError("Event not found")
        await self.events.update_one({"_id": oid}, {"$pull": {"attendee_ids": uid}})
        return await self.get_event_by_id(event_id)

    async def get_event_attendees(self, event_id: str) -> list:
        doc = await self.events.find_one({"_id": ObjectId(event_id)})
        if not doc:
            raise ValueError("Event not found")
        attendee_ids = doc.get("attendee_ids") or []
        attendees = []
        for aid in attendee_ids:
            uid = aid if isinstance(aid, ObjectId) else ObjectId(aid)
            user = await self.users.find_one({"_id": uid})
            if user:
                attendees.append({
                    "_id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "profile_picture": user.get("profile_picture"),
                })
        return attendees

    # ---- Upvotes ----

    async def toggle_upvote(self, target_type: str, target_id: str, user_id: str) -> dict:
        """Toggle upvote for a discussion, event, or comment. Returns updated counts."""
        collection_map = {
            "discussion": self.discussions,
            "event": self.events,
            "comment": self.forum_comments,
        }
        collection = collection_map.get(target_type)
        if collection is None:
            raise ValueError(f"Invalid target type: {target_type}")

        oid = ObjectId(target_id)
        uid = ObjectId(user_id)

        doc = await collection.find_one({"_id": oid})
        if not doc:
            raise ValueError(f"{target_type.capitalize()} not found")

        upvoted_by = [str(u) for u in (doc.get("upvoted_by") or [])]
        if user_id in upvoted_by:
            # Withdraw upvote
            await collection.update_one(
                {"_id": oid},
                {"$pull": {"upvoted_by": uid}, "$inc": {"upvote_count": -1}},
            )
            user_upvoted = False
        else:
            # Cast upvote
            await collection.update_one(
                {"_id": oid},
                {"$addToSet": {"upvoted_by": uid}, "$inc": {"upvote_count": 1}},
            )
            user_upvoted = True

        updated = await collection.find_one({"_id": oid})
        return {
            "upvote_count": updated.get("upvote_count", 0),
            "user_upvoted": user_upvoted,
        }

    # ---- Comments ----

    async def create_comment(self, data: ForumCommentCreate, user_id: str) -> ForumCommentResponse:
        target_id = ObjectId(data.target_id)
        if data.target_type == "discussion":
            target = await self.discussions.find_one({"_id": target_id})
        elif data.target_type == "event":
            target = await self.events.find_one({"_id": target_id})
        else:  # community_post
            target = await self.db["community_posts"].find_one({"_id": target_id})
        if not target:
            raise ValueError(f"{data.target_type.capitalize()} not found")

        doc = {
            "user_id": ObjectId(user_id),
            "target_type": data.target_type,
            "target_id": target_id,
            "content": data.content,
            "image_urls": data.image_urls or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.forum_comments.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc = await self._enrich_user(doc)
        return ForumCommentResponse(**doc)

    async def get_comments(
        self, target_type: str, target_id: str, page: int = 1, limit: int = 20, user_id: Optional[str] = None
    ) -> Tuple[List[ForumCommentResponse], int]:
        oid = ObjectId(target_id)
        query = {
            "target_type": target_type,
            "$or": [{"target_id": oid}, {"target_id": target_id}],
        }
        total = await self.forum_comments.count_documents(query)
        skip = (page - 1) * limit
        cursor = self.forum_comments.find(query).sort("created_at", -1).skip(skip).limit(limit)

        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc = self._upvote_fields(doc, user_id)
            results.append(ForumCommentResponse(**doc))
        return results, total

    async def update_comment(
        self, comment_id: str, data: ForumCommentUpdate, user_id: str
    ) -> Optional[ForumCommentResponse]:
        existing = await self.forum_comments.find_one({"_id": ObjectId(comment_id)})
        if not existing:
            raise ValueError("Comment not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to update this comment")

        update_fields: dict = {"content": data.content, "updated_at": datetime.utcnow()}
        if data.image_urls is not None:
            update_fields["image_urls"] = data.image_urls
        await self.forum_comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$set": update_fields},
        )
        updated = await self.forum_comments.find_one({"_id": ObjectId(comment_id)})
        updated = await self._enrich_user(updated)
        return ForumCommentResponse(**updated)

    async def delete_comment(self, comment_id: str, user_id: str) -> bool:
        existing = await self.forum_comments.find_one({"_id": ObjectId(comment_id)})
        if not existing:
            raise ValueError("Comment not found")
        if str(existing["user_id"]) != user_id:
            raise ValueError("Not authorized to delete this comment")
        result = await self.forum_comments.delete_one({"_id": ObjectId(comment_id)})
        return result.deleted_count > 0
