import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.security import get_password_hash
from bson import ObjectId
from datetime import datetime, timedelta, timezone

SEED_MARKER = True

IMAGES = {
    "workshop":     "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
    "laptop":       "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop",
    "conversation": "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop",
    "gardening":    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop",
    "coding":       "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop",
    "furniture":    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop",
    "photography":  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop",
    "books":        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop",
    "garden":       "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop",
    "plants":       "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop",
    "breakfast":    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop",
    "park":         "https://images.unsplash.com/photo-1533044309907-0fa3413da946?w=800&auto=format&fit=crop",
    "repair_cover": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop",
    "language_cover": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop",
    "garden_cover": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&auto=format&fit=crop",
    "avatar1":      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop",
    "avatar2":      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
    "avatar3":      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop",
    "avatar4":      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop",
    "avatar5":      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop",
}


def now():
    return datetime.now(timezone.utc)


async def clear_seed_data(db):
    collections = [
        "users", "communities", "community_memberships",
        "services", "forum_events",
    ]
    for col in collections:
        result = await db[col].delete_many({"seed_marker": True})
        if result.deleted_count:
            print(f"  cleared {result.deleted_count} from {col}")


async def seed_users(db) -> dict:
    hashed = get_password_hash("Test1234!")
    users = [
        {
            "_id": ObjectId(),
            "username": "alice_seed",
            "email": "alice@hiveseed.dev",
            "hashed_password": hashed,
            "full_name": "Alice Johnson",
            "bio": "Freelance electronics technician. Love fixing things and helping neighbors.",
            "location": "Beşiktaş, Istanbul",
            "roles": ["user"],
            "timebank_balance": 10.0,
            "profile_image_url": IMAGES["avatar1"],
            "is_active": True,
            "is_verified": True,
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "username": "bob_seed",
            "email": "bob@hiveseed.dev",
            "hashed_password": hashed,
            "full_name": "Bob Martinez",
            "bio": "Software developer looking to learn new skills and exchange services.",
            "location": "Kadıköy, Istanbul",
            "roles": ["user"],
            "timebank_balance": 10.0,
            "profile_image_url": IMAGES["avatar2"],
            "is_active": True,
            "is_verified": True,
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "username": "ceren_seed",
            "email": "ceren@hiveseed.dev",
            "hashed_password": hashed,
            "full_name": "Ceren Yıldız",
            "bio": "Graphic designer and community enthusiast. Passionate about sustainable living.",
            "location": "Şişli, Istanbul",
            "roles": ["user"],
            "timebank_balance": 10.0,
            "profile_image_url": IMAGES["avatar3"],
            "is_active": True,
            "is_verified": True,
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "username": "david_seed",
            "email": "david@hiveseed.dev",
            "hashed_password": hashed,
            "full_name": "David Chen",
            "bio": "Urban gardener and sustainability advocate. Organising community garden events.",
            "location": "Kadıköy, Istanbul",
            "roles": ["user"],
            "timebank_balance": 10.0,
            "profile_image_url": IMAGES["avatar4"],
            "is_active": True,
            "is_verified": True,
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "username": "elif_seed",
            "email": "elif@hiveseed.dev",
            "hashed_password": hashed,
            "full_name": "Elif Şahin",
            "bio": "Language teacher and culture exchange enthusiast. Fluent in English, Turkish, French.",
            "location": "Beyoğlu, Istanbul",
            "roles": ["user"],
            "timebank_balance": 10.0,
            "profile_image_url": IMAGES["avatar5"],
            "is_active": True,
            "is_verified": True,
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
    ]
    await db["users"].insert_many(users)
    print(f"  inserted {len(users)} users")
    return {u["username"]: u["_id"] for u in users}


async def seed_communities(db, users: dict) -> dict:
    alice = users["alice_seed"]
    elif_ = users["elif_seed"]
    david = users["david_seed"]
    bob = users["bob_seed"]
    ceren = users["ceren_seed"]

    communities = [
        {
            "_id": ObjectId(),
            "name": "Istanbul Repair Cooperative",
            "slug": "istanbul-repair-cooperative",
            "description": (
                "A community of repair enthusiasts, technicians, and tinkerers based in Istanbul. "
                "We share tools, knowledge, and skills to fix electronics, appliances, bicycles, and more. "
                "Join us to reduce waste and keep things running!"
            ),
            "founder_id": alice,
            "tags": [
                {"label": "repair", "entityId": ""},
                {"label": "electronics", "entityId": ""},
                {"label": "DIY", "entityId": ""},
            ],
            "rules": [
                "Be respectful and patient with fellow members.",
                "Share knowledge freely — this community thrives on generosity.",
                "No commercial advertising.",
            ],
            "avatar_url": IMAGES["workshop"],
            "cover_image_url": IMAGES["repair_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "name": "Language Exchange Hub",
            "slug": "language-exchange-hub",
            "description": (
                "Connect with language learners and native speakers across Istanbul. "
                "Practice conversational skills, share cultural insights, and build friendships "
                "through language. All levels welcome."
            ),
            "founder_id": elif_,
            "tags": [
                {"label": "language", "entityId": ""},
                {"label": "education", "entityId": ""},
                {"label": "culture", "entityId": ""},
            ],
            "rules": [
                "Respect all languages and cultures.",
                "Sessions should be balanced — practice both languages equally.",
                "Keep conversations inclusive and welcoming.",
            ],
            "avatar_url": IMAGES["books"],
            "cover_image_url": IMAGES["language_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "name": "Kadikoy Garden Collective",
            "slug": "kadikoy-garden-collective",
            "description": (
                "A grassroots collective of urban gardeners in the Kadıköy district. "
                "We share seeds, tools, gardening tips, and organise seasonal planting days. "
                "Growing food, community, and sustainability together."
            ),
            "founder_id": david,
            "tags": [
                {"label": "gardening", "entityId": ""},
                {"label": "nature", "entityId": ""},
                {"label": "sustainability", "entityId": ""},
            ],
            "rules": [
                "Share surplus seeds and produce with members.",
                "Volunteer for at least one community garden day per season.",
                "No synthetic pesticides in shared garden spaces.",
            ],
            "avatar_url": IMAGES["garden"],
            "cover_image_url": IMAGES["garden_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
    ]

    await db["communities"].insert_many(communities)
    print(f"  inserted {len(communities)} communities")

    repair_id = communities[0]["_id"]
    language_id = communities[1]["_id"]
    garden_id = communities[2]["_id"]

    memberships = [
        # Istanbul Repair Cooperative
        {"_id": ObjectId(), "community_id": repair_id, "user_id": alice, "role": "founder", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": repair_id, "user_id": bob, "role": "moderator", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": repair_id, "user_id": ceren, "role": "member", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        # Language Exchange Hub
        {"_id": ObjectId(), "community_id": language_id, "user_id": elif_, "role": "founder", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": language_id, "user_id": david, "role": "member", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        # Kadikoy Garden Collective
        {"_id": ObjectId(), "community_id": garden_id, "user_id": david, "role": "founder", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": garden_id, "user_id": alice, "role": "member", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": garden_id, "user_id": bob, "role": "member", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
        {"_id": ObjectId(), "community_id": garden_id, "user_id": ceren, "role": "member", "status": "active", "joined_at": now(), "seed_marker": SEED_MARKER},
    ]

    await db["community_memberships"].insert_many(memberships)
    print(f"  inserted {len(memberships)} memberships")

    return {
        "repair": repair_id,
        "language": language_id,
        "garden": garden_id,
    }


async def seed_services(db, users: dict):
    alice = users["alice_seed"]
    bob = users["bob_seed"]
    ceren = users["ceren_seed"]
    david = users["david_seed"]
    elif_ = users["elif_seed"]

    services = [
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Laptop Repair & Diagnostics",
            "description": (
                "I can diagnose and repair most laptop issues — hardware faults, screen replacements, "
                "keyboard repairs, battery swaps, and general troubleshooting. Bring your laptop and "
                "I'll have it running in no time. Years of experience with all major brands."
            ),
            "category": "Technology",
            "tags": [{"label": "repair", "entityId": ""}, {"label": "electronics", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 1,
            "location": {
                "type": "Point",
                "coordinates": [29.00, 41.04],
                "address": "Beşiktaş, Istanbul",
            },
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Weekday evenings and weekends",
            "image_urls": [IMAGES["laptop"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "English Conversation Practice",
            "description": (
                "Native-level English conversation sessions for intermediate and advanced learners. "
                "We can discuss current events, practice job interview skills, work through grammar, "
                "or just have a casual chat. Sessions tailored to your goals."
            ),
            "category": "Education",
            "tags": [{"label": "english", "entityId": ""}, {"label": "language", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 2,
            "location": {
                "type": "Point",
                "coordinates": [28.97, 41.03],
                "address": "Online",
            },
            "is_remote": True,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Monday", "Wednesday", "Friday"], "time": "19:00"},
            "image_urls": [IMAGES["conversation"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Garden Design & Planting",
            "description": (
                "Help designing balcony gardens, container gardens, or small outdoor plots. "
                "I can assist with plant selection for Istanbul's climate, soil preparation, "
                "companion planting, and seasonal rotation. Sustainable, no-dig methods preferred."
            ),
            "category": "Home & Garden",
            "tags": [{"label": "gardening", "entityId": ""}, {"label": "sustainability", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 3.0,
            "max_participants": 1,
            "location": {
                "type": "Point",
                "coordinates": [29.02, 40.99],
                "address": "Kadıköy, Istanbul",
            },
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "specific_time": "10:00",
            "image_urls": [IMAGES["gardening"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Python Programming Tutoring",
            "description": (
                "Looking for someone to help me level up my Python skills — particularly data structures, "
                "OOP concepts, and building small projects. I'm a beginner with some basics covered. "
                "Online sessions preferred, flexible on timing."
            ),
            "category": "Education",
            "tags": [{"label": "python", "entityId": ""}, {"label": "programming", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 1.5,
            "max_participants": 1,
            "location": {
                "type": "Point",
                "coordinates": [29.02, 40.99],
                "address": "Online",
            },
            "is_remote": True,
            "scheduling_type": "open",
            "open_availability": "Weekends, flexible",
            "image_urls": [IMAGES["coding"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Furniture Assembly Help",
            "description": (
                "Need help assembling flat-pack furniture — two IKEA wardrobes and a bookshelf. "
                "Everything is unpacked and ready, I just need an extra pair of hands and maybe "
                "someone with more patience for instructions than me!"
            ),
            "category": "Home & Garden",
            "tags": [{"label": "furniture", "entityId": ""}, {"label": "DIY", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 1,
            "location": {
                "type": "Point",
                "coordinates": [28.99, 41.06],
                "address": "Şişli, Istanbul",
            },
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"),
            "specific_time": "14:00",
            "image_urls": [IMAGES["furniture"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Portrait Photography Session",
            "description": (
                "Looking for a photographer to take some professional-style portraits for my updated "
                "LinkedIn and portfolio. Outdoor location preferred — somewhere in Beyoğlu or Karaköy. "
                "Happy to discuss styling and location in advance."
            ),
            "category": "Arts & Creative",
            "tags": [{"label": "photography", "entityId": ""}, {"label": "portrait", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 1,
            "location": {
                "type": "Point",
                "coordinates": [28.97, 41.03],
                "address": "Beyoğlu, Istanbul",
            },
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Weekend mornings",
            "image_urls": [IMAGES["photography"]],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
    ]

    await db["services"].insert_many(services)
    print(f"  inserted {len(services)} services")


async def seed_events(db, users: dict, communities: dict):
    alice = users["alice_seed"]
    bob = users["bob_seed"]
    david = users["david_seed"]
    elif_ = users["elif_seed"]

    events = [
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Repair Workshop Meetup",
            "description": (
                "Monthly repair workshop open to all community members. Bring your broken items — "
                "electronics, small appliances, bikes — and we'll fix them together. "
                "Expert members on hand to guide beginners. Tools and spare parts provided."
            ),
            "event_at": now() + timedelta(days=7),
            "location": "Beşiktaş Community Centre, Istanbul",
            "latitude": 41.04,
            "longitude": 29.00,
            "is_remote": False,
            "tags": [{"label": "repair", "entityId": ""}, {"label": "workshop", "entityId": ""}],
            "community_id": str(communities["repair"]),
            "image_urls": [IMAGES["workshop"]],
            "attendee_ids": [],
            "upvoted_by": [],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Language Exchange Breakfast",
            "description": (
                "A relaxed Sunday morning language exchange over breakfast at a Kadıköy café. "
                "Practice Turkish, English, French, or any other language in a friendly, low-pressure "
                "environment. All levels welcome. Seats limited to 12."
            ),
            "event_at": now() + timedelta(days=14),
            "location": "Mandabatmaz Café, Kadıköy, Istanbul",
            "latitude": 40.99,
            "longitude": 29.02,
            "is_remote": False,
            "tags": [{"label": "language", "entityId": ""}, {"label": "social", "entityId": ""}],
            "community_id": str(communities["language"]),
            "image_urls": [IMAGES["breakfast"]],
            "attendee_ids": [],
            "upvoted_by": [],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Community Garden Day",
            "description": (
                "Spring planting day at Moda Park. We'll be setting up new raised beds, dividing "
                "perennials, and sowing summer vegetables. Bring gloves if you have them — "
                "tools, seeds, and compost are provided. Ends with a shared picnic lunch!"
            ),
            "event_at": now() + timedelta(days=10),
            "location": "Moda Park, Kadıköy, Istanbul",
            "latitude": 40.98,
            "longitude": 29.03,
            "is_remote": False,
            "tags": [{"label": "gardening", "entityId": ""}, {"label": "community", "entityId": ""}],
            "community_id": str(communities["garden"]),
            "image_urls": [IMAGES["park"]],
            "attendee_ids": [],
            "upvoted_by": [],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Online Python Workshop for Beginners",
            "description": (
                "A two-hour online workshop covering Python fundamentals: variables, loops, functions, "
                "and building a small project together. No prior experience needed. "
                "We'll use an online IDE so nothing to install. Join the link 5 minutes early."
            ),
            "event_at": now() + timedelta(days=5),
            "location": None,
            "latitude": None,
            "longitude": None,
            "is_remote": True,
            "tags": [{"label": "python", "entityId": ""}, {"label": "programming", "entityId": ""}, {"label": "beginner", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["coding"]],
            "attendee_ids": [],
            "upvoted_by": [],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
    ]

    await db["forum_events"].insert_many(events)
    print(f"  inserted {len(events)} events")


async def main():
    print(f"Connecting to {settings.mongodb_url} / {settings.database_name}")
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    print("Clearing previous seed data...")
    await clear_seed_data(db)

    print("Seeding users...")
    users = await seed_users(db)

    print("Seeding communities...")
    communities = await seed_communities(db, users)

    print("Seeding services...")
    await seed_services(db, users)

    print("Seeding events...")
    await seed_events(db, users, communities)

    client.close()
    print("\n✓ Mock data seeded successfully")
    print("  Login with any seed user: password = Test1234!")
    print("  Users: alice_seed, bob_seed, ceren_seed, david_seed, elif_seed")


if __name__ == "__main__":
    asyncio.run(main())
