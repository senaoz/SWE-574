from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.comment import CommentCreate, CommentUpdate, CommentResponse
from ..core.database import get_database


class CommentService:
    def __init__(self, db):
        self.db = db
        self.comments_collection = db.comments
        self.users_collection = db.users
        self.services_collection = db.services

    async def create_comment(self, comment_data: CommentCreate, user_id: str) -> CommentResponse:
        """Create a new comment"""
        try:
            # Verify service exists
            service = await self.services_collection.find_one({"_id": ObjectId(comment_data.service_id)})
            if not service:
                raise ValueError("Service not found")
            
            comment_doc = {
                **comment_data.dict(),
                "user_id": ObjectId(user_id),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.comments_collection.insert_one(comment_doc)
            comment_doc["_id"] = result.inserted_id
            
            # Get user info for the response
            user = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                comment_doc["user"] = {
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "bio": user.get("bio")
                }
            
            return CommentResponse(**comment_doc)
        except Exception as e:
            raise ValueError(f"Error creating comment: {str(e)}")

    async def get_comments_by_service(self, service_id: str, page: int = 1, limit: int = 20) -> Tuple[List[CommentResponse], int]:
        """Get comments for a service with pagination"""
        try:
            # Build query - try both ObjectId and string formats
            query = {
                "$or": [
                    {"service_id": ObjectId(service_id)},
                    {"service_id": service_id}
                ]
            }

            # Get total count
            total = await self.comments_collection.count_documents(query)
            
            # Get comments with pagination
            skip = (page - 1) * limit
            cursor = self.comments_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            

            print("Query:", {"service_id": ObjectId(service_id)})
            print("Total:", total, "Page:", page, "Limit:", limit, "Skip:", skip, "Cursor:", cursor)

            comments = []


            async for comment_doc in cursor:
                # Get user info for each comment
                user = await self.users_collection.find_one({"_id": comment_doc["user_id"]})
                if user:
                    comment_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                comments.append(CommentResponse(**comment_doc))
            
            return comments, total
        except Exception as e:
            raise ValueError(f"Error fetching comments: {str(e)}")

    async def get_comment_by_id(self, comment_id: str) -> Optional[CommentResponse]:
        """Get comment by ID"""
        try:
            comment_doc = await self.comments_collection.find_one({"_id": ObjectId(comment_id)})
            if comment_doc:
                # Get user info
                user = await self.users_collection.find_one({"_id": comment_doc["user_id"]})
                if user:
                    comment_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                return CommentResponse(**comment_doc)
            return None
        except Exception:
            return None

    async def update_comment(self, comment_id: str, comment_update: CommentUpdate, user_id: str) -> Optional[CommentResponse]:
        """Update a comment (only by author)"""
        try:
            # Check if comment exists and user owns it
            existing_comment = await self.comments_collection.find_one({"_id": ObjectId(comment_id)})
            if not existing_comment:
                raise ValueError("Comment not found")
            
            if str(existing_comment["user_id"]) != user_id:
                raise ValueError("Not authorized to update this comment")
            
            update_data = comment_update.dict()
            update_data["updated_at"] = datetime.utcnow()
            
            result = await self.comments_collection.update_one(
                {"_id": ObjectId(comment_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                return await self.get_comment_by_id(comment_id)
            return None
        except Exception as e:
            raise ValueError(f"Error updating comment: {str(e)}")

    async def delete_comment(self, comment_id: str, user_id: str) -> bool:
        """Delete a comment (only by author)"""
        try:
            # Check if comment exists and user owns it
            existing_comment = await self.comments_collection.find_one({"_id": ObjectId(comment_id)})
            if not existing_comment:
                raise ValueError("Comment not found")
            
            if str(existing_comment["user_id"]) != user_id:
                raise ValueError("Not authorized to delete this comment")
            
            result = await self.comments_collection.delete_one({"_id": ObjectId(comment_id)})
            return result.deleted_count > 0
        except Exception as e:
            raise ValueError(f"Error deleting comment: {str(e)}")

    async def get_user_comments(self, user_id: str, page: int = 1, limit: int = 20) -> Tuple[List[CommentResponse], int]:
        """Get comments by a specific user"""
        try:
            query = {"user_id": ObjectId(user_id)}
            
            # Get total count
            total = await self.comments_collection.count_documents(query)
            
            # Get comments with pagination
            skip = (page - 1) * limit
            cursor = self.comments_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            comments = []
            async for comment_doc in cursor:
                # Get user info for each comment
                user = await self.users_collection.find_one({"_id": comment_doc["user_id"]})
                if user:
                    comment_doc["user"] = {
                        "id": str(user["_id"]),
                        "username": user["username"],
                        "full_name": user.get("full_name"),
                        "bio": user.get("bio")
                    }
                
                comments.append(CommentResponse(**comment_doc))
            
            return comments, total
        except Exception as e:
            raise ValueError(f"Error fetching user comments: {str(e)}")
