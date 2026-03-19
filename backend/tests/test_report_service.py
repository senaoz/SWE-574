import pytest

from app.models.report import ReportCreate, ReportReason, ReportStatus, ReportStatusUpdate
from app.services.report_service import ReportService, PendingReportExistsError


class TestReportService:
    @pytest.mark.asyncio
    async def test_create_report_blocks_duplicate_pending(self, mock_db, test_user, sample_service):
        report_service = ReportService(mock_db)

        data = ReportCreate(
            report_type="service",
            reported_id=str(sample_service.id),
            reason=ReportReason.SPAM,
            description="Spammy content",
        )

        created = await report_service.create_report(data, str(test_user.id))
        assert created.status == ReportStatus.PENDING

        with pytest.raises(PendingReportExistsError):
            await report_service.create_report(data, str(test_user.id))

    @pytest.mark.asyncio
    async def test_create_report_allows_after_resolved(self, mock_db, test_user, second_user, sample_service):
        report_service = ReportService(mock_db)

        data = ReportCreate(
            report_type="service",
            reported_id=str(sample_service.id),
            reason=ReportReason.ABUSIVE,
        )
        created = await report_service.create_report(data, str(test_user.id))

        update = ReportStatusUpdate(status=ReportStatus.RESOLVED, resolution_notes="Handled")
        updated = await report_service.update_report_status(str(created.id), update, str(second_user.id))
        assert updated is not None
        assert updated.status == ReportStatus.RESOLVED

        created_again = await report_service.create_report(data, str(test_user.id))
        assert created_again is not None
