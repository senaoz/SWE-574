from fastapi import Depends, HTTPException, status
from typing import List
from ..models.user import UserResponse, UserRole
from ..api.auth import get_current_user


def require_role(required_roles: List[UserRole]):
    """Decorator to require specific roles for access"""
    def role_checker(current_user: UserResponse = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in required_roles]}"
            )
        return current_user
    return role_checker


def require_admin():
    """Require admin role"""
    return require_role([UserRole.ADMIN])


def require_moderator_or_admin():
    """Require moderator or admin role"""
    return require_role([UserRole.MODERATOR, UserRole.ADMIN])


def require_any_role():
    """Require any authenticated user (no specific role required)"""
    return get_current_user
