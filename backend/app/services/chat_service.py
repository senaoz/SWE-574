from typing import List, Optional, Tuple
from datetime import datetime
from bson import ObjectId

from ..models.chat import (
    ChatRoomCreate, ChatRoomUpdate, ChatRoomResponse, 
    MessageCreate, MessageUpdate, MessageResponse,
    ChatRoomParticipant
)
from ..core.database import get_database


class ChatService:
    def __init__(self, db):
        self.db = db
        self.chat_rooms_collection = db.chat_rooms
        self.messages_collection = db.messages
        self.users_collection = db.users
        self.services_collection = db.services
        self.transactions_collection = db.transactions

    async def create_chat_room(self, room_data: ChatRoomCreate, creator_id: str) -> ChatRoomResponse:
        """Create a new chat room"""
        try:
            # Verify all participants exist
            participant_ids = [ObjectId(pid) for pid in room_data.participant_ids]
            for participant_id in participant_ids:
                user = await self.users_collection.find_one({"_id": participant_id})
                if not user:
                    raise ValueError(f"User {participant_id} not found")
            
            # Check if creator is in participants
            creator_object_id = ObjectId(creator_id)
            if creator_object_id not in participant_ids:
                raise ValueError("Creator must be a participant in the chat room")

            # Check if room already exists for these participants
            existing_room = await self.chat_rooms_collection.find_one({
                "participant_ids": {"$all": participant_ids, "$size": len(participant_ids)},
                "is_active": True
            })
            
            # Collect service IDs to add
            service_ids_to_add = []
            if room_data.service_id:
                service_ids_to_add.append(ObjectId(room_data.service_id))
            if room_data.service_ids:
                service_ids_to_add.extend([ObjectId(sid) for sid in room_data.service_ids])
            
            if existing_room:
                # Room exists, add service_id to service_ids list if provided
                if service_ids_to_add:
                    # Add new service IDs to existing room
                    await self.chat_rooms_collection.update_one(
                        {"_id": existing_room["_id"]},
                        {
                            "$addToSet": {"service_ids": {"$each": service_ids_to_add}},
                            "$set": {"updated_at": datetime.utcnow()}
                        }
                    )
                    # Refresh the room document
                    existing_room = await self.chat_rooms_collection.find_one({"_id": existing_room["_id"]})
                
                # Populate and return existing room
                return await self._populate_room_response(existing_room)
            
            # Create new room document
            room_doc = {
                "name": room_data.name,
                "description": room_data.description,
                "is_active": room_data.is_active,
                "participant_ids": participant_ids,
                "service_ids": service_ids_to_add if service_ids_to_add else [],
                "transaction_id": ObjectId(room_data.transaction_id) if room_data.transaction_id else None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_message_at": None
            }
            
            result = await self.chat_rooms_collection.insert_one(room_doc)
            room_doc["_id"] = result.inserted_id
            
            return await self._populate_room_response(room_doc)
        except Exception as e:
            raise ValueError(f"Error creating chat room: {str(e)}, {participant_ids}")

    async def _populate_room_response(self, room_doc: dict) -> ChatRoomResponse:
        """Helper method to populate room response with participants, services, and transaction"""
        # Populate participants
        participants = []
        for participant_id in room_doc.get("participant_ids", []):
            user = await self.users_collection.find_one({"_id": participant_id})
            if user:
                participants.append({
                    "id": str(user["_id"]),
                    "username": user["username"],
                    "full_name": user.get("full_name"),
                    "bio": user.get("bio")
                })
        room_doc["participants"] = participants
        
        # Populate services (multiple services support)
        services = []
        service_ids = room_doc.get("service_ids", [])
        # Handle backward compatibility: if service_id exists but not in service_ids
        if room_doc.get("service_id") and room_doc["service_id"] not in service_ids:
            service_ids.append(room_doc["service_id"])
        
        for service_id in service_ids:
            service = await self.services_collection.find_one({"_id": service_id})
            if service:
                services.append({
                    "id": str(service["_id"]),
                    "title": service["title"],
                    "description": service.get("description"),
                    "category": service.get("category")
                })
        
        room_doc["services"] = services
        # For backward compatibility, set first service as service
        if services:
            room_doc["service"] = services[0]
        
        # Populate transaction if exists
        if room_doc.get("transaction_id"):
            transaction = await self.transactions_collection.find_one({"_id": room_doc["transaction_id"]})
            if transaction:
                room_doc["transaction"] = {
                    "id": str(transaction["_id"]),
                    "status": transaction.get("status"),
                    "hours": transaction.get("hours")
                }
        
        return ChatRoomResponse(**room_doc)

    async def get_user_chat_rooms(self, user_id: str, page: int = 1, limit: int = 20) -> Tuple[List[ChatRoomResponse], int]:
        """Get chat rooms for a specific user with pagination"""
        try:
            query = {
                "participant_ids": ObjectId(user_id),
                "is_active": True
            }
            total = await self.chat_rooms_collection.count_documents(query)
            
            skip = (page - 1) * limit
            cursor = self.chat_rooms_collection.find(query).skip(skip).limit(limit).sort("last_message_at", -1)
            
            rooms = []
            async for room_doc in cursor:
                rooms.append(await self._populate_room_response(room_doc))
            
            return rooms, total
        except Exception as e:
            raise ValueError(f"Error fetching user chat rooms: {str(e)}")

    async def get_chat_room_by_id(self, room_id: str, user_id: str) -> Optional[ChatRoomResponse]:
        """Get a specific chat room by ID (only if user is a participant)"""
        try:
            room_doc = await self.chat_rooms_collection.find_one({
                "_id": ObjectId(room_id),
                "participant_ids": ObjectId(user_id),
                "is_active": True
            })
            
            if not room_doc:
                return None
            
            return await self._populate_room_response(room_doc)
        except Exception:
            return None

    async def update_chat_room(self, room_id: str, update_data: ChatRoomUpdate, user_id: str) -> Optional[ChatRoomResponse]:
        """Update a chat room (only if user is a participant)"""
        try:
            # Verify user is a participant
            room = await self.chat_rooms_collection.find_one({
                "_id": ObjectId(room_id),
                "participant_ids": ObjectId(user_id),
                "is_active": True
            })
            
            if not room:
                raise ValueError("Chat room not found or user not authorized")
            
            update_doc = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_doc:
                return await self.get_chat_room_by_id(room_id, user_id)
            
            update_doc["updated_at"] = datetime.utcnow()
            
            result = await self.chat_rooms_collection.update_one(
                {"_id": ObjectId(room_id)},
                {"$set": update_doc}
            )
            
            if result.modified_count > 0:
                return await self.get_chat_room_by_id(room_id, user_id)
            return None
        except Exception as e:
            raise ValueError(f"Error updating chat room: {str(e)}")

    async def send_message(self, message_data: MessageCreate, sender_id: str) -> MessageResponse:
        """Send a message to a chat room"""
        try:
            # Verify sender is a participant in the room
            room = await self.chat_rooms_collection.find_one({
                "_id": ObjectId(message_data.room_id),
                "participant_ids": ObjectId(sender_id),
                "is_active": True
            })
            
            if not room:
                raise ValueError("Chat room not found or user not authorized")
            
            # Create message document
            message_doc = {
                **message_data.dict(),
                "room_id": ObjectId(message_data.room_id),
                "sender_id": ObjectId(sender_id),
                "reply_to_message_id": ObjectId(message_data.reply_to_message_id) if message_data.reply_to_message_id else None,
                "is_edited": False,
                "is_deleted": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.messages_collection.insert_one(message_doc)
            message_doc["_id"] = result.inserted_id
            
            # Update room's last_message_at
            await self.chat_rooms_collection.update_one(
                {"_id": ObjectId(message_data.room_id)},
                {"$set": {"last_message_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
            )
            
            return MessageResponse(**message_doc)
        except Exception as e:
            raise ValueError(f"Error sending message: {str(e)}")

    async def get_room_messages(self, room_id: str, user_id: str, page: int = 1, limit: int = 50) -> Tuple[List[MessageResponse], int]:
        """Get messages for a chat room (only if user is a participant)"""
        try:
            # Verify user is a participant
            room = await self.chat_rooms_collection.find_one({
                "_id": ObjectId(room_id),
                "participant_ids": ObjectId(user_id),
                "is_active": True
            })
            
            if not room:
                raise ValueError("Chat room not found or user not authorized")
            
            query = {"room_id": ObjectId(room_id), "is_deleted": False}
            total = await self.messages_collection.count_documents(query)
            
            skip = (page - 1) * limit
            cursor = self.messages_collection.find(query).skip(skip).limit(limit).sort("created_at", -1)
            
            messages = []
            async for message_doc in cursor:
                # Populate sender info
                sender = await self.users_collection.find_one({"_id": message_doc["sender_id"]})
                if sender:
                    message_doc["sender"] = {
                        "id": str(sender["_id"]),
                        "username": sender["username"],
                        "full_name": sender.get("full_name")
                    }
                
                # Populate reply to message if exists
                if message_doc.get("reply_to_message_id"):
                    reply_message = await self.messages_collection.find_one({"_id": message_doc["reply_to_message_id"]})
                    if reply_message:
                        message_doc["reply_to_message"] = {
                            "id": str(reply_message["_id"]),
                            "content": reply_message["content"][:100] + "..." if len(reply_message["content"]) > 100 else reply_message["content"],
                            "sender": message_doc.get("sender", {}).get("username", "Unknown")
                        }
                
                messages.append(MessageResponse(**message_doc))
            
            return messages, total
        except Exception as e:
            raise ValueError(f"Error fetching room messages: {str(e)}")

    async def update_message(self, message_id: str, update_data: MessageUpdate, user_id: str) -> Optional[MessageResponse]:
        """Update a message (only if user is the sender)"""
        try:
            # Verify user is the sender
            message = await self.messages_collection.find_one({
                "_id": ObjectId(message_id),
                "sender_id": ObjectId(user_id),
                "is_deleted": False
            })
            
            if not message:
                raise ValueError("Message not found or user not authorized")
            
            update_doc = {k: v for k, v in update_data.dict().items() if v is not None}
            if not update_doc:
                return await self.get_message_by_id(message_id, user_id)
            
            update_doc["updated_at"] = datetime.utcnow()
            
            result = await self.messages_collection.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": update_doc}
            )
            
            if result.modified_count > 0:
                return await self.get_message_by_id(message_id, user_id)
            return None
        except Exception as e:
            raise ValueError(f"Error updating message: {str(e)}")

    async def delete_message(self, message_id: str, user_id: str) -> bool:
        """Delete a message (soft delete, only if user is the sender)"""
        try:
            # Verify user is the sender
            message = await self.messages_collection.find_one({
                "_id": ObjectId(message_id),
                "sender_id": ObjectId(user_id),
                "is_deleted": False
            })
            
            if not message:
                raise ValueError("Message not found or user not authorized")
            
            result = await self.messages_collection.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise ValueError(f"Error deleting message: {str(e)}")

    async def get_message_by_id(self, message_id: str, user_id: str) -> Optional[MessageResponse]:
        """Get a specific message by ID (only if user is a participant in the room)"""
        try:
            message_doc = await self.messages_collection.find_one({
                "_id": ObjectId(message_id),
                "is_deleted": False
            })
            
            if not message_doc:
                return None
            
            # Verify user is a participant in the room
            room = await self.chat_rooms_collection.find_one({
                "_id": message_doc["room_id"],
                "participant_ids": ObjectId(user_id),
                "is_active": True
            })
            
            if not room:
                return None
            
            # Populate sender info
            sender = await self.users_collection.find_one({"_id": message_doc["sender_id"]})
            if sender:
                message_doc["sender"] = {
                    "id": str(sender["_id"]),
                    "username": sender["username"],
                    "full_name": sender.get("full_name")
                }
            
            return MessageResponse(**message_doc)
        except Exception:
            return None

    async def create_room_for_transaction(self, transaction_id: str, creator_id: str) -> ChatRoomResponse:
        """Create a chat room for a specific transaction"""
        try:
            # Get transaction details
            transaction = await self.transactions_collection.find_one({"_id": ObjectId(transaction_id)})
            if not transaction:
                raise ValueError("Transaction not found")
            
            # Verify creator is involved in the transaction
            if (str(transaction["provider_id"]) != creator_id and 
                str(transaction["requester_id"]) != creator_id):
                raise ValueError("User not authorized to create chat for this transaction")
            
            # Get participants
            participant_ids = [transaction["provider_id"], transaction["requester_id"]]
            
            # Check if room already exists for this transaction
            existing_room = await self.chat_rooms_collection.find_one({
                "transaction_id": ObjectId(transaction_id),
                "is_active": True
            })
            if existing_room:
                return await self._populate_room_response(existing_room)
            
            # Check if room exists for these participants (might be used for multiple transactions)
            existing_participant_room = await self.chat_rooms_collection.find_one({
                "participant_ids": {"$all": [ObjectId(pid) for pid in participant_ids], "$size": len(participant_ids)},
                "is_active": True
            })
            
            if existing_participant_room:
                # Add transaction_id and service_id to existing room
                service_id = transaction.get("service_id")
                update_ops = {
                    "$set": {
                        "transaction_id": ObjectId(transaction_id),
                        "updated_at": datetime.utcnow()
                    }
                }
                if service_id:
                    update_ops["$addToSet"] = {"service_ids": ObjectId(service_id)}
                
                await self.chat_rooms_collection.update_one(
                    {"_id": existing_participant_room["_id"]},
                    update_ops
                )
                existing_participant_room = await self.chat_rooms_collection.find_one({"_id": existing_participant_room["_id"]})
                return await self._populate_room_response(existing_participant_room)
            
            # Create new room
            service_id = transaction.get("service_id")
            room_data = ChatRoomCreate(
                name=f"Transaction Chat - {transaction.get('description', 'Service Exchange')}",
                description=f"Chat for transaction involving {transaction.get('hours', 0)} hours",
                participant_ids=[str(pid) for pid in participant_ids],
                transaction_id=transaction_id,
                service_id=str(service_id) if service_id else None
            )
            
            return await self.create_chat_room(room_data, creator_id)
        except Exception as e:
            raise ValueError(f"Error creating transaction chat room: {str(e)}")
