from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..models.report import ReportCreate, ReportStatusUpdate, ReportResponse, ReportType


class PendingReportExistsError(ValueError):
    pass


class ReportService:
    def __init__(self, db):
        self.db = db
        self.collection = db.reports
        self.users_collection = db.users
        self.services_collection = db.services

    async def create_report(self, data: ReportCreate, reporter_id: str) -> ReportResponse:
        """Create a new report. Prevents self-reporting and duplicate pending reports."""
        if data.report_type == ReportType.USER and data.reported_id == reporter_id:
            raise ValueError("You cannot report yourself")

        report_type_value = data.report_type.value
        existing = await self.collection.find_one(
            {
                "reported_by": reporter_id,
                "report_type": report_type_value,
                "reported_id": data.reported_id,
                "status": "pending",
            }
        )
        if existing:
            raise PendingReportExistsError(
                "You already have a pending report for this target. Please wait until it is reviewed."
            )

        payload = data.dict()
        payload["report_type"] = report_type_value
        payload["reason"] = data.reason.value
        report_doc = {
            **payload,
            "reported_by": reporter_id,
            "status": "pending",
            "resolved_by": None,
            "resolution_notes": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        try:
            result = await self.collection.insert_one(report_doc)
        except DuplicateKeyError:
            raise PendingReportExistsError(
                "You already have a pending report for this target. Please wait until it is reviewed."
            )
        report_doc["_id"] = result.inserted_id
        return await self._populate(report_doc)

    async def get_pending_report(
        self, reporter_id: str, report_type: ReportType, reported_id: str
    ) -> Optional[dict]:
        doc = await self.collection.find_one(
            {
                "reported_by": reporter_id,
                "report_type": report_type.value,
                "reported_id": reported_id,
                "status": "pending",
            }
        )
        if not doc:
            return None
        return {
            "report_id": str(doc.get("_id")),
            "created_at": doc.get("created_at"),
        }

    async def get_reports(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None,
        report_type: Optional[str] = None,
    ) -> Tuple[List[ReportResponse], int]:
        query = {}
        if status:
            query["status"] = status
        if report_type:
            query["report_type"] = report_type

        total = await self.collection.count_documents(query)
        skip = (page - 1) * limit
        cursor = self.collection.find(query).skip(skip).limit(limit).sort("created_at", -1)

        reports = []
        async for doc in cursor:
            reports.append(await self._populate(doc))

        return reports, total

    async def update_report_status(
        self, report_id: str, update: ReportStatusUpdate, resolver_id: str
    ) -> Optional[ReportResponse]:
        update_data = {
            "status": update.status,
            "resolution_notes": update.resolution_notes,
            "resolved_by": resolver_id,
            "updated_at": datetime.utcnow(),
        }
        result = await self.collection.update_one(
            {"_id": ObjectId(report_id)}, {"$set": update_data}
        )
        if result.modified_count:
            doc = await self.collection.find_one({"_id": ObjectId(report_id)})
            return await self._populate(doc)
        return None

    async def _populate(self, doc: dict) -> ReportResponse:
        """Enrich report with reporter and reported entity details."""
        try:
            reporter = await self.users_collection.find_one({"_id": ObjectId(doc["reported_by"])})
            if reporter:
                doc["reporter_details"] = {
                    "_id": str(reporter["_id"]),
                    "username": reporter.get("username"),
                    "email": reporter.get("email"),
                }
        except Exception:
            pass

        try:
            if doc["report_type"] == "user":
                entity = await self.users_collection.find_one({"_id": ObjectId(doc["reported_id"])})
                if entity:
                    doc["reported_details"] = {
                        "_id": str(entity["_id"]),
                        "username": entity.get("username"),
                        "email": entity.get("email"),
                    }
            else:
                entity = await self.services_collection.find_one({"_id": ObjectId(doc["reported_id"])})
                if entity:
                    doc["reported_details"] = {
                        "_id": str(entity["_id"]),
                        "title": entity.get("title"),
                    }
        except Exception:
            pass

        return ReportResponse(**doc)
