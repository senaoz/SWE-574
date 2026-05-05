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
    # Service images
    "laptop":         "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop",
    "laptop2":        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop",
    "conversation":   "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop",
    "conversation2":  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop",
    "gardening":      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop",
    "gardening2":     "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&auto=format&fit=crop",
    "coding":         "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop",
    "coding2":        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop",
    "furniture":      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop",
    "photography":    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop",
    "photography2":   "https://images.unsplash.com/photo-1452780212658-9a4d0f80fe43?w=800&auto=format&fit=crop",
    "bread":          "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&auto=format&fit=crop",
    "bread2":         "https://images.unsplash.com/photo-1565181552583-7dfa4e000be4?w=800&auto=format&fit=crop",
    "bike":           "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop",
    "bike2":          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&auto=format&fit=crop",
    "yoga":           "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop",
    "cooking":        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop",
    "cooking2":       "https://images.unsplash.com/photo-1528712306091-ed0763094c98?w=800&auto=format&fit=crop",
    "fermentation":   "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&auto=format&fit=crop",
    "fermentation2":  "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?w=800&auto=format&fit=crop",
    "calligraphy":    "https://images.unsplash.com/photo-1585011664466-b7bbe92f34ef?w=800&auto=format&fit=crop",
    "sewing":         "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop",
    "sewing2":        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop",
    "city_walk":      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&auto=format&fit=crop",
    "city_walk2":     "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&auto=format&fit=crop",
    "moving":         "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&auto=format&fit=crop",
    "film":           "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop",
    "running":        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop",
    "running2":       "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop",
    "music":          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop",
    "music2":         "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop",
    "cat":            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop",
    "plants":         "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop",
    "plants2":        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop",
    "cv":             "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop",
    "market":         "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop",
    "izmir":          "https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=800&auto=format&fit=crop",
    "ankara":         "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop",
    "surf":           "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop",
    "surf2":          "https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&auto=format&fit=crop",
    "beekeeping":     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop",
    "beekeeping2":    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&auto=format&fit=crop",
    "ceramics":       "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop",
    "ceramics2":      "https://images.unsplash.com/photo-1606425271394-c3ca9aa1fc06?w=800&auto=format&fit=crop",
    "olive":          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop",
    "hike":           "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop",
    "hike2":          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    # Event images
    "workshop":       "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop",
    "breakfast":      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&auto=format&fit=crop",
    "park":           "https://images.unsplash.com/photo-1533044309907-0fa3413da946?w=800&auto=format&fit=crop",
    "cinema":         "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop",
    "trail":          "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop",
    "picnic":         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=800&auto=format&fit=crop",
    "bazaar":         "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&auto=format&fit=crop",
    "concert":        "https://images.unsplash.com/photo-1501386761578-eaa54b4c6bec?w=800&auto=format&fit=crop",
    # Community covers & avatars
    "repair_cover":   "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop",
    "language_cover": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop",
    "garden_cover":   "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&auto=format&fit=crop",
    "film_cover":     "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop",
    "running_cover":  "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&auto=format&fit=crop",
    "books":          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop",
    "garden":         "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop",
    # Avatars
    "avatar1":        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop",
    "avatar2":        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
    "avatar3":        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop",
    "avatar4":        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop",
    "avatar5":        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop",
}


def now():
    return datetime.now(timezone.utc)


def days(n):
    return now() + timedelta(days=n)


