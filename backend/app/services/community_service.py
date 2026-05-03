from datetime import datetime, timezone
from typing import Optional, List, Tuple
from bson import ObjectId
import re

from ..models.community import (
    CommunityCreate, CommunityUpdate,
    CommunityPostCreate, CommunityPostUpdate,
    MemberRole, MemberStatus, MemberRoleUpdate,
)


def _utcnow():
    return datetime.now(timezone.utc)


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:80]


class CommunityService:
    def __init__(self, db):
        self.db = db
        self.communities = db["communities"]
        self.memberships = db["community_memberships"]
        self.posts = db["community_posts"]
        self.comments = db["forum_comments"]
        self.users = db["users"]

    # ──────────────────── helpers ────────────────────

    async def _enrich_user(self, doc: dict) -> dict:
        uid = doc.get("founder_id") or doc.get("user_id")
        if not uid:
            return doc
        user = await self.users.find_one({"_id": ObjectId(str(uid))})
        if user:
            summary = {
                "id": str(user["_id"]),
                "username": user.get("username"),
                "full_name": user.get("full_name"),
                "profile_picture": user.get("profile_picture"),
            }
            if "founder_id" in doc:
                doc["founder"] = summary
            else:
                doc["user"] = summary
        return doc

    async def _membership(self, community_id: str, user_id: str) -> Optional[dict]:
        if not user_id:
            return None
        return await self.memberships.find_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(user_id),
            "status": MemberStatus.ACTIVE,
        })

    async def _require_member(self, community_id: str, user_id: str):
        m = await self._membership(community_id, user_id)
        if not m:
            raise ValueError("You must be a member of this community")
        return m

    async def _require_mod(self, community_id: str, user_id: str):
        m = await self._membership(community_id, user_id)
        if not m or m["role"] not in (MemberRole.FOUNDER, MemberRole.MODERATOR):
            raise ValueError("Moderator or founder permission required")
        return m

    async def _require_founder(self, community_id: str, user_id: str):
        m = await self._membership(community_id, user_id)
        if not m or m["role"] != MemberRole.FOUNDER:
            raise ValueError("Only the founder can perform this action")
        return m

    async def _upvote_fields(self, doc: dict, user_id: Optional[str]) -> dict:
        upvoted_by = doc.get("upvoted_by", [])
        doc["upvote_count"] = len(upvoted_by)
        doc["user_upvoted"] = (
            ObjectId(user_id) in upvoted_by if user_id else False
        )
        return doc

    async def _comment_count(self, post_id: str) -> int:
        return await self.comments.count_documents({
            "target_type": "community_post",
            "target_id": ObjectId(post_id),
        })

    async def _make_unique_slug(self, base: str, exclude_id: Optional[str] = None) -> str:
        slug = base
        counter = 1
        while True:
            query = {"slug": slug}
            if exclude_id:
                query["_id"] = {"$ne": ObjectId(exclude_id)}
            existing = await self.communities.find_one(query)
            if not existing:
                return slug
            slug = f"{base}-{counter}"
            counter += 1

    # ──────────────────── Community CRUD ────────────────────

    async def create_community(self, data: CommunityCreate, user_id: str) -> dict:
        base_slug = _slugify(data.name)
        slug = await self._make_unique_slug(base_slug)
        now = _utcnow()
        doc = {
            **data.model_dump(),
            "slug": slug,
            "founder_id": ObjectId(user_id),
            "member_count": 1,
            "post_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.communities.insert_one(doc)
        community_id = result.inserted_id

        # Auto-join founder
        await self.memberships.insert_one({
            "community_id": community_id,
            "user_id": ObjectId(user_id),
            "role": MemberRole.FOUNDER,
            "status": MemberStatus.ACTIVE,
            "joined_at": now,
        })

        inserted = await self.communities.find_one({"_id": community_id})
        inserted = await self._enrich_user(inserted)
        inserted["user_membership"] = MemberRole.FOUNDER
        return inserted

    async def get_communities(
        self,
        page: int = 1,
        limit: int = 20,
        q: Optional[str] = None,
        tag: Optional[str] = None,
        user_id: Optional[str] = None,
        my_only: bool = False,
        sort_by: str = "member_count",
    ) -> Tuple[List[dict], int]:
        query: dict = {}

        if my_only and user_id:
            member_of = await self.memberships.distinct(
                "community_id",
                {"user_id": ObjectId(user_id), "status": MemberStatus.ACTIVE}
            )
            query["_id"] = {"$in": member_of}

        if q:
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
            ]

        if tag:
            query["tags"] = {"$elemMatch": {"label": {"$regex": tag, "$options": "i"}}}

        total = await self.communities.count_documents(query)
        sort_field = sort_by if sort_by in ("member_count", "created_at", "post_count") else "member_count"
        cursor = self.communities.find(query).sort(sort_field, -1).skip((page - 1) * limit).limit(limit)
        docs = await cursor.to_list(length=limit)

        results = []
        for doc in docs:
            doc = await self._enrich_user(doc)
            if user_id:
                m = await self._membership(str(doc["_id"]), user_id)
                doc["user_membership"] = m["role"] if m else None
            else:
                doc["user_membership"] = None
            results.append(doc)

        return results, total

    async def get_community_by_id(self, community_id: str, user_id: Optional[str] = None) -> Optional[dict]:
        try:
            oid = ObjectId(community_id)
        except Exception:
            # Try by slug
            doc = await self.communities.find_one({"slug": community_id})
            if not doc:
                return None
            oid = doc["_id"]
            doc = await self.communities.find_one({"_id": oid})
        else:
            doc = await self.communities.find_one({"_id": oid})

        if not doc:
            return None

        doc = await self._enrich_user(doc)
        if user_id:
            m = await self._membership(str(doc["_id"]), user_id)
            doc["user_membership"] = m["role"] if m else None
        else:
            doc["user_membership"] = None
        return doc

    async def update_community(self, community_id: str, data: CommunityUpdate, user_id: str) -> Optional[dict]:
        await self._require_founder(community_id, user_id)
        update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_fields:
            return await self.get_community_by_id(community_id, user_id)
        if "name" in update_fields:
            base_slug = _slugify(update_fields["name"])
            update_fields["slug"] = await self._make_unique_slug(base_slug, exclude_id=community_id)
        update_fields["updated_at"] = _utcnow()
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$set": update_fields},
        )
        return await self.get_community_by_id(community_id, user_id)

    async def delete_community(self, community_id: str, user_id: str):
        await self._require_founder(community_id, user_id)
        oid = ObjectId(community_id)
        post_ids = await self.posts.distinct("_id", {"community_id": oid})
        if post_ids:
            await self.comments.delete_many({"target_type": "community_post", "target_id": {"$in": post_ids}})
        await self.posts.delete_many({"community_id": oid})
        await self.memberships.delete_many({"community_id": oid})
        await self.communities.delete_one({"_id": oid})

    # ──────────────────── Membership ────────────────────

    async def join_community(self, community_id: str, user_id: str) -> dict:
        community = await self.communities.find_one({"_id": ObjectId(community_id)})
        if not community:
            raise ValueError("Community not found")

        existing = await self.memberships.find_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(user_id),
        })
        if existing:
            if existing.get("status") == MemberStatus.BANNED:
                raise ValueError("You are banned from this community")
            raise ValueError("Already a member")

        now = _utcnow()
        await self.memberships.insert_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(user_id),
            "role": MemberRole.MEMBER,
            "status": MemberStatus.ACTIVE,
            "joined_at": now,
        })
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": 1}, "$set": {"updated_at": now}},
        )
        return await self.get_community_by_id(community_id, user_id)

    async def leave_community(self, community_id: str, user_id: str) -> dict:
        m = await self._membership(community_id, user_id)
        if not m:
            raise ValueError("You are not a member")
        if m["role"] == MemberRole.FOUNDER:
            raise ValueError("The founder cannot leave the community")

        now = _utcnow()
        await self.memberships.delete_one({"_id": m["_id"]})
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": -1}, "$set": {"updated_at": now}},
        )
        return await self.get_community_by_id(community_id, user_id)

    async def get_members(
        self,
        community_id: str,
        current_user_id: Optional[str] = None,
    ) -> Tuple[List[dict], int]:
        query = {"community_id": ObjectId(community_id), "status": MemberStatus.ACTIVE}
        total = await self.memberships.count_documents(query)
        cursor = self.memberships.find(query).sort("joined_at", 1)
        docs = await cursor.to_list(length=500)

        current_user_community_ids = None
        current_user_community_object_ids = []
        if current_user_id:
            current_user_memberships = await self.memberships.find({
                "user_id": ObjectId(current_user_id),
                "status": MemberStatus.ACTIVE,
            }).to_list(length=500)
            current_user_community_ids = {
                str(m["community_id"]) for m in current_user_memberships
            }
            current_user_community_object_ids = [
                ObjectId(cid) for cid in current_user_community_ids
            ]

        for doc in docs:
            user = await self.users.find_one({"_id": ObjectId(str(doc["user_id"]))})
            if user:
                doc["user"] = {
                    "id": str(user["_id"]),
                    "username": user.get("username"),
                    "full_name": user.get("full_name"),
                    "profile_picture": user.get("profile_picture"),
                }
            if current_user_community_ids is not None:
                if str(doc["user_id"]) == current_user_id:
                    doc["mutual_community_count"] = len(current_user_community_ids)
                else:
                    doc["mutual_community_count"] = await self.memberships.count_documents({
                        "user_id": ObjectId(str(doc["user_id"])),
                        "status": MemberStatus.ACTIVE,
                        "community_id": {"$in": current_user_community_object_ids},
                    })
        return docs, total

    async def get_communities_for_user(
        self,
        target_user_id: str,
        current_user_id: Optional[str] = None,
    ) -> dict:
        target_memberships = await self.memberships.find({
            "user_id": ObjectId(target_user_id),
            "status": MemberStatus.ACTIVE,
        }).sort("joined_at", -1).to_list(length=500)
        target_community_ids = [ObjectId(str(m["community_id"])) for m in target_memberships]

        current_memberships = []
        if current_user_id:
            current_memberships = await self.memberships.find({
                "user_id": ObjectId(current_user_id),
                "status": MemberStatus.ACTIVE,
            }).to_list(length=500)
        current_membership_by_community = {
            str(m["community_id"]): m for m in current_memberships
        }
        current_community_ids = set(current_membership_by_community.keys())
        target_community_id_set = {str(cid) for cid in target_community_ids}

        if not target_community_ids:
            return {"communities": [], "total": 0, "mutual_count": 0}

        docs = await self.communities.find({
            "_id": {"$in": target_community_ids}
        }).to_list(length=500)
        community_by_id = {str(doc["_id"]): doc for doc in docs}

        communities = []
        for membership in target_memberships:
            community_id = str(membership["community_id"])
            doc = community_by_id.get(community_id)
            if not doc:
                continue
            doc = await self._enrich_user(doc)
            doc["target_membership"] = membership["role"]
            current_membership = current_membership_by_community.get(community_id)
            doc["user_membership"] = current_membership["role"] if current_membership else None
            doc["is_mutual"] = community_id in current_community_ids
            communities.append(doc)

        mutual_count = len(target_community_id_set & current_community_ids)
        return {
            "communities": communities,
            "total": len(communities),
            "mutual_count": mutual_count,
        }

    async def update_member_role(self, community_id: str, target_user_id: str, role: MemberRole, requester_id: str):
        await self._require_founder(community_id, requester_id)
        m = await self.memberships.find_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(target_user_id),
            "status": MemberStatus.ACTIVE,
        })
        if not m:
            raise ValueError("Member not found")
        if m["role"] == MemberRole.FOUNDER:
            raise ValueError("Cannot change the founder's role")
        await self.memberships.update_one(
            {"_id": m["_id"]},
            {"$set": {"role": role}},
        )

    async def ban_member(self, community_id: str, target_user_id: str, requester_id: str):
        await self._require_mod(community_id, requester_id)
        m = await self.memberships.find_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(target_user_id),
        })
        if not m:
            raise ValueError("Member not found")
        if m["role"] == MemberRole.FOUNDER:
            raise ValueError("Cannot ban the founder")
        now = _utcnow()
        await self.memberships.update_one(
            {"_id": m["_id"]},
            {"$set": {"status": MemberStatus.BANNED}},
        )
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": -1}, "$set": {"updated_at": now}},
        )

    async def remove_member(self, community_id: str, target_user_id: str, requester_id: str):
        await self._require_mod(community_id, requester_id)
        m = await self.memberships.find_one({
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(target_user_id),
            "status": MemberStatus.ACTIVE,
        })
        if not m:
            raise ValueError("Member not found")
        if m["role"] == MemberRole.FOUNDER:
            raise ValueError("Cannot remove the founder")
        now = _utcnow()
        await self.memberships.delete_one({"_id": m["_id"]})
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"member_count": -1}, "$set": {"updated_at": now}},
        )

    # ──────────────────── Posts ────────────────────

    async def create_post(self, community_id: str, data: CommunityPostCreate, user_id: str) -> dict:
        await self._require_member(community_id, user_id)
        now = _utcnow()
        doc = {
            **data.model_dump(),
            "community_id": ObjectId(community_id),
            "user_id": ObjectId(user_id),
            "is_pinned": False,
            "upvote_count": 0,
            "upvoted_by": [],
            "comment_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.posts.insert_one(doc)
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"post_count": 1}, "$set": {"updated_at": now}},
        )
        inserted = await self.posts.find_one({"_id": result.inserted_id})
        return await self._enrich_post(inserted, user_id)

    async def get_posts(
        self,
        community_id: str,
        page: int = 1,
        limit: int = 20,
        q: Optional[str] = None,
        sort_by: str = "created_at",
        user_id: Optional[str] = None,
    ) -> Tuple[List[dict], int]:
        query: dict = {"community_id": ObjectId(community_id)}
        if q:
            query["$or"] = [
                {"title": {"$regex": q, "$options": "i"}},
                {"body": {"$regex": q, "$options": "i"}},
            ]
        total = await self.posts.count_documents(query)
        sort_field = sort_by if sort_by in ("created_at", "upvote_count") else "created_at"

        # Pinned posts always first
        cursor = self.posts.find(query).sort([("is_pinned", -1), (sort_field, -1)]).skip((page - 1) * limit).limit(limit)
        docs = await cursor.to_list(length=limit)
        results = []
        for doc in docs:
            results.append(await self._enrich_post(doc, user_id))
        return results, total

    async def get_post_by_id(self, community_id: str, post_id: str, user_id: Optional[str] = None) -> Optional[dict]:
        doc = await self.posts.find_one({
            "_id": ObjectId(post_id),
            "community_id": ObjectId(community_id),
        })
        if not doc:
            return None
        return await self._enrich_post(doc, user_id)

    async def update_post(self, community_id: str, post_id: str, data: CommunityPostUpdate, user_id: str) -> Optional[dict]:
        doc = await self.posts.find_one({"_id": ObjectId(post_id), "community_id": ObjectId(community_id)})
        if not doc:
            raise ValueError("Post not found")
        # Only post owner can edit
        if str(doc["user_id"]) != user_id:
            raise ValueError("You can only edit your own posts")
        update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
        update_fields["updated_at"] = _utcnow()
        await self.posts.update_one({"_id": ObjectId(post_id)}, {"$set": update_fields})
        updated = await self.posts.find_one({"_id": ObjectId(post_id)})
        return await self._enrich_post(updated, user_id)

    async def delete_post(self, community_id: str, post_id: str, user_id: str):
        doc = await self.posts.find_one({"_id": ObjectId(post_id), "community_id": ObjectId(community_id)})
        if not doc:
            raise ValueError("Post not found")
        # Owner or moderator/founder can delete
        m = await self._membership(community_id, user_id)
        is_mod = m and m["role"] in (MemberRole.FOUNDER, MemberRole.MODERATOR)
        is_owner = str(doc["user_id"]) == user_id
        if not is_owner and not is_mod:
            raise ValueError("Permission denied")
        oid = ObjectId(post_id)
        await self.comments.delete_many({"target_type": "community_post", "target_id": oid})
        await self.posts.delete_one({"_id": oid})
        await self.communities.update_one(
            {"_id": ObjectId(community_id)},
            {"$inc": {"post_count": -1}, "$set": {"updated_at": _utcnow()}},
        )

    async def pin_post(self, community_id: str, post_id: str, user_id: str, pinned: bool):
        await self._require_mod(community_id, user_id)
        doc = await self.posts.find_one({"_id": ObjectId(post_id), "community_id": ObjectId(community_id)})
        if not doc:
            raise ValueError("Post not found")
        await self.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": {"is_pinned": pinned, "updated_at": _utcnow()}},
        )
        updated = await self.posts.find_one({"_id": ObjectId(post_id)})
        return await self._enrich_post(updated, user_id)

    async def toggle_upvote(self, community_id: str, post_id: str, user_id: str) -> dict:
        doc = await self.posts.find_one({"_id": ObjectId(post_id), "community_id": ObjectId(community_id)})
        if not doc:
            raise ValueError("Post not found")
        user_oid = ObjectId(user_id)
        upvoted_by = doc.get("upvoted_by", [])
        if user_oid in upvoted_by:
            await self.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$pull": {"upvoted_by": user_oid}, "$inc": {"upvote_count": -1}},
            )
            user_upvoted = False
        else:
            await self.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"upvoted_by": user_oid}, "$inc": {"upvote_count": 1}},
            )
            user_upvoted = True
        updated = await self.posts.find_one({"_id": ObjectId(post_id)})
        return {
            "upvote_count": updated.get("upvote_count", 0),
            "user_upvoted": user_upvoted,
        }

    async def _enrich_post(self, doc: dict, user_id: Optional[str] = None) -> dict:
        uid = doc.get("user_id")
        if uid:
            user = await self.users.find_one({"_id": ObjectId(str(uid))})
            if user:
                doc["user"] = {
                    "id": str(user["_id"]),
                    "username": user.get("username"),
                    "full_name": user.get("full_name"),
                    "profile_picture": user.get("profile_picture"),
                }
        # upvotes
        upvoted_by = doc.get("upvoted_by", [])
        doc["upvote_count"] = len(upvoted_by)
        doc["user_upvoted"] = (ObjectId(user_id) in upvoted_by) if user_id else False
        # comment count
        doc["comment_count"] = await self._comment_count(str(doc["_id"]))
        return doc
