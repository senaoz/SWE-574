from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
import json
from datetime import datetime
from bson import ObjectId

from ..core.database import get_database
from ..api.auth import get_current_user
from ..models.user import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/db/inspect")
async def inspect_database(db=Depends(get_database)) -> Dict[str, Any]:
    """Inspect database collections and documents"""
    try:
        # List all collections
        collections = await db.list_collection_names()
        
        result = {
            "database": "hive_platform",
            "collections": {},
            "total_collections": len(collections),
            "inspection_time": datetime.utcnow().isoformat()
        }
        
        # Inspect each collection
        for collection_name in collections:
            collection = db[collection_name]
            count = await collection.count_documents({})
            
            collection_info = {
                "document_count": count,
                "sample_document": None,
                "sample_keys": []
            }
            
            if count > 0:
                # Get a sample document
                sample = await collection.find_one()
                if sample:
                    # Convert ObjectId to string for JSON serialization
                    sample_str = json.loads(json.dumps(sample, default=str))
                    collection_info["sample_document"] = sample_str
                    collection_info["sample_keys"] = list(sample.keys())
            
            result["collections"][collection_name] = collection_info
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inspecting database: {str(e)}"
        )

@router.get("/db/stats")
async def database_stats(db=Depends(get_database)) -> Dict[str, Any]:
    """Get database statistics"""
    try:
        stats = await db.command("dbStats")
        return {
            "database": "hive_platform",
            "stats": stats,
            "inspection_time": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting database stats: {str(e)}"
        )

@router.get("/failed-transactions")
async def get_failed_transactions(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
    page: int = 1,
    limit: int = 100
) -> Dict[str, Any]:
    """Get failed TimeBank transactions (admin or moderator only)"""
    try:
        # Check if user is admin
        if current_user.role != "admin" and current_user.role != "moderator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or moderator access required"
            )
        
        failed_transactions_collection = db.failed_timebank_transactions
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get total count
        total = await failed_transactions_collection.count_documents({})
        
        # Get failed transactions
        cursor = failed_transactions_collection.find({}).sort("created_at", -1).skip(skip).limit(limit)
        failed_transactions = await cursor.to_list(length=limit)
        
        # Convert ObjectIds to strings and enrich with user info
        users_collection = db.users
        enriched_transactions = []
        
        for transaction in failed_transactions:
            # Convert ObjectId fields to strings
            transaction_dict = {
                "id": str(transaction["_id"]),
                "user_id": str(transaction["user_id"]),
                "amount": transaction["amount"],
                "description": transaction["description"],
                "service_id": str(transaction["service_id"]) if transaction.get("service_id") else None,
                "reason": transaction["reason"],
                "user_balance_at_failure": transaction.get("user_balance_at_failure"),
                "error_message": transaction.get("error_message"),
                "created_at": transaction["created_at"].isoformat() if isinstance(transaction["created_at"], datetime) else str(transaction["created_at"])
            }
            
            # Get user info
            try:
                user = await users_collection.find_one({"_id": transaction["user_id"]})
                if user:
                    transaction_dict["user"] = {
                        "id": str(user["_id"]),
                        "username": user.get("username"),
                        "full_name": user.get("full_name"),
                        "email": user.get("email")
                    }
            except:
                pass
            
            # Get service info if available
            if transaction.get("service_id"):
                try:
                    services_collection = db.services
                    service = await services_collection.find_one({"_id": transaction["service_id"]})
                    if service:
                        transaction_dict["service"] = {
                            "id": str(service["_id"]),
                            "title": service.get("title")
                        }
                except:
                    pass
            
            enriched_transactions.append(transaction_dict)
        
        return {
            "failed_transactions": enriched_transactions,
            "total": total,
            "page": page,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching failed transactions: {str(e)}"
        )

@router.get("/analytics/service-participation")
async def get_service_participation_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
) -> Dict[str, Any]:
    """Get service participation analytics (admin or moderator only)"""
    try:
        # Check if user is admin
        if current_user.role != "admin" and current_user.role != "moderator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or moderator access required"
            )
        
        services_collection = db.services
        join_requests_collection = db.join_requests
        
        # Get all services
        all_services = await services_collection.find({}).to_list(length=None)
        
        # Calculate participation statistics
        total_services = len(all_services)
        services_with_participants = 0
        total_participants = 0
        services_by_status = {}
        participation_by_category = {}
        avg_participants_per_service = 0
        max_participants_service = None
        max_participants_count = 0
        
        for service in all_services:
            # Count participants
            matched_user_ids = service.get("matched_user_ids", [])
            participant_count = len(matched_user_ids) if isinstance(matched_user_ids, list) else (1 if matched_user_ids else 0)
            
            if participant_count > 0:
                services_with_participants += 1
                total_participants += participant_count
            
            # Track by status
            service_status = service.get("status", "unknown")
            services_by_status[service_status] = services_by_status.get(service_status, 0) + 1
            
            # Track by category
            category = service.get("category", "uncategorized")
            if category not in participation_by_category:
                participation_by_category[category] = {
                    "total_services": 0,
                    "services_with_participants": 0,
                    "total_participants": 0,
                    "avg_participants": 0
                }
            participation_by_category[category]["total_services"] += 1
            if participant_count > 0:
                participation_by_category[category]["services_with_participants"] += 1
                participation_by_category[category]["total_participants"] += participant_count
            
            # Track max participants
            if participant_count > max_participants_count:
                max_participants_count = participant_count
                max_participants_service = {
                    "id": str(service["_id"]),
                    "title": service.get("title", "Unknown"),
                    "participants": participant_count,
                    "max_participants": service.get("max_participants", 1)
                }
        
        # Calculate averages
        if total_services > 0:
            avg_participants_per_service = total_participants / total_services
        
        # Calculate category averages
        for category in participation_by_category:
            cat_data = participation_by_category[category]
            if cat_data["total_services"] > 0:
                cat_data["avg_participants"] = cat_data["total_participants"] / cat_data["total_services"]
        
        # Get join request statistics
        total_requests = await join_requests_collection.count_documents({})
        pending_requests = await join_requests_collection.count_documents({"status": "pending"})
        approved_requests = await join_requests_collection.count_documents({"status": "approved"})
        rejected_requests = await join_requests_collection.count_documents({"status": "rejected"})
        
        # Calculate participation rate
        participation_rate = (services_with_participants / total_services * 100) if total_services > 0 else 0
        
        return {
            "summary": {
                "total_services": total_services,
                "services_with_participants": services_with_participants,
                "participation_rate": round(participation_rate, 2),
                "total_participants": total_participants,
                "avg_participants_per_service": round(avg_participants_per_service, 2)
            },
            "services_by_status": services_by_status,
            "participation_by_category": participation_by_category,
            "max_participants_service": max_participants_service,
            "join_requests": {
                "total": total_requests,
                "pending": pending_requests,
                "approved": approved_requests,
                "rejected": rejected_requests,
                "approval_rate": round((approved_requests / total_requests * 100) if total_requests > 0 else 0, 2)
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating analytics: {str(e)}"
        )