async def clear_seed_data(db):
    collections = [
        "users", "communities", "services", "forum_events",
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
            "bio": "Freelance electronics technician living in Beşiktaş. Love fixing things, reducing waste, and helping neighbours keep their gadgets running longer.",
            "location": "Beşiktaş, Istanbul",
            "roles": ["user"],
            "timebank_balance": 18.0,
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
            "bio": "Software developer by day, home baker by night. I moved to Kadıköy two years ago and haven't stopped exploring its neighbourhoods since.",
            "location": "Kadıköy, Istanbul",
            "roles": ["user"],
            "timebank_balance": 12.0,
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
            "bio": "Graphic designer passionate about sustainable living and slow fashion. I mend, repurpose, and share. Şişli local.",
            "location": "Şişli, Istanbul",
            "roles": ["user"],
            "timebank_balance": 9.0,
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
            "bio": "Urban farmer, kombucha brewer, and trail runner. I believe in building community one shared meal — or one shared run — at a time.",
            "location": "Kadıköy, Istanbul",
            "roles": ["user"],
            "timebank_balance": 15.0,
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
            "bio": "Language teacher, film buff, and occasional street photographer. Beyoğlu is my home and I love introducing newcomers to its hidden corners.",
            "location": "Beyoğlu, Istanbul",
            "roles": ["user"],
            "timebank_balance": 20.0,
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
                "A community of repair enthusiasts, technicians, and tinkerers across Istanbul. "
                "We share tools, knowledge, and skills to fix electronics, appliances, bicycles, and more. "
                "Our philosophy: if it can be fixed, it shouldn't be thrown away. "
                "Monthly repair cafés, skill-sharing sessions, and a growing library of spare parts."
            ),
            "founder_id": alice,
            "tags": [
                {"label": "repair", "entityId": ""},
                {"label": "electronics", "entityId": ""},
                {"label": "DIY", "entityId": ""},
                {"label": "sustainability", "entityId": ""},
            ],
            "rules": [
                "Be respectful and patient — everyone starts somewhere.",
                "Share knowledge freely. This community runs on generosity.",
                "No commercial advertising or selling of services.",
                "Return borrowed tools within one week.",
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
                "We meet in cafés, parks, and online to practise languages, share cultures, and make friends. "
                "Current active languages: Turkish, English, French, Spanish, German, Japanese. "
                "All levels welcome — the goal is conversation, not perfection."
            ),
            "founder_id": elif_,
            "tags": [
                {"label": "language", "entityId": ""},
                {"label": "education", "entityId": ""},
                {"label": "culture", "entityId": ""},
            ],
            "rules": [
                "Respect all languages and cultures equally.",
                "Balance your sessions — give as much as you receive.",
                "Be on time. Other members have organised their schedule around you.",
                "Keep it inclusive — no politics or divisive topics.",
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
                "A grassroots collective of urban gardeners rooted in the Kadıköy district. "
                "We share seeds, tools, compost, and knowledge. We grow food on balconies, rooftops, "
                "and shared plots. We believe food sovereignty begins at the neighbourhood level. "
                "Beginners always welcome — we have experienced growers who love teaching."
            ),
            "founder_id": david,
            "tags": [
                {"label": "gardening", "entityId": ""},
                {"label": "urban farming", "entityId": ""},
                {"label": "sustainability", "entityId": ""},
                {"label": "food", "entityId": ""},
            ],
            "rules": [
                "Share surplus seeds and produce with members before selling or discarding.",
                "Volunteer for at least one community work day per season.",
                "No synthetic pesticides or herbicides in shared spaces.",
                "Label and date anything you leave in the communal seed library.",
            ],
            "avatar_url": IMAGES["garden"],
            "cover_image_url": IMAGES["garden_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "name": "Moda Film Club",
            "slug": "moda-film-club",
            "description": (
                "A neighbourhood cinema collective based in the Moda quarter of Kadıköy. "
                "We host outdoor screenings, rooftop film nights, and post-film discussions. "
                "Curated around world cinema, Turkish classics, and documentary. "
                "No membership fee — just show up, watch, and talk about what you saw."
            ),
            "founder_id": elif_,
            "tags": [
                {"label": "film", "entityId": ""},
                {"label": "cinema", "entityId": ""},
                {"label": "culture", "entityId": ""},
                {"label": "community", "entityId": ""},
            ],
            "rules": [
                "Phones on silent during screenings — no exceptions.",
                "Post-film discussion is the heart of this club. Please stay.",
                "Everyone's interpretation is valid. Disagree respectfully.",
                "Help with setup and takedown when you can.",
            ],
            "avatar_url": IMAGES["film"],
            "cover_image_url": IMAGES["film_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "name": "Bosphorus Trail Runners",
            "slug": "bosphorus-trail-runners",
            "description": (
                "A running community that explores Istanbul on foot — coastal paths, forest trails, "
                "historic streets, and everything in between. Weekly group runs, monthly longer routes, "
                "and year-round encouragement. All paces welcome. The rule: no one runs alone."
            ),
            "founder_id": david,
            "tags": [
                {"label": "running", "entityId": ""},
                {"label": "trail", "entityId": ""},
                {"label": "outdoors", "entityId": ""},
                {"label": "fitness", "entityId": ""},
            ],
            "rules": [
                "No one gets left behind — the group waits at every junction.",
                "Always let someone know your route when running solo.",
                "Leave no trace on trails — carry out what you carry in.",
                "Encourage slower runners. Speed comes later.",
            ],
            "avatar_url": IMAGES["running"],
            "cover_image_url": IMAGES["running_cover"],
            "created_at": now(),
            "updated_at": now(),
            "seed_marker": SEED_MARKER,
        },
    ]

    await db["communities"].insert_many(communities)
    print(f"  inserted {len(communities)} communities")

    return {
        "repair":   communities[0]["_id"],
        "language": communities[1]["_id"],
        "garden":   communities[2]["_id"],
        "film":     communities[3]["_id"],
        "running":  communities[4]["_id"],
    }


