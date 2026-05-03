from typing import List, Optional
from datetime import datetime, timezone
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
        "name": "Polished Wings",
        "description": "Set a profile picture",
        "icon": "image",
        "metric": "has_profile_picture",
        "target": 1,
    },
    {
        "key": "tagged",
        "name": "Pollen Collector",
        "description": "Add at least one interest tag",
        "icon": "tag",
        "metric": "profile_tags_count",
        "target": 1,
    },
    {
        "key": "well_tagged",
        "name": "Nectar Expert",
        "description": "Add 5 or more interest tags",
        "icon": "tags",
        "metric": "profile_tags_count",
        "target": 5,
    },
    {
        "key": "rated",
        "name": "Sweet Taste",
        "description": "Receive your first rating",
        "icon": "star",
        "metric": "rating_count",
        "target": 1,
    },
    {
        "key": "popular",
        "name": "Honeycomb Star",
        "description": "Receive 5 ratings",
        "icon": "trending-up",
        "metric": "rating_count",
        "target": 5,
    },
    {
        "key": "community_favorite",
        "name": "Queen's Choice",
        "description": "Receive 10 or more ratings",
        "icon": "heart",
        "metric": "rating_count",
        "target": 10,
    },
    {
        "key": "first_exchange",
        "name": "Honey Maker",
        "description": "Complete your first exchange",
        "icon": "check-circle",
        "metric": "exchange_count",
        "target": 1,
    },
    {
        "key": "helper",
        "name": "Worker Bee",
        "description": "Complete 5 exchanges",
        "icon": "handshake",
        "metric": "exchange_count",
        "target": 5,
    },
    {
        "key": "helper_hero",
        "name": "Pollinator Bee",
        "description": "Complete 10 exchanges",
        "icon": "shield",
        "metric": "exchange_count",
        "target": 10,
    },
    {
        "key": "master_helper",
        "name": "Elite Forager",
        "description": "Complete 25 exchanges",
        "icon": "award",
        "metric": "exchange_count",
        "target": 25,
    },
    {
        "key": "generous_giver",
        "name": "Queen Bee",
        "description": "Contribute 50 or more hours",
        "icon": "clock",
        "metric": "contributed_hours",
        "target": 50,
    },
    {
        "key": "hive_dancer",
        "name": "Hive Dancer",
        "description": "Attend at least 5 events",
        "icon": "calendar",
        "metric": "event_attendance_count",
        "target": 5,
    },
    {
        "key": "cross_pollinator",
        "name": "Cross-Pollinator",
        "description": "Join 2 different communities and post in each",
        "icon": "users",
        "metric": "cross_pollinator_communities",
        "target": 2,
    },
    {
        "key": "hive_whisperer",
        "name": "Hive Whisperer",
        "description": "Comment on 5 discussions",
        "icon": "message-square",
        "metric": "discussion_comment_count",
        "target": 5,
    },
    {
        "key": "true_bee",
        "name": "True Bee",
        "description": "Provide a service, receive a service, attend an event, create an event, start a discussion, and found a community",
        "icon": "sparkles",
        "metric": "true_bee_all_six",
        "target": 1,
    },
    {
        "key": "social_antenna",
        "name": "Social Antenna",
        "description": "Add at least one social media link to your profile",
        "icon": "link",
        "metric": "has_social_link",
        "target": 1,
    },
    {
        "key": "veteran_scout",
        "name": "Veteran Scout",
        "description": "Be a member for at least 1 year",
        "icon": "trophy",
        "metric": "member_for_a_year",
        "target": 1,
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

        # --- New metrics ---

        # Hive Dancer: events attended
        event_attendance_count = await self.db.forum_events.count_documents({
            "attendee_ids": uid
        })

        # Hive Whisperer: comments on discussions
        discussion_comment_count = await self.db.forum_comments.count_documents({
            "user_id": uid,
            "target_type": "discussion",
        })

        # Cross-Pollinator: communities where user is active member AND has >= 1 post
        memberships = await self.db.community_memberships.find(
            {"user_id": uid, "status": "active"}
        ).to_list(None)
        cross_pollinator_communities = 0
        for m in memberships:
            cid = m.get("community_id")
            if cid is None:
                continue
            post_count = await self.db.community_posts.count_documents({
                "user_id": uid,
                "community_id": cid,
            })
            if post_count >= 1:
                cross_pollinator_communities += 1

        # True Bee: all 6 activities done at least once
        service_provided = await self.db.transactions.count_documents(
            {"provider_id": uid, "status": "completed"}
        ) >= 1
        service_taken = await self.db.transactions.count_documents(
            {"requester_id": uid, "status": "completed"}
        ) >= 1
        event_attended = event_attendance_count >= 1
        event_created = await self.db.forum_events.count_documents(
            {"user_id": uid}
        ) >= 1
        discussion_created = await self.db.forum_discussions.count_documents(
            {"user_id": uid}
        ) >= 1
        community_created = await self.db.communities.count_documents(
            {"founder_id": uid}
        ) >= 1
        true_bee_all_six = 1 if all([
            service_provided, service_taken, event_attended,
            event_created, discussion_created, community_created,
        ]) else 0

        # Social Antenna: at least 1 social media link set
        social_links = user_doc.get("social_links") or {}
        if isinstance(social_links, dict):
            has_social_link = 1 if any(v for v in social_links.values() if v) else 0
        else:
            has_social_link = 0

        # Veteran Scout: member for >= 1 year
        created_at = user_doc.get("created_at")
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            member_for_a_year = 1 if (datetime.now(timezone.utc) - created_at).days >= 365 else 0
        else:
            member_for_a_year = 0

        return {
            "always": 1,
            "exchange_count": exchange_count,
            "rating_count": rating_count,
            "contributed_hours": contributed_hours,
            "profile_tags_count": profile_tags_count,
            "has_profile_picture": has_profile_picture,
            "event_attendance_count": event_attendance_count,
            "discussion_comment_count": discussion_comment_count,
            "cross_pollinator_communities": cross_pollinator_communities,
            "true_bee_all_six": true_bee_all_six,
            "has_social_link": has_social_link,
            "member_for_a_year": member_for_a_year,
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
