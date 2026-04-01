import os
import uuid
import time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi import status

from ..core.config import settings
from ..api.auth import get_current_user
from ..models.user import UserResponse

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

def _validate_image(file: UploadFile) -> str:
    """Validate file type and size. Returns extension for the allowed type."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
        )
    # Read and check size (max_upload_size_mb)
    content = file.file.read()
    file.file.seek(0)
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file is not allowed",
        )
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.max_upload_size_mb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb} MB",
        )
    return CONTENT_TYPE_EXT[file.content_type]


def _save_upload(file: UploadFile, subdir: str, filename: str) -> str:
    """Save file to upload_dir/subdir/filename. Returns URL path (e.g. /uploads/profile/...)."""
    base = os.path.abspath(settings.upload_dir)
    path_dir = os.path.join(base, subdir)
    os.makedirs(path_dir, exist_ok=True)
    path = os.path.join(path_dir, filename)
    # Prevent path traversal
    if not os.path.abspath(path).startswith(base):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path")
    with open(path, "wb") as f:
        f.write(file.file.read())
    return f"/uploads/{subdir}/{filename}"


@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """Upload a profile picture. Returns the URL to use in profile update."""
    ext = _validate_image(file)
    filename = f"{current_user.id}_{int(time.time())}{ext}"
    url = _save_upload(file, "profile", filename)
    return {"url": url}


@router.post("/service-image")
async def upload_service_image(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """Upload a service image. Returns the URL to use when creating/updating a service."""
    ext = _validate_image(file)
    filename = f"{uuid.uuid4().hex}{ext}"
    url = _save_upload(file, "services", filename)
    return {"url": url}