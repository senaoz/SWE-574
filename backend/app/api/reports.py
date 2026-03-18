from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from ..models.report import ReportCreate, ReportStatusUpdate, ReportResponse, ReportListResponse
from ..models.user import UserResponse
from ..services.report_service import ReportService
from ..api.auth import get_current_user
from ..core.database import get_database
from ..core.permissions import require_moderator_or_admin

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    """Submit a report against a user or service."""
    try:
        service = ReportService(db)
        return await service.create_report(data, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/admin", response_model=ReportListResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database),
):
    """List all reports (admin/moderator only)."""
    try:
        service = ReportService(db)
        reports, total = await service.get_reports(page, limit, status, report_type)
        return ReportListResponse(reports=reports, total=total, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/admin/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    update: ReportStatusUpdate,
    current_user: UserResponse = Depends(require_moderator_or_admin()),
    db=Depends(get_database),
):
    """Update report status (admin/moderator only)."""
    try:
        service = ReportService(db)
        report = await service.update_report_status(report_id, update, str(current_user.id))
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
