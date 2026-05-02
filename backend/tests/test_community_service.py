from datetime import datetime

import pytest
from bson import ObjectId

from app.models.community import CommunityCreate
from app.services.community_service import CommunityService


def make_user_doc(user_id, username):
    return {
        "_id": ObjectId(user_id),
        "username": username,
        "full_name": f"{username} full",
        "email": f"{username}@example.com",
        "password_hash": "hash",
        "is_active": True,
        "is_verified": True,
        "role": "user",
        "timebank_balance": 5.0,
        "profile_picture": None,
        "profile_visible": True,
        "show_email": False,
        "show_location": True,
        "email_notifications": True,
        "service_matches_notifications": True,
        "messages_notifications": True,
        "interests": [],
        "social_links": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


async def create_community(svc, name, user_id):
    return await svc.create_community(
        CommunityCreate(name=name, description=f"{name} description"),
        user_id,
    )


@pytest.mark.asyncio
async def test_get_members_includes_mutual_community_count(mock_db):
    viewer_id = str(ObjectId())
    member_id = str(ObjectId())
    await mock_db.users.insert_one(make_user_doc(viewer_id, "viewer"))
    await mock_db.users.insert_one(make_user_doc(member_id, "member"))

    svc = CommunityService(mock_db)
    listed = await create_community(svc, "Running Club", viewer_id)
    await svc.join_community(str(listed["_id"]), member_id)

    second_common = await create_community(svc, "Book Club", member_id)
    await svc.join_community(str(second_common["_id"]), viewer_id)

    await create_community(svc, "Viewer Only", viewer_id)
    await create_community(svc, "Member Only", member_id)

    members, total = await svc.get_members(str(listed["_id"]), viewer_id)

    assert total == 2
    listed_member = next(m for m in members if str(m["user_id"]) == member_id)
    viewer_member = next(m for m in members if str(m["user_id"]) == viewer_id)
    assert listed_member["mutual_community_count"] == 2
    assert viewer_member["mutual_community_count"] == 3
    assert listed_member["user"]["username"] == "member"


@pytest.mark.asyncio
async def test_get_communities_for_user_includes_memberships_and_mutual_count(mock_db):
    viewer_id = str(ObjectId())
    profile_user_id = str(ObjectId())
    await mock_db.users.insert_one(make_user_doc(viewer_id, "viewer"))
    await mock_db.users.insert_one(make_user_doc(profile_user_id, "profileuser"))

    svc = CommunityService(mock_db)
    shared = await create_community(svc, "Shared Club", profile_user_id)
    await svc.join_community(str(shared["_id"]), viewer_id)

    target_only = await create_community(svc, "Target Only Club", profile_user_id)
    viewer_only = await create_community(svc, "Viewer Only Club", viewer_id)

    result = await svc.get_communities_for_user(profile_user_id, viewer_id)

    assert result["total"] == 2
    assert result["mutual_count"] == 1
    community_by_id = {str(c["_id"]): c for c in result["communities"]}
    assert str(shared["_id"]) in community_by_id
    assert str(target_only["_id"]) in community_by_id
    assert str(viewer_only["_id"]) not in community_by_id
    assert community_by_id[str(shared["_id"])]["target_membership"] == "founder"
    assert community_by_id[str(shared["_id"])]["user_membership"] == "member"
    assert community_by_id[str(shared["_id"])]["is_mutual"] is True
    assert community_by_id[str(target_only["_id"])]["is_mutual"] is False
