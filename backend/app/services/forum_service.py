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

    async def get_discussions(
        self, page: int = 1, limit: int = 20, tag: Optional[str] = None, q: Optional[str] = None
    ) -> Tuple[List[ForumDiscussionResponse], int]:
        query: dict = {}
        if tag:
            query["tags.label"] = tag
        if q:
            query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"body": {"$regex": q, "$options": "i"}},
            ]

        total = await self.discussions.count_documents(query)
        skip = (page - 1) * limit
        cursor = self.discussions.find(query).sort("created_at", -1).skip(skip).limit(limit)

        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc["comment_count"] = await self._comment_count("discussion", doc["_id"])
            results.append(ForumDiscussionResponse(**doc))
        return results, total

    async def get_discussion_by_id(self, discussion_id: str) -> Optional[ForumDiscussionResponse]:
        doc = await self.discussions.find_one({"_id": ObjectId(discussion_id)})
        if not doc:
            return None
        doc = await self._enrich_user(doc)
        doc["comment_count"] = await self._comment_count("discussion", doc["_id"])
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
        doc["created_at"] = datetime.utcnow()
        doc["updated_at"] = datetime.utcnow()

        result = await self.events.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc = await self._enrich_user(doc)
        doc = await self._enrich_service(doc)
        doc["comment_count"] = 0
        return ForumEventResponse(**doc)

    async def get_events(
        self,
        page: int = 1,
        limit: int = 20,
        tag: Optional[str] = None,
        q: Optional[str] = None,
        has_location: bool = False,
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
        cursor = self.events.find(query).sort("event_at", -1).skip(skip).limit(limit)

        results = []
        async for doc in cursor:
            doc = await self._enrich_user(doc)
            doc = await self._enrich_service(doc)
            doc["comment_count"] = await self._comment_count("event", doc["_id"])
            results.append(ForumEventResponse(**doc))
        return results, total

    async def get_event_by_id(self, event_id: str) -> Optional[ForumEventResponse]:
        doc = await self.events.find_one({"_id": ObjectId(event_id)})
        if not doc:
            return None
        doc = await self._enrich_user(doc)
        doc = await self._enrich_service(doc)
        doc["comment_count"] = await self._comment_count("event", doc["_id"])
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
            results.append(ForumEventResponse(**doc))
        return results

    # ---- Comments ----

    async def create_comment(self, data: ForumCommentCreate, user_id: str) -> ForumCommentResponse:
        target_id = ObjectId(data.target_id)
        if data.target_type == "discussion":
            target = await self.discussions.find_one({"_id": target_id})
        else:
            target = await self.events.find_one({"_id": target_id})
        if not target:
            raise ValueError(f"{data.target_type.capitalize()} not found")

        doc = {
            "user_id": ObjectId(user_id),
            "target_type": data.target_type,
            "target_id": target_id,
            "content": data.content,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await self.forum_comments.insert_one(doc)
        doc["_id"] = result.inserted_id
        doc = await self._enrich_user(doc)
        return ForumCommentResponse(**doc)

    async def get_comments(
        self, target_type: str, target_id: str, page: int = 1, limit: int = 20
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

        await self.forum_comments.update_one(
            {"_id": ObjectId(comment_id)},
            {"$set": {"content": data.content, "updated_at": datetime.utcnow()}},
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
