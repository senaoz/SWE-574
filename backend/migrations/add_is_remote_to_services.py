"""
Migration script to add is_remote field to existing services.
Run once to backfill is_remote: false for documents that don't have it.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hive_platform")
MONGO_USERNAME = os.getenv("MONGO_ROOT_USERNAME")
MONGO_PASSWORD = os.getenv("MONGO_ROOT_PASSWORD")


async def add_is_remote():
    uri = MONGO_URI
    if MONGO_USERNAME and MONGO_PASSWORD and "@" not in MONGO_URI.split("://", 1)[1]:
        protocol, rest = MONGO_URI.split("://", 1)
        uri = f"{protocol}://{MONGO_USERNAME}:{MONGO_PASSWORD}@{rest}"

    client = AsyncIOMotorClient(uri)
    db = client[DATABASE_NAME]
    services = db.services

    result = await services.update_many(
        {"is_remote": {"$exists": False}},
        {"$set": {"is_remote": False}},
    )
    print(f"✅ Set is_remote=false on {result.modified_count} service(s).")
    client.close()


if __name__ == "__main__":
    asyncio.run(add_is_remote())
