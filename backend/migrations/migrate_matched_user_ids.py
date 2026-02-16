"""
Migration script to convert matched_user_id to matched_user_ids
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


async def migrate_matched_user_ids():
    """Migrate matched_user_id to matched_user_ids list"""
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
    services_collection = db.services
    
    print("🔄 Starting migration: matched_user_id -> matched_user_ids")
    
    # Find all services with matched_user_id
    services_with_matched = await services_collection.find({
        "matched_user_id": {"$exists": True, "$ne": None}
    }).to_list(length=None)
    
    print(f"📊 Found {len(services_with_matched)} services with matched_user_id")
    
    migrated_count = 0
    skipped_count = 0
    
    for service in services_with_matched:
        service_id = service["_id"]
        matched_user_id = service.get("matched_user_id")
        matched_user_ids = service.get("matched_user_ids", [])
        
        # Skip if already migrated
        if isinstance(matched_user_ids, list) and len(matched_user_ids) > 0:
            # Check if matched_user_id is already in the list
            if matched_user_id and str(matched_user_id) not in [str(mid) for mid in matched_user_ids]:
                # Add to list
                matched_user_ids.append(matched_user_id)
                await services_collection.update_one(
                    {"_id": service_id},
                    {
                        "$set": {
                            "matched_user_ids": matched_user_ids,
                            "updated_at": datetime.now(timezone.utc)
                        },
                        "$unset": {"matched_user_id": ""}
                    }
                )
                migrated_count += 1
            else:
                # Already migrated, just remove old field
                await services_collection.update_one(
                    {"_id": service_id},
                    {
                        "$unset": {"matched_user_id": ""}
                    }
                )
                skipped_count += 1
        elif matched_user_id:
            # Convert single matched_user_id to list
            await services_collection.update_one(
                {"_id": service_id},
                {
                    "$set": {
                        "matched_user_ids": [matched_user_id],
                        "updated_at": datetime.utcnow()
                    },
                    "$unset": {"matched_user_id": ""}
                }
            )
            migrated_count += 1
        else:
            # No matched_user_id, ensure matched_user_ids is empty list
            await services_collection.update_one(
                {"_id": service_id},
                {
                    "$set": {
                        "matched_user_ids": [],
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$unset": {"matched_user_id": ""}
                }
            )
            skipped_count += 1
    
    # Also handle services without matched_user_id but need matched_user_ids field
    services_without_field = await services_collection.find({
        "matched_user_ids": {"$exists": False}
    }).to_list(length=None)
    
    for service in services_without_field:
        await services_collection.update_one(
            {"_id": service["_id"]},
            {
                "$set": {
                    "matched_user_ids": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        migrated_count += 1
    
    print(f"✅ Migration completed!")
    print(f"   - Migrated: {migrated_count} services")
    print(f"   - Skipped: {skipped_count} services")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_matched_user_ids())

