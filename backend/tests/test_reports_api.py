import pytest
from fastapi import status

from app.models.user import UserRole
from tests.api_test_utils import create_user_with_headers, insert_service_doc


def _item_id(item):
    return item.get("id") or item.get("_id")


class TestReportsAPI:
    @pytest.mark.asyncio
    async def test_user_can_create_check_and_deduplicate_service_report(
        self, test_client, mock_db
    ):
        reporter, reporter_headers = await create_user_with_headers(mock_db, "reports_user")
        owner, _ = await create_user_with_headers(mock_db, "reports_owner")
        service = await insert_service_doc(mock_db, str(owner.id), title="Reportable Service")

        payload = {
            "report_type": "service",
            "reported_id": str(service["_id"]),
            "reason": "spam",
            "description": "This listing is duplicated spam.",
        }
        created = test_client.post("/reports/", headers=reporter_headers, json=payload)

        assert created.status_code == status.HTTP_201_CREATED
        created_body = created.json()
        assert created_body["status"] == "pending"
        assert created_body["reported_by"] == str(reporter.id)
        assert created_body["reported_details"]["title"] == "Reportable Service"
        assert created_body["reporter_details"]["username"] == "reports_user"

        pending = test_client.get(
            "/reports/pending",
            headers=reporter_headers,
            params={"report_type": "service", "reported_id": str(service["_id"])},
        )
        assert pending.status_code == status.HTTP_200_OK
        assert pending.json()["pending"] is True
        assert pending.json()["report_id"] == _item_id(created_body)

        duplicate = test_client.post("/reports/", headers=reporter_headers, json=payload)
        assert duplicate.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.asyncio
    async def test_report_admin_list_and_update_require_privileged_user(
        self, test_client, mock_db
    ):
        target, _ = await create_user_with_headers(mock_db, "reported_person")
        reporter, reporter_headers = await create_user_with_headers(mock_db, "reporter_person")
        moderator, moderator_headers = await create_user_with_headers(
            mock_db, "reports_moderator", role=UserRole.MODERATOR
        )
        _, regular_headers = await create_user_with_headers(mock_db, "reports_regular")

        created = test_client.post(
            "/reports/",
            headers=reporter_headers,
            json={
                "report_type": "user",
                "reported_id": str(target.id),
                "reason": "abusive",
                "description": "Abusive profile content.",
            },
        )
        assert created.status_code == status.HTTP_201_CREATED
        report_id = _item_id(created.json())

        forbidden = test_client.get("/reports/admin", headers=regular_headers)
        assert forbidden.status_code == status.HTTP_403_FORBIDDEN

        listed = test_client.get(
            "/reports/admin",
            headers=moderator_headers,
            params={"status": "pending", "report_type": "user"},
        )
        assert listed.status_code == status.HTTP_200_OK
        listed_body = listed.json()
        assert listed_body["total"] == 1
        assert listed_body["reports"][0]["reported_details"]["username"] == "reported_person"

        updated = test_client.put(
            f"/reports/admin/{report_id}",
            headers=moderator_headers,
            json={"status": "resolved", "resolution_notes": "Reviewed and resolved."},
        )
        assert updated.status_code == status.HTTP_200_OK
        assert updated.json()["status"] == "resolved"
        assert updated.json()["resolved_by"] == str(moderator.id)

        listed_resolved = test_client.get(
            "/reports/admin",
            headers=moderator_headers,
            params={"status": "resolved"},
        )
        assert listed_resolved.status_code == status.HTTP_200_OK
        assert listed_resolved.json()["total"] == 1

    @pytest.mark.asyncio
    async def test_user_report_validation_errors(self, test_client, mock_db):
        user, headers = await create_user_with_headers(mock_db, "self_reporter")

        self_report = test_client.post(
            "/reports/",
            headers=headers,
            json={
                "report_type": "user",
                "reported_id": str(user.id),
                "reason": "other",
                "description": "Trying to report myself.",
            },
        )
        assert self_report.status_code == status.HTTP_400_BAD_REQUEST

        pending = test_client.get(
            "/reports/pending",
            headers=headers,
            params={"report_type": "user", "reported_id": str(user.id)},
        )
        assert pending.status_code == status.HTTP_200_OK
        assert pending.json() == {"pending": False, "report_id": None, "created_at": None}