async def seed_services(db, users: dict):
    alice = users["alice_seed"]
    bob   = users["bob_seed"]
    ceren = users["ceren_seed"]
    david = users["david_seed"]
    elif_ = users["elif_seed"]

    services = [
        # ── OFFERS ──────────────────────────────────────────────────────────────
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Laptop Repair & Diagnostics",
            "description": (
                "I can diagnose and repair most laptop issues — hardware faults, screen replacements, "
                "keyboard repairs, battery swaps, and general troubleshooting. Bring your laptop and "
                "I'll have it running in no time. Years of experience with all major brands (Apple, Lenovo, HP, ASUS). "
                "I'll also give you an honest assessment of whether a repair is worth it before we start."
            ),
            "category": "Technology",
            "tags": [{"label": "repair", "entityId": ""}, {"label": "electronics", "entityId": ""}, {"label": "laptop", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.00, 41.04], "address": "Beşiktaş, Istanbul"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Weekday evenings and weekends",
            "image_urls": [IMAGES["laptop"], IMAGES["laptop2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Sourdough Bread Baking Class",
            "description": (
                "Learn to bake a proper sourdough loaf from scratch — starter maintenance, stretch-and-fold technique, "
                "shaping, scoring, and baking in a Dutch oven. We'll bake together in my kitchen in Kadıköy. "
                "You leave with a loaf you made yourself, a portion of live starter, and the recipe. "
                "Suitable for complete beginners. All ingredients provided."
            ),
            "category": "Food & Drink",
            "tags": [{"label": "baking", "entityId": ""}, {"label": "sourdough", "entityId": ""}, {"label": "food", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 4.0,
            "max_participants": 2,
            "location": {"type": "Point", "coordinates": [29.02, 40.99], "address": "Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Saturday"], "time": "10:00"},
            "image_urls": [IMAGES["bread"], IMAGES["bread2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "English Conversation Practice",
            "description": (
                "Native-level English conversation sessions tailored to your goals. "
                "We can discuss current events, do job interview prep, work on pronunciation, "
                "or just have a relaxed chat. I adapt to your level and interests — no textbooks, no homework. "
                "Sessions via video call. Consistent practice is more valuable than cramming."
            ),
            "category": "Education",
            "tags": [{"label": "english", "entityId": ""}, {"label": "language", "entityId": ""}, {"label": "speaking", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 2,
            "location": {"type": "Point", "coordinates": [28.97, 41.03], "address": "Online"},
            "is_remote": True,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Monday", "Wednesday", "Friday"], "time": "19:00"},
            "image_urls": [IMAGES["conversation"], IMAGES["conversation2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Balcony & Container Garden Design",
            "description": (
                "Struggling to make your balcony or windowsill work as a garden? I'll visit your space, "
                "assess sunlight and wind conditions, and design a planting layout that actually produces food. "
                "Speciality: Istanbul's micro-climates, companion planting, and low-water methods. "
                "I'll bring a starter kit of seedlings from my own garden to get you going immediately."
            ),
            "category": "Home & Garden",
            "tags": [{"label": "gardening", "entityId": ""}, {"label": "urban farming", "entityId": ""}, {"label": "sustainability", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 3.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.02, 40.99], "address": "Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Weekend mornings",
            "image_urls": [IMAGES["gardening"], IMAGES["gardening2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Visible Mending & Clothes Repair",
            "description": (
                "Bring your torn jeans, worn elbows, or broken zips. I'll repair them using visible mending "
                "techniques — Japanese sashiko stitching, patchwork, and decorative darning — so the repair "
                "becomes part of the garment's story rather than something to hide. "
                "Sessions in my Şişli studio. Bring up to 3 garments. All materials provided."
            ),
            "category": "Fashion & Crafts",
            "tags": [{"label": "sewing", "entityId": ""}, {"label": "sustainability", "entityId": ""}, {"label": "slow fashion", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 3,
            "location": {"type": "Point", "coordinates": [28.99, 41.06], "address": "Şişli, Istanbul"},
            "is_remote": False,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Sunday"], "time": "14:00"},
            "image_urls": [IMAGES["sewing"], IMAGES["sewing2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Beyoğlu Hidden Gems Walking Tour",
            "description": (
                "A two-hour neighbourhood walk through the parts of Beyoğlu most visitors and even many locals never find. "
                "We'll visit a 19th-century Greek Orthodox church, a passage with surviving art deco tiles, "
                "the best börek spot on a street with no name, and a rooftop with an unobstructed Bosphorus view. "
                "Groups of 1–4 people. Entirely on foot, comfortable shoes recommended."
            ),
            "category": "Local Experiences",
            "tags": [{"label": "walking tour", "entityId": ""}, {"label": "history", "entityId": ""}, {"label": "local", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 4,
            "location": {"type": "Point", "coordinates": [28.975, 41.033], "address": "Beyoğlu, Istanbul"},
            "is_remote": False,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Saturday", "Sunday"], "time": "10:30"},
            "image_urls": [IMAGES["city_walk"], IMAGES["city_walk2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Kombucha & Fermentation Workshop",
            "description": (
                "I've been brewing kombucha, kefir, and lacto-fermented vegetables for four years. "
                "In this hands-on session you'll brew your first batch of kombucha from scratch, "
                "learn about the SCOBY lifecycle, and make a jar of lacto-fermented vegetables to take home. "
                "We'll also taste five different brews at various fermentation stages. "
                "All equipment and cultures provided. My kitchen in Kadıköy."
            ),
            "category": "Food & Drink",
            "tags": [{"label": "fermentation", "entityId": ""}, {"label": "kombucha", "entityId": ""}, {"label": "health", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 3.0,
            "max_participants": 3,
            "location": {"type": "Point", "coordinates": [29.02, 40.99], "address": "Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d"),
            "specific_time": "11:00",
            "image_urls": [IMAGES["fermentation"], IMAGES["fermentation2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Bike Tune-Up & Basic Maintenance",
            "description": (
                "I'll give your bike a full tune-up — brake adjustment, gear indexing, chain lubrication, "
                "tyre pressure check, and bolt torque. I'll also teach you the basics so you can handle "
                "minor issues on your own next time. Bring your bike to the small park near Beşiktaş pier. "
                "I carry a full set of tools. Only parts you need to replace are charged at cost."
            ),
            "category": "Transport",
            "tags": [{"label": "bike", "entityId": ""}, {"label": "repair", "entityId": ""}, {"label": "cycling", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 1.5,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.005, 41.043], "address": "Beşiktaş Pier, Istanbul"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Saturday mornings",
            "image_urls": [IMAGES["bike"], IMAGES["bike2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "CV & Portfolio Review for Creatives",
            "description": (
                "I review CVs and portfolios for graphic designers, illustrators, and other creatives "
                "looking for their first job or switching studios. I'll give honest, specific feedback on "
                "layout, content, and how well your work is presented. "
                "Video call session. Send me your materials 24 hours beforehand so I can prepare notes."
            ),
            "category": "Career",
            "tags": [{"label": "CV", "entityId": ""}, {"label": "design", "entityId": ""}, {"label": "career", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [28.99, 41.06], "address": "Online"},
            "is_remote": True,
            "scheduling_type": "open",
            "open_availability": "Weekday evenings",
            "image_urls": [IMAGES["cv"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Morning Run Buddy — Kadıköy Coastal Path",
            "description": (
                "Looking for a running partner for early morning runs along the Kadıköy–Moda coastal path. "
                "I run 3–4 times a week at a comfortable 6:00–6:30 min/km pace, usually 5–8km. "
                "Running with someone makes it much easier to get out of bed. "
                "Any pace near mine is fine — we can adjust. Meet at Moda İskele at 7am."
            ),
            "category": "Health & Fitness",
            "tags": [{"label": "running", "entityId": ""}, {"label": "outdoors", "entityId": ""}, {"label": "fitness", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 2,
            "location": {"type": "Point", "coordinates": [29.03, 40.982], "address": "Moda, Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Tuesday", "Thursday", "Saturday"], "time": "07:00"},
            "image_urls": [IMAGES["running"], IMAGES["running2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },

        # ── OUTSIDE ISTANBUL — OFFERS ────────────────────────────────────────────
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Surf Lesson for Beginners — Alaçatı",
            "description": (
                "Alaçatı is one of the best spots in Europe for beginner windsurfers and paddleboarders, "
                "and I'm there every September. I'll teach you the fundamentals of paddleboarding in the "
                "calm lagoon: balance, paddling technique, turning, and how to read the water. "
                "Board and wetsuit provided. Two-hour session, maximum two people at a time. "
                "Suitable for anyone with no previous experience."
            ),
            "category": "Sports & Outdoors",
            "tags": [{"label": "surf", "entityId": ""}, {"label": "outdoors", "entityId": ""}, {"label": "İzmir", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 2,
            "location": {"type": "Point", "coordinates": [26.377, 38.282], "address": "Alaçatı, İzmir"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "September weekends",
            "image_urls": [IMAGES["surf"], IMAGES["surf2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Rooftop Beekeeping Introduction — Bodrum",
            "description": (
                "I keep three hives on the roof of a family house near Bodrum harbour. "
                "If you've ever been curious about urban beekeeping — how a hive is structured, "
                "how to handle bees calmly, how to harvest honey without a suit — this is for you. "
                "We'll suit up, open a hive together, find the queen, and taste fresh comb honey. "
                "Available summer months. Maximum 3 people per session."
            ),
            "category": "Nature & Animals",
            "tags": [{"label": "beekeeping", "entityId": ""}, {"label": "nature", "entityId": ""}, {"label": "Bodrum", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 2.5,
            "max_participants": 3,
            "location": {"type": "Point", "coordinates": [27.425, 37.034], "address": "Bodrum, Muğla"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "June–August, flexible",
            "image_urls": [IMAGES["beekeeping"], IMAGES["beekeeping2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Ceramics Studio Session — Ankara",
            "description": (
                "I have access to a ceramics studio in Çankaya, Ankara with a proper kick wheel and kiln. "
                "I'll guide you through hand-building or wheel-throwing depending on your preference. "
                "We'll make one piece per session — bowl, mug, or small vase. "
                "Firing takes a week; I'll post the finished piece to you anywhere in Turkey. "
                "No experience needed. Clay, tools, and firing included."
            ),
            "category": "Arts & Creative",
            "tags": [{"label": "ceramics", "entityId": ""}, {"label": "crafts", "entityId": ""}, {"label": "Ankara", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 3.0,
            "max_participants": 2,
            "location": {"type": "Point", "coordinates": [32.859, 39.920], "address": "Çankaya, Ankara"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "When visiting Ankara — check with me first",
            "image_urls": [IMAGES["ceramics"], IMAGES["ceramics2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Olive Harvest Help — Ayvalık",
            "description": (
                "My family has a small olive grove near Ayvalık. Every November we harvest by hand — "
                "it takes four days and we always need extra help. In exchange for a day's work "
                "you get accommodation, all meals (my mother's cooking is the real reward), "
                "and a 5-litre tin of cold-press olive oil to take home. "
                "Hard physical work but deeply satisfying. Arrivals Friday evening, finish Monday afternoon."
            ),
            "category": "Agriculture",
            "tags": [{"label": "olive harvest", "entityId": ""}, {"label": "farm", "entityId": ""}, {"label": "Ayvalık", "entityId": ""}],
            "service_type": "offer",
            "status": "active",
            "estimated_duration": 8.0,
            "max_participants": 3,
            "location": {"type": "Point", "coordinates": [26.688, 39.318], "address": "Ayvalık, Balıkesir"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=190)).strftime("%Y-%m-%d"),
            "specific_time": "18:00",
            "image_urls": [IMAGES["olive"], IMAGES["gardening"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },

        # ── OUTSIDE ISTANBUL — NEEDS ─────────────────────────────────────────────
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Hiking Guide for Kaçkar Mountains",
            "description": (
                "I'm planning a 4-day trek in the Kaçkar Mountains in August and need someone who knows "
                "the trails well. I'm an experienced hiker but the Kaçkars are new to me. "
                "Looking for a local guide or someone who's done the main ridge traverse. "
                "Happy to share costs, cook every evening, and exchange Python tutoring sessions online afterwards."
            ),
            "category": "Sports & Outdoors",
            "tags": [{"label": "hiking", "entityId": ""}, {"label": "mountains", "entityId": ""}, {"label": "Kaçkar", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 8.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [41.126, 40.837], "address": "Kaçkar Mountains, Rize"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=95)).strftime("%Y-%m-%d"),
            "specific_time": "08:00",
            "image_urls": [IMAGES["hike"], IMAGES["hike2"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },

        # ── NEEDS ────────────────────────────────────────────────────────────────
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Python Programming Tutoring",
            "description": (
                "Looking for someone patient to help me level up my Python — data structures, OOP, "
                "and building a small real-world project. I have the basics covered but keep hitting walls. "
                "Online sessions preferred. Happy to exchange bread baking lessons or running company!"
            ),
            "category": "Education",
            "tags": [{"label": "python", "entityId": ""}, {"label": "programming", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 1.5,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.02, 40.99], "address": "Online"},
            "is_remote": True,
            "scheduling_type": "open",
            "open_availability": "Weekends, flexible",
            "image_urls": [IMAGES["coding"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Furniture Assembly Help",
            "description": (
                "I have two IKEA PAX wardrobes and a KALLAX shelf that need assembling. "
                "Everything is out of the box and the instructions are right there — I just need "
                "someone with more spatial patience than me and ideally a power drill. "
                "I'll make lunch. Şişli, easy parking on the street."
            ),
            "category": "Home & Garden",
            "tags": [{"label": "furniture", "entityId": ""}, {"label": "DIY", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 3.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [28.99, 41.06], "address": "Şişli, Istanbul"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"),
            "specific_time": "11:00",
            "image_urls": [IMAGES["furniture"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Portrait Photography Session",
            "description": (
                "Need updated photos for my LinkedIn and portfolio — professional but not stiff. "
                "I'd love outdoor shots somewhere in Beyoğlu or Karaköy with natural light. "
                "Happy to plan the location together. Weekends preferred, morning light is ideal."
            ),
            "category": "Arts & Creative",
            "tags": [{"label": "photography", "entityId": ""}, {"label": "portrait", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 2.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [28.97, 41.03], "address": "Beyoğlu, Istanbul"},
            "is_remote": False,
            "scheduling_type": "open",
            "open_availability": "Weekend mornings",
            "image_urls": [IMAGES["photography"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Someone to Water My Plants While I'm Away",
            "description": (
                "I'll be in Ankara for 10 days and have about 30 indoor plants that need watering "
                "every 2–3 days. My flat is in Beyoğlu, close to the metro. "
                "Very easy — I'll leave written instructions for each plant. "
                "Happy to return the favour or exchange for language sessions."
            ),
            "category": "Home & Garden",
            "tags": [{"label": "plants", "entityId": ""}, {"label": "home care", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 0.5,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [28.975, 41.033], "address": "Beyoğlu, Istanbul"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"),
            "specific_time": "09:00",
            "image_urls": [IMAGES["plants"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Help Moving a Few Large Items",
            "description": (
                "I'm rearranging my flat and need help moving a heavy bookshelf and a solid wood dining table "
                "between rooms. Nothing is going up or down stairs — just within one floor. "
                "Should take under an hour with two people. Kadıköy, close to the market. "
                "I'll cook dinner for anyone who helps."
            ),
            "category": "Home & Garden",
            "tags": [{"label": "moving", "entityId": ""}, {"label": "help", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.02, 40.99], "address": "Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "specific",
            "specific_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "specific_time": "16:00",
            "image_urls": [IMAGES["moving"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Neighbourhood Grocery Run for My Elderly Neighbour",
            "description": (
                "My upstairs neighbour, Mrs Fatma (78), has trouble walking to the market since her knee surgery. "
                "I'm looking for someone willing to add her shopping list to their weekly grocery run — "
                "she shops at the Migros on Bağdat Caddesi and pays cash on delivery. "
                "This is a recurring need, ideally weekly. Small list, usually under 20 items."
            ),
            "category": "Community Care",
            "tags": [{"label": "elderly care", "entityId": ""}, {"label": "community", "entityId": ""}, {"label": "grocery", "entityId": ""}],
            "service_type": "need",
            "status": "active",
            "estimated_duration": 1.0,
            "max_participants": 1,
            "location": {"type": "Point", "coordinates": [29.06, 40.97], "address": "Bağdat Caddesi, Kadıköy, Istanbul"},
            "is_remote": False,
            "scheduling_type": "recurring",
            "recurring_pattern": {"days": ["Saturday"], "time": "11:00"},
            "image_urls": [IMAGES["market"]],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
    ]

    await db["services"].insert_many(services)
    print(f"  inserted {len(services)} services")


async def seed_events(db, users: dict, communities: dict):
    alice = users["alice_seed"]
    bob   = users["bob_seed"]
    ceren = users["ceren_seed"]
    david = users["david_seed"]
    elif_ = users["elif_seed"]

    events = [
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Monthly Repair Café",
            "description": (
                "Our monthly repair café is open to everyone — members and non-members alike. "
                "Bring broken electronics, appliances, bikes, or anything else you think might be fixable. "
                "Skilled volunteers are on hand to help. We've fixed over 200 items in the past year and kept "
                "them out of landfill. Coffee and tea provided. Donations welcome but never required."
            ),
            "event_at": days(7),
            "location": "Beşiktaş Community Centre, Çarşı Mah., Istanbul",
            "latitude": 41.044, "longitude": 29.005,
            "is_remote": False,
            "tags": [{"label": "repair", "entityId": ""}, {"label": "community", "entityId": ""}],
            "community_id": str(communities["repair"]),
            "image_urls": [IMAGES["workshop"], IMAGES["coding2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Sunday Language Exchange Breakfast",
            "description": (
                "We take over the back room of a Kadıköy café every other Sunday for a relaxed language exchange. "
                "The format is simple: find a partner at the opposite table, speak their language for 20 minutes, "
                "then switch. We rotate three times. Ends with everyone at one table and free conversation. "
                "Active languages this session: Turkish, English, Spanish, French. Seats limited to 14."
            ),
            "event_at": days(13),
            "location": "Fazıl Bey Kahvesi, Moda Caddesi, Kadıköy",
            "latitude": 40.987, "longitude": 29.024,
            "is_remote": False,
            "tags": [{"label": "language", "entityId": ""}, {"label": "social", "entityId": ""}],
            "community_id": str(communities["language"]),
            "image_urls": [IMAGES["breakfast"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Spring Planting Day at Moda Park",
            "description": (
                "The big one of the year — our spring community planting day. We'll be building two new raised beds, "
                "dividing overwintered perennials, and sowing tomatoes, courgettes, and herbs together. "
                "Experienced growers will guide beginners through every step. "
                "Bring gloves if you have them. Tools, seeds, and compost are provided. "
                "We end with a shared picnic — please bring something to contribute to the table."
            ),
            "event_at": days(10),
            "location": "Moda Park Community Garden, Kadıköy",
            "latitude": 40.981, "longitude": 29.028,
            "is_remote": False,
            "tags": [{"label": "gardening", "entityId": ""}, {"label": "community", "entityId": ""}],
            "community_id": str(communities["garden"]),
            "image_urls": [IMAGES["park"], IMAGES["gardening2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Rooftop Film Night: Yol (1982)",
            "description": (
                "We're screening Yılmaz Güney's Palme d'Or-winning Yol on the rooftop of a building in Moda. "
                "The film runs 114 minutes. We'll have a 30-minute discussion afterwards. "
                "Bring a jacket — it gets cool after sunset. Bean bags and cushions provided, "
                "or bring your own blanket. Subtitles in English and Turkish. Free entry, donation jar for drinks."
            ),
            "event_at": days(18),
            "location": "Moda Rooftop (address shared with RSVP), Kadıköy",
            "latitude": 40.984, "longitude": 29.026,
            "is_remote": False,
            "tags": [{"label": "film", "entityId": ""}, {"label": "cinema", "entityId": ""}, {"label": "outdoor", "entityId": ""}],
            "community_id": str(communities["film"]),
            "image_urls": [IMAGES["cinema"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Dawn Run: Bosphorus Coastal Path (10km)",
            "description": (
                "We meet at Kalamış Marina at first light and run the coastal path north to Fenerbahçe Park and back — "
                "about 10km with beautiful Bosphorus views the whole way. Pace 5:45–6:15 per km. "
                "All levels welcome as long as you can cover the distance comfortably. "
                "Coffee at Moda afterwards. Bring a water bottle and headlamp just in case."
            ),
            "event_at": days(4),
            "location": "Kalamış Marina, Kadıköy, Istanbul",
            "latitude": 40.969, "longitude": 29.038,
            "is_remote": False,
            "tags": [{"label": "running", "entityId": ""}, {"label": "outdoors", "entityId": ""}],
            "community_id": str(communities["running"]),
            "image_urls": [IMAGES["trail"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Mending Circle — Slow Fashion Afternoon",
            "description": (
                "A quiet Sunday afternoon for anyone who wants to mend, sew, or just sit and make something. "
                "Bring a broken item of clothing or a project you've been putting off. "
                "I'll be there to guide visible mending techniques — sashiko, darning, and patchwork. "
                "No experience needed. We'll have tea, music, and good company. "
                "Location: my studio in Şişli, capacity 8 people."
            ),
            "event_at": days(9),
            "location": "Ceren's Studio, Harbiye, Şişli, Istanbul",
            "latitude": 41.061, "longitude": 28.993,
            "is_remote": False,
            "tags": [{"label": "sewing", "entityId": ""}, {"label": "sustainability", "entityId": ""}, {"label": "crafts", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["sewing"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Online Python Workshop for Beginners",
            "description": (
                "A two-hour workshop covering Python from zero: variables, loops, functions, and a small real project. "
                "We'll build a simple command-line tool together by the end of the session. "
                "No installation needed — we'll use an online IDE. "
                "Limited to 8 participants so everyone gets attention. Session recorded and shared afterwards."
            ),
            "event_at": days(5),
            "location": None, "latitude": None, "longitude": None,
            "is_remote": True,
            "tags": [{"label": "python", "entityId": ""}, {"label": "programming", "entityId": ""}, {"label": "beginner", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["coding"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": alice,
            "title": "Neighbourhood Swap & Share Bazaar",
            "description": (
                "A free, no-money swap market in Beşiktaş. Bring things you no longer need — clothes, books, "
                "kitchenware, plants, tools — and take whatever catches your eye. "
                "No price tags, no transactions, no waste. Everything left over at the end is donated. "
                "Also a good excuse to meet your neighbours. Outdoor event, rain contingency plan in place."
            ),
            "event_at": days(21),
            "location": "Beşiktaş Çarşı Square, Istanbul",
            "latitude": 41.043, "longitude": 29.003,
            "is_remote": False,
            "tags": [{"label": "swap", "entityId": ""}, {"label": "community", "entityId": ""}, {"label": "sustainability", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["bazaar"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Acoustic Session: Balcony Concert in Beyoğlu",
            "description": (
                "A small acoustic concert on a wide Beyoğlu balcony overlooking the rooftops. "
                "Three local musicians playing sets of 25 minutes each — folk, jazz, and one surprise. "
                "Capacity strictly 20 people. Standing room on the balcony and inside by the open door. "
                "Drinks from the kitchen on a donation basis. One of those evenings that only happens in this city."
            ),
            "event_at": days(16),
            "location": "Private Balcony, Asmalımescit, Beyoğlu (address shared on RSVP)",
            "latitude": 41.031, "longitude": 28.976,
            "is_remote": False,
            "tags": [{"label": "music", "entityId": ""}, {"label": "community", "entityId": ""}, {"label": "local", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["concert"], IMAGES["music2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Fermentation Tasting & Q&A",
            "description": (
                "An informal afternoon of tasting and talking about fermented foods. I'll bring twelve "
                "different ferments: kombuchas at different stages, water kefir, kvass, several lacto-fermented "
                "vegetables, and a mystery guest ferment. We taste, discuss the process, ask questions. "
                "No lecture format — just curiosity and conversation. Open garden in Kadıköy, 15 people max."
            ),
            "event_at": days(25),
            "location": "David's Garden, Moda, Kadıköy, Istanbul",
            "latitude": 40.983, "longitude": 29.027,
            "is_remote": False,
            "tags": [{"label": "fermentation", "entityId": ""}, {"label": "food", "entityId": ""}, {"label": "community", "entityId": ""}],
            "community_id": str(communities["garden"]),
            "image_urls": [IMAGES["fermentation"], IMAGES["fermentation2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },

        # ── OUTSIDE ISTANBUL ─────────────────────────────────────────────────────
        {
            "_id": ObjectId(),
            "user_id": david,
            "title": "Kaçkar Trails Clean-Up Day",
            "description": (
                "A volunteer trail clean-up along the Kaçkar ridge, organised with the local hiking association. "
                "We collect litter, clear overgrown sections, and mark a newly opened side trail. "
                "Work starts at dawn, finishes mid-afternoon. Free lunch provided by the village. "
                "No experience needed — just good boots and the desire to give something back to a mountain "
                "that gives a lot to those who walk it. Transport from Çamlıhemşin arranged on request."
            ),
            "event_at": days(60),
            "location": "Çamlıhemşin, Rize",
            "latitude": 40.987, "longitude": 41.063,
            "is_remote": False,
            "tags": [{"label": "hiking", "entityId": ""}, {"label": "volunteering", "entityId": ""}, {"label": "nature", "entityId": ""}],
            "community_id": str(communities["running"]),
            "image_urls": [IMAGES["hike"], IMAGES["hike2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": elif_,
            "title": "Ayvalık Olive Harvest Weekend",
            "description": (
                "Join us for a long weekend in Elif's family olive grove near Ayvalık. "
                "We harvest by hand, press the olives the same day, and eat together every evening. "
                "It's hard work but the kind that leaves you feeling genuinely good. "
                "Accommodation in the family house. Bring work clothes and an appetite. "
                "Spots limited to 6 people. This event happens once a year — don't miss it."
            ),
            "event_at": days(192),
            "location": "Olive Grove, Ayvalık, Balıkesir",
            "latitude": 39.318, "longitude": 26.688,
            "is_remote": False,
            "tags": [{"label": "harvest", "entityId": ""}, {"label": "farm", "entityId": ""}, {"label": "community", "entityId": ""}],
            "community_id": str(communities["garden"]),
            "image_urls": [IMAGES["olive"], IMAGES["gardening"], IMAGES["picnic"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": ceren,
            "title": "Ankara Design & Craft Fair",
            "description": (
                "A two-day craft and design fair in the Kızılay district of Ankara. "
                "Independent makers, textile artists, ceramic studios, and small-batch food producers. "
                "I'll have a table showcasing visible mending work and slow fashion pieces. "
                "Come say hello, browse, and meet the people behind the things. "
                "Free entry. Saturday and Sunday, 10:00–18:00."
            ),
            "event_at": days(35),
            "location": "Kızılay Meydanı, Çankaya, Ankara",
            "latitude": 39.919, "longitude": 32.854,
            "is_remote": False,
            "tags": [{"label": "crafts", "entityId": ""}, {"label": "design", "entityId": ""}, {"label": "Ankara", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["bazaar"], IMAGES["sewing2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
        },
        {
            "_id": ObjectId(),
            "user_id": bob,
            "title": "Alaçatı Open Kitchen: Sourdough Pop-Up",
            "description": (
                "I'll be in Alaçatı for a week in September and hosting a one-evening sourdough pop-up "
                "in the courtyard of a friend's guesthouse. We bake together, eat together, and I send "
                "everyone home with a portion of starter and the recipe. "
                "Six people maximum. Bring wine if you like. BYOB otherwise casual."
            ),
            "event_at": days(128),
            "location": "Taş Ev Guesthouse, Alaçatı, İzmir",
            "latitude": 38.282, "longitude": 26.376,
            "is_remote": False,
            "tags": [{"label": "baking", "entityId": ""}, {"label": "food", "entityId": ""}, {"label": "İzmir", "entityId": ""}],
            "community_id": None,
            "image_urls": [IMAGES["bread"], IMAGES["bread2"], IMAGES["cooking2"]],
            "attendee_ids": [], "upvoted_by": [],
            "created_at": now(), "updated_at": now(), "seed_marker": SEED_MARKER,
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
    print("  Login: alice_seed / bob_seed / ceren_seed / david_seed / elif_seed")
    print("  Password: Test1234!")


if __name__ == "__main__":
    asyncio.run(main())
