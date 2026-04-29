from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from ..models.community import (
    CommunityCreate, CommunityUpdate,
    CommunityResponse, CommunityListResponse,
    CommunityPostCreate, CommunityPostUpdate,
    CommunityPostResponse, CommunityPostListResponse,
    MembershipListResponse, MemberRoleUpdate, MemberRole,
)
from ..models.forum import ForumEventListResponse, ForumDiscussionListResponse
from ..models.user import UserResponse
from ..services.community_service import CommunityService
from ..services.forum_service import ForumService
from ..api.auth import get_current_user, get_optional_current_user
from ..core.database import get_database

router = APIRouter(prefix="/communities", tags=["communities"])


def _svc(db) -> CommunityService:
    return CommunityService(db)


# ══════════════════════════════════════════════════
#  Communities
# ══════════════════════════════════════════════════

@router.get("", response_model=CommunityListResponse)
async def list_communities(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    tag: Optional[str] = None,
    my_only: bool = False,
    sort_by: str = Query("member_count", pattern="^(member_count|created_at|post_count)$"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    user_id = str(current_user.id) if current_user else None
    communities, total = await svc.get_communities(
        page=page, limit=limit, q=q, tag=tag,
        user_id=user_id, my_only=my_only, sort_by=sort_by,
    )
    return CommunityListResponse(communities=communities, total=total, page=page, limit=limit)


@router.post("", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    data: CommunityCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.create_community(data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/my", response_model=CommunityListResponse)
async def my_communities(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    communities, total = await svc.get_communities(
        user_id=str(current_user.id), my_only=True, limit=100
    )
    return CommunityListResponse(communities=communities, total=total, page=1, limit=100)


@router.get("/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    user_id = str(current_user.id) if current_user else None
    community = await svc.get_community_by_id(community_id, user_id)
    if not community:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
    return community


@router.put("/{community_id}", response_model=CommunityResponse)
async def update_community(
    community_id: str,
    data: CommunityUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        result = await svc.update_community(community_id, data, str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_community(
    community_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        await svc.delete_community(community_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ══════════════════════════════════════════════════
#  Membership
# ══════════════════════════════════════════════════

@router.post("/{community_id}/join", response_model=CommunityResponse)
async def join_community(
    community_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.join_community(community_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{community_id}/leave", response_model=CommunityResponse)
async def leave_community(
    community_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.leave_community(community_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{community_id}/members", response_model=MembershipListResponse)
async def get_members(
    community_id: str,
    db=Depends(get_database),
):
    svc = _svc(db)
    members, total = await svc.get_members(community_id)
    return MembershipListResponse(members=members, total=total)


@router.put("/{community_id}/members/{user_id}/role")
async def update_member_role(
    community_id: str,
    user_id: str,
    data: MemberRoleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        await svc.update_member_role(community_id, user_id, data.role, str(current_user.id))
        return {"message": "Role updated"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{community_id}/members/{user_id}/ban")
async def ban_member(
    community_id: str,
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        await svc.ban_member(community_id, user_id, str(current_user.id))
        return {"message": "Member banned"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{community_id}/members/{user_id}")
async def remove_member(
    community_id: str,
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        await svc.remove_member(community_id, user_id, str(current_user.id))
        return {"message": "Member removed"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ══════════════════════════════════════════════════
#  Posts
# ══════════════════════════════════════════════════

@router.get("/{community_id}/posts", response_model=CommunityPostListResponse)
async def list_posts(
    community_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(created_at|upvote_count)$"),
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    user_id = str(current_user.id) if current_user else None
    posts, total = await svc.get_posts(community_id, page, limit, q, sort_by, user_id)
    return CommunityPostListResponse(posts=posts, total=total, page=page, limit=limit)


@router.post("/{community_id}/posts", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    community_id: str,
    data: CommunityPostCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.create_post(community_id, data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{community_id}/posts/{post_id}", response_model=CommunityPostResponse)
async def get_post(
    community_id: str,
    post_id: str,
    current_user: Optional[UserResponse] = Depends(get_optional_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    user_id = str(current_user.id) if current_user else None
    post = await svc.get_post_by_id(community_id, post_id, user_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@router.put("/{community_id}/posts/{post_id}", response_model=CommunityPostResponse)
async def update_post(
    community_id: str,
    post_id: str,
    data: CommunityPostUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        result = await svc.update_post(community_id, post_id, data, str(current_user.id))
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{community_id}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    community_id: str,
    post_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        await svc.delete_post(community_id, post_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{community_id}/posts/{post_id}/pin", response_model=CommunityPostResponse)
async def pin_post(
    community_id: str,
    post_id: str,
    pinned: bool = True,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.pin_post(community_id, post_id, str(current_user.id), pinned)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{community_id}/posts/{post_id}/upvote")
async def upvote_post(
    community_id: str,
    post_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    svc = _svc(db)
    try:
        return await svc.toggle_upvote(community_id, post_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ══════════════════════════════════════════════════
#  Community-linked forum content
# ══════════════════════════════════════════════════

@router.get("/{community_id}/events", response_model=ForumEventListResponse)
async def get_community_events(
    community_id: str,
    db=Depends(get_database),
):
    forum_svc = ForumService(db)
    events = await forum_svc.get_events_for_community(community_id)
    return ForumEventListResponse(events=events, total=len(events), page=1, limit=len(events) or 1)


@router.get("/{community_id}/discussions", response_model=ForumDiscussionListResponse)
async def get_community_discussions(
    community_id: str,
    db=Depends(get_database),
):
    forum_svc = ForumService(db)
    discussions = await forum_svc.get_discussions_for_community(community_id)
    return ForumDiscussionListResponse(discussions=discussions, total=len(discussions), page=1, limit=len(discussions) or 1)
