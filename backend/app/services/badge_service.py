from typing import List, Optional
from bson import ObjectId


BADGE_DEFINITIONS = [
    {
        "key": "newcomer",
        "name": "Newcomer",
        "description": "Welcome to the platform!",
        "icon": "user-plus",
        "metric": "always",
        "target": 1,
    },
    {
        "key": "profile_complete",
        "name": "Profile Complete",
        "description": "Set a profile picture",
        "icon": "image",
        "metric": "has_profile_picture",
        "target": 1,
    },
    {
        "key": "tagged",
        "name": "Tagged",
        "description": "Add at least one interest tag",
        "icon": "tag",
        "metric": "profile_tags_count",
        "target": 1,
    },
    {
        "key": "well_tagged",
        "name": "Well Tagged",
        "description": "Add 5 or more interest tags",
        "icon": "tags",
        "metric": "profile_tags_count",
        "target": 5,
    },
    {
        "key": "rated",
        "name": "Rated",
        "description": "Receive your first rating",
        "icon": "star",
        "metric": "rating_count",
        "target": 1,
    },
    {
        "key": "popular",
        "name": "Popular",
        "description": "Receive 5 ratings",
        "icon": "trending-up",
        "metric": "rating_count",
        "target": 5,
    },
    {
        "key": "community_favorite",
        "name": "Community Favorite",
        "description": "Receive 10 or more ratings",
        "icon": "heart",
        "metric": "rating_count",
        "target": 10,
    },
    {
        "key": "helper",
        "name": "Helper",
        "description": "Complete 5 exchanges",
        "icon": "handshake",
        "metric": "exchange_count",
        "target": 5,
    },
    {
        "key": "helper_hero",
        "name": "Helper Hero",
        "description": "Complete 10 exchanges",
        "icon": "shield",
        "metric": "exchange_count",
        "target": 10,
    },
    {
        "key": "master_helper",
        "name": "Master Helper",
        "description": "Complete 25 exchanges",
        "icon": "award",
        "metric": "exchange_count",
        "target": 25,
    },
    {
        "key": "generous_giver",
        "name": "Generous Giver",
        "description": "Contribute 50 or more hours",
        "icon": "clock",
        "metric": "contributed_hours",
        "target": 50,
    },
]


class BadgeService:
    def __init__(self, db):
        self.db = db

    async def _compute_metrics(self, user_id: str, user_doc: dict) -> dict:
        uid = ObjectId(user_id)

        exchange_count = await self.db.transactions.count_documents({
            "$or": [{"provider_id": uid}, {"requester_id": uid}],
            "status": "completed",
        })

        rating_count = await self.db.ratings.count_documents({"rated_user_id": uid})

        pipeline = [
            {"$match": {"provider_id": uid, "status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$timebank_hours"}}},
        ]
        agg_result = await self.db.transactions.aggregate(pipeline).to_list(1)
        contributed_hours = agg_result[0]["total"] if agg_result else 0.0

        interests = user_doc.get("interests") or []
        profile_tags_count = len(interests)
        has_profile_picture = 1 if user_doc.get("profile_picture") else 0

        return {
            "always": 1,
            "exchange_count": exchange_count,
            "rating_count": rating_count,
            "contributed_hours": contributed_hours,
            "profile_tags_count": profile_tags_count,
            "has_profile_picture": has_profile_picture,
        }

    async def evaluate_badges(self, user_id: str) -> List[dict]:
        user_doc = await self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            raise ValueError("User not found")

        metrics = await self._compute_metrics(user_id, user_doc)
        badges = []

        for badge_def in BADGE_DEFINITIONS:
            metric_value = metrics.get(badge_def["metric"], 0)
            target = badge_def["target"]
            earned = metric_value >= target

            badge_info = {
                "key": badge_def["key"],
                "name": badge_def["name"],
                "description": badge_def["description"],
                "icon": badge_def["icon"],
                "earned": earned,
                "progress": {
                    "current": min(metric_value, target),
                    "target": target,
                },
            }
            badges.append(badge_info)

        return badges

    async def get_badge_summary(self, user_id: str) -> dict:
        badges = await self.evaluate_badges(user_id)
        earned_count = sum(1 for b in badges if b["earned"])
        return {
            "badges": badges,
            "earned_count": earned_count,
            "total_count": len(BADGE_DEFINITIONS),
        }
