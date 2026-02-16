"""
Migration script to convert chat room service_id to service_ids
Run this script once to migrate existing data in the database.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

# Support both MONGODB_URI and MONGODB_URL for compatibility
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hive_platform")
MONGO_USERNAME = os.getenv("MONGO_ROOT_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_ROOT_PASSWORD")


async def migrate_chat_service_ids():
    """Migrate chat room service_id to service_ids list"""
    # Build connection string with authentication if credentials are provided
    uri = MONGO_URI
    if MONGO_USERNAME and MONGO_PASSWORD:
        # Parse URI and add authentication
        if "://" in uri:
            protocol, rest = uri.split("://", 1)
            if "@" not in rest:  # Only add auth if not already present
                uri = f"{protocol}://{MONGO_USERNAME}:{MONGO_PASSWORD}@{rest}"
    
    client = AsyncIOMotorClient(uri)
    db = client[DATABASE_NAME]
    chat_rooms_collection = db.chat_rooms
    
    print("🔄 Starting migration: chat room service_id -> service_ids")
    
    # Find all chat rooms with service_id
    rooms_with_service = await chat_rooms_collection.find({
        "service_id": {"$exists": True, "$ne": None}
    }).to_list(length=None)
    
    print(f"📊 Found {len(rooms_with_service)} chat rooms with service_id")
    
    migrated_count = 0
    skipped_count = 0
    
    for room in rooms_with_service:
        room_id = room["_id"]
        service_id = room.get("service_id")
        service_ids = room.get("service_ids", [])
        
        # Skip if already migrated
        if isinstance(service_ids, list) and len(service_ids) > 0:
            # Check if service_id is already in the list
            if service_id and str(service_id) not in [str(sid) for sid in service_ids]:
                # Add to list
                service_ids.append(service_id)
                await chat_rooms_collection.update_one(
                    {"_id": room_id},
                    {
                        "$set": {
                            "service_ids": service_ids,
                            "updated_at": datetime.now(timezone.utc)
                        },
                        "$unset": {"service_id": ""}
                    }
                )
                migrated_count += 1
            else:
                # Already migrated, just remove old field
                await chat_rooms_collection.update_one(
                    {"_id": room_id},
                    {
                        "$unset": {"service_id": ""}
                    }
                )
                skipped_count += 1
        elif service_id:
            # Convert single service_id to list
            await chat_rooms_collection.update_one(
                {"_id": room_id},
                {
                    "$set": {
                        "service_ids": [service_id],
                        "updated_at": datetime.utcnow()
                    },
                    "$unset": {"service_id": ""}
                }
            )
            migrated_count += 1
        else:
            # No service_id, ensure service_ids is empty list
            await chat_rooms_collection.update_one(
                {"_id": room_id},
                {
                    "$set": {
                        "service_ids": [],
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$unset": {"service_id": ""}
                }
            )
            skipped_count += 1
    
    # Also handle rooms without service_id but need service_ids field
    rooms_without_field = await chat_rooms_collection.find({
        "service_ids": {"$exists": False}
    }).to_list(length=None)
    
    for room in rooms_without_field:
        await chat_rooms_collection.update_one(
            {"_id": room["_id"]},
            {
                "$set": {
                    "service_ids": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        migrated_count += 1
    
    print(f"✅ Migration completed!")
    print(f"   - Migrated: {migrated_count} chat rooms")
    print(f"   - Skipped: {skipped_count} chat rooms")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_chat_service_ids())

