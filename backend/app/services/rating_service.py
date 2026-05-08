from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.rating import (
    RatingCreate,
    RatingResponse,
    RatingDetailedResponse,
)


class RatingService:
    def __init__(self, db):
        self.db = db
        self.ratings_collection = db.ratings
        self.transactions_collection = db.transactions
        self.services_collection = db.services
        self.users_collection = db.users

    @staticmethod
    def _to_object_id(value):
        return ObjectId(value) if isinstance(value, str) and ObjectId.is_valid(value) else value

    async def create_rating(self, rater_id: str, rating_data: RatingCreate) -> RatingResponse:
        """
        Create a rating for a transaction. Allowed when the rater has confirmed
        their side of the transaction, or when both parties have confirmed.
        We do NOT require transaction.status == "completed" — confirmations are
        the single source of truth.
        """
        transaction = await self.transactions_collection.find_one(
            {"_id": ObjectId(rating_data.transaction_id)}
        )
        if not transaction:
            raise ValueError("Transaction not found")

        provider_id = str(transaction["provider_id"])
        requester_id = str(transaction["requester_id"])

        is_requester = rater_id == requester_id
        is_provider = rater_id == provider_id

        requester_confirmed = transaction.get("requester_confirmed") == True
        provider_confirmed = transaction.get("provider_confirmed") == True

        can_rate = (
            (requester_confirmed and provider_confirmed)
            or (is_requester and requester_confirmed)
            or (is_provider and provider_confirmed)
        )

        if not can_rate:
            raise ValueError("You can only rate after confirming the transaction")

        if rater_id not in (provider_id, requester_id):
            raise ValueError("You are not a participant of this transaction")

        if rating_data.rated_user_id not in (provider_id, requester_id):
            raise ValueError("Rated user is not a participant of this transaction")

        if rating_data.rated_user_id == rater_id:
            raise ValueError("You cannot rate yourself")

        existing = await self.ratings_collection.find_one({
            "transaction_id": ObjectId(rating_data.transaction_id),
            "rater_id": ObjectId(rater_id),
        })
        if existing:
            raise ValueError("You have already rated this transaction")

        rating_doc = {
            "transaction_id": ObjectId(rating_data.transaction_id),
            "rater_id": ObjectId(rater_id),
            "rated_user_id": ObjectId(rating_data.rated_user_id),
            "score": rating_data.score,
            "comment": rating_data.comment,
            "tags": rating_data.tags or [],
            "image_urls": rating_data.image_urls or [],
            "created_at": datetime.utcnow(),
        }

        result = await self.ratings_collection.insert_one(rating_doc)
        rating_doc["_id"] = result.inserted_id
        return RatingResponse(**rating_doc)

    async def get_ratings_for_user(self, user_id: str, page: int = 1, limit: int = 20) -> Tuple[List[RatingResponse], int, Optional[float]]:
        query = {"rated_user_id": ObjectId(user_id)}
        total = await self.ratings_collection.count_documents(query)

        skip = (page - 1) * limit
        cursor = self.ratings_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)

        ratings = []
        async for doc in cursor:
            rater = await self.users_collection.find_one({"_id": self._to_object_id(doc["rater_id"])})
            if rater:
                doc["rater"] = {
                    "id": str(rater["_id"]),
                    "username": rater.get("username"),
                    "full_name": rater.get("full_name"),
                }
            ratings.append(RatingResponse(**doc))

        avg = await self.get_average_rating(user_id)
        return ratings, total, avg

    async def get_detailed_ratings_for_user(
        self, user_id: str, page: int = 1, limit: int = 20
    ) -> Tuple[List[RatingDetailedResponse], int, Optional[float]]:
        query = {"rated_user_id": ObjectId(user_id)}
        total = await self.ratings_collection.count_documents(query)

        skip = (page - 1) * limit
        cursor = (
            self.ratings_collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        ratings: List[RatingDetailedResponse] = []
        async for doc in cursor:
            rater = await self.users_collection.find_one({"_id": self._to_object_id(doc["rater_id"])})
            if rater:
                doc["rater"] = {
                    "id": str(rater["_id"]),
                    "username": rater.get("username"),
                    "full_name": rater.get("full_name"),
                }

            transaction = await self.transactions_collection.find_one(
                {"_id": self._to_object_id(doc["transaction_id"])}
            )
            if transaction:
                rated_user_id_str = str(doc["rated_user_id"])
                provider_id_str = str(transaction.get("provider_id", ""))
                rated_user_role = "provider" if rated_user_id_str == provider_id_str else "taker"
                doc["transaction"] = {
                    "id": str(transaction["_id"]),
                    "timebank_hours": float(
                        transaction.get(
                            "timebank_hours",
                            transaction.get("hours", 0),
                        )
                    ),
                    "completed_at": transaction.get("completed_at"),
                    "created_at": transaction.get("created_at"),
                    "rated_user_role": rated_user_role,
                }

                service_id = transaction.get("service_id")
                if service_id is not None:
                    service = await self.services_collection.find_one({"_id": self._to_object_id(service_id)})
                    if service:
                        doc["service"] = {
                            "id": str(service["_id"]),
                            "title": service.get("title", "Service"),
                            "description": service.get("description"),
                            "service_type": service.get("service_type"),
                            "status": service.get("status"),
                        }

            ratings.append(RatingDetailedResponse(**doc))

        avg = await self.get_average_rating(user_id)
        return ratings, total, avg

    async def get_ratings_for_transaction(self, transaction_id: str) -> List[RatingResponse]:
        cursor = self.ratings_collection.find(
            {"transaction_id": ObjectId(transaction_id)}
        )
        ratings = []
        async for doc in cursor:
            rater = await self.users_collection.find_one({"_id": self._to_object_id(doc["rater_id"])})
            if rater:
                doc["rater"] = {
                    "id": str(rater["_id"]),
                    "username": rater.get("username"),
                    "full_name": rater.get("full_name"),
                }
            ratings.append(RatingResponse(**doc))
        return ratings

    async def get_rating_count(self, user_id: str) -> int:
        return await self.ratings_collection.count_documents(
            {"rated_user_id": ObjectId(user_id)}
        )

    async def get_average_rating(self, user_id: str) -> Optional[float]:
        pipeline = [
            {"$match": {"rated_user_id": ObjectId(user_id)}},
            {"$group": {"_id": None, "avg": {"$avg": "$score"}}},
        ]
        result = await self.ratings_collection.aggregate(pipeline).to_list(1)
        if result and result[0]["avg"] is not None:
            return round(result[0]["avg"], 2)
        return None
