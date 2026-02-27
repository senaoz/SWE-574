import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from ..models.user import UserResponse, UserUpdate, TimeBankResponse, UserRole, UserRoleUpdate, UserSettingsUpdate, PasswordChange, AccountDeletion
from ..services.user_service import UserService
from ..services.badge_service import BadgeService
from ..api.auth import get_current_user
from ..core.database import get_database
from ..core.permissions import require_admin, require_moderator_or_admin
from ..constants.interests import AVAILABLE_INTERESTS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user's profile"""
    logger.info("GET /users/profile user_id=%s", current_user.id)
    return current_user

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update user profile"""
    user_service = UserService(db)
    
    if user_update.username and user_update.username != current_user.username:
        existing_user = await user_service.get_user_by_username(user_update.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    updated_user = await user_service.update_user(str(current_user.id), user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )
    
    return updated_user

@router.get("/timebank", response_model=TimeBankResponse)
async def get_timebank_balance(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get user's TimeBank balance and transaction history"""
    user_service = UserService(db)
    
    try:
        timebank_data = await user_service.get_timebank_balance(str(current_user.id))
        return timebank_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/badges", response_model=dict)
async def get_my_badges(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Get current user's badges with progress"""
    logger.info("GET /users/badges user_id=%s", current_user.id)
    badge_service = BadgeService(db)
    try:
        result = await badge_service.get_badge_summary(str(current_user.id))
        logger.info("GET /users/badges ok earned=%s", result.get("earned_count"))
        return result
    except ValueError as e:
        logger.warning("GET /users/badges error: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/available-interests", response_model=list[str])
async def get_available_interests():
    """Get list of available interest categories (single-segment path to avoid /{user_id} match)"""
    logger.info("GET /users/available-interests")
    return AVAILABLE_INTERESTS

@router.get("/settings", response_model=UserResponse)
async def get_user_settings(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current user's settings"""
    return current_user

@router.put("/settings", response_model=UserResponse)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update user privacy and notification settings"""
    user_service = UserService(db)
    
    updated_user = await user_service.update_user_settings(str(current_user.id), settings_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update settings"
        )
    
    return updated_user

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Change user password"""
    user_service = UserService(db)
    
    if password_change.new_password != password_change.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    success = await user_service.change_password(str(current_user.id), password_change)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to change password. Please check your current password."
        )
    
    return {"message": "Password changed successfully"}

@router.post("/account/delete")
async def delete_account(
    account_deletion: AccountDeletion,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete user account (soft delete)"""
    user_service = UserService(db)
    
    success = await user_service.delete_account(str(current_user.id), account_deletion.password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete account. Please check your password."
        )
    
    return {"message": "Account deleted successfully"}

@router.get("/role/{role}", response_model=list[UserResponse])
async def get_users_by_role(
    role: UserRole,
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database)
):
    """Get users by role (admin or moderator only)"""
    user_service = UserService(db)
    
    users = await user_service.get_users_by_role(role)
    return users

@router.get("/", response_model=list[UserResponse])
async def get_all_users(
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database)
):
    """Get all users (admin or moderator only)"""
    user_service = UserService(db)
    
    try:
        users = []
        cursor = user_service.users_collection.find({}).sort("created_at", -1)
        async for user_doc in cursor:
            users.append(UserResponse(**user_doc))
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching users: {str(e)}"
        )

@router.get("/admin/timebank-transactions", response_model=dict)
async def get_all_timebank_transactions(
    page: int = 1,
    limit: int = 50,
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database)
):
    """Get all TimeBank transactions (admin or moderator only)"""
    user_service = UserService(db)
    
    try:
        transactions, total = await user_service.get_all_timebank_transactions(page, limit)
        return {
            "transactions": transactions,
            "total": total,
            "page": page,
            "limit": limit
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ──────────────────────────────────────────────
# Parameterized /{user_id} routes LAST to avoid
# catching static paths like /badges, /settings
# ──────────────────────────────────────────────

@router.get("/{user_id}/badges", response_model=dict)
async def get_user_badges(
    user_id: str,
    db=Depends(get_database),
):
    """Get badges for a specific user"""
    badge_service = BadgeService(db)
    try:
        return await badge_service.get_badge_summary(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database)
):
    """Update user role (admin or moderator only)"""
    user_service = UserService(db)
    
    target_user = await user_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    updated_user = await user_service.update_user_role(user_id, role_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user role"
        )
    
    return updated_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    db=Depends(get_database)
):
    """Get user by ID"""
    logger.info("GET /users/%s", user_id)
    user_service = UserService(db)
    
    try:
        user = await user_service.get_user_by_id(user_id)
        if not user:
            logger.warning("GET /users/%s user not found", user_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("GET /users/%s error: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching user: {str(e)}"
        )
