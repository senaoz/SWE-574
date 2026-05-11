"""
Find forum discussions and events that have no comments.
Usage: python scripts/find_uncommented_items.py [--mongo-url <url>] [--db <name>]
"""

import asyncio
import sys
import os
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId


async def find_uncommented_items(mongo_url: str, db_name: str):
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Collect all target_ids that have at least one comment, grouped by target_type
    commented_ids: dict[str, set] = {"discussion": set(), "event": set()}

    async for comment in db.forum_comments.find(
        {"target_type": {"$in": ["discussion", "event"]}},
        {"target_type": 1, "target_id": 1},
    ):
        t = comment.get("target_type")
        if t in commented_ids:
            commented_ids[t].add(str(comment["target_id"]))

    # Find discussions without any comment
    uncommented_discussions = []
    async for doc in db.forum_discussions.find(
        {}, {"_id": 1, "title": 1, "user_id": 1, "created_at": 1}
    ):
        if str(doc["_id"]) not in commented_ids["discussion"]:
            uncommented_discussions.append(doc)

    # Find events without any comment
    uncommented_events = []
    async for doc in db.forum_events.find(
        {}, {"_id": 1, "title": 1, "user_id": 1, "created_at": 1, "event_at": 1}
    ):
        if str(doc["_id"]) not in commented_ids["event"]:
            uncommented_events.append(doc)

    client.close()
    return uncommented_discussions, uncommented_events


def fmt(doc: dict, extra_key: str | None = None) -> str:
    created = doc.get("created_at", "")
    if isinstance(created, datetime):
        created = created.strftime("%Y-%m-%d %H:%M")
    extra = ""
    if extra_key and doc.get(extra_key):
        val = doc[extra_key]
        if isinstance(val, datetime):
            val = val.strftime("%Y-%m-%d %H:%M")
        extra = f"  {extra_key}: {val}"
    return f"  [{doc['_id']}]  {doc.get('title', '(no title)')!r}  created: {created}{extra}"


async def main():
    parser = argparse.ArgumentParser(description="Find forum items with no comments")
    parser.add_argument(
        "--mongo-url",
        default=os.getenv("MONGODB_URL", "mongodb://localhost:38017"),
        help="MongoDB connection URL (default: mongodb://localhost:38017)",
    )
    parser.add_argument(
        "--db",
        default=os.getenv("DATABASE_NAME", "hive_platform"),
        help="Database name (default: hive_platform)",
    )
    args = parser.parse_args()

    print(f"Connecting to {args.mongo_url} / {args.db} …\n")

    discussions, events = await find_uncommented_items(args.mongo_url, args.db)

    print(f"=== Discussions with no comments ({len(discussions)}) ===")
    if discussions:
        for d in discussions:
            print(fmt(d))
    else:
        print("  (none)")

    print(f"\n=== Events with no comments ({len(events)}) ===")
    if events:
        for e in events:
            print(fmt(e, extra_key="event_at"))
    else:
        print("  (none)")

    total = len(discussions) + len(events)
    print(f"\nTotal uncommented items: {total}")


if __name__ == "__main__":
    asyncio.run(main())
