from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from ..models.chat import (
    ChatRoomCreate, ChatRoomUpdate, ChatRoomResponse, ChatRoomListResponse,
    MessageCreate, MessageUpdate, MessageResponse, MessageListResponse
)
from ..models.user import UserResponse
from ..services.chat_service import ChatService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/chat", tags=["chat"])

# Chat Rooms
@router.post("/rooms", response_model=ChatRoomResponse)
async def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new chat room"""
    chat_service = ChatService(db)
    try:
        room = await chat_service.create_chat_room(room_data, str(current_user.id))
        return room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/rooms", response_model=ChatRoomListResponse)
async def get_my_chat_rooms(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get chat rooms for the current user"""
    chat_service = ChatService(db)
    try:
        rooms, total = await chat_service.get_user_chat_rooms(str(current_user.id), page, limit)
        return ChatRoomListResponse(
            rooms=rooms,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/rooms/{room_id}", response_model=ChatRoomResponse)
async def get_chat_room(
    room_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get a specific chat room by ID"""
    chat_service = ChatService(db)
    try:
        room = await chat_service.get_chat_room_by_id(room_id, str(current_user.id))
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat room not found"
            )
        return room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/rooms/{room_id}", response_model=ChatRoomResponse)
async def update_chat_room(
    room_id: str,
    update_data: ChatRoomUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a chat room"""
    chat_service = ChatService(db)
    try:
        updated_room = await chat_service.update_chat_room(room_id, update_data, str(current_user.id))
        if not updated_room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update chat room"
            )
        return updated_room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/rooms/transaction/{transaction_id}", response_model=ChatRoomResponse)
async def create_transaction_chat_room(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a chat room for a specific transaction"""
    chat_service = ChatService(db)
    try:
        room = await chat_service.create_room_for_transaction(transaction_id, str(current_user.id))
        return room
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Messages
@router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Send a message to a chat room"""
    chat_service = ChatService(db)
    try:
        message = await chat_service.send_message(message_data, str(current_user.id))
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/rooms/{room_id}/messages", response_model=MessageListResponse)
async def get_room_messages(
    room_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get messages for a chat room"""
    chat_service = ChatService(db)
    try:
        messages, total = await chat_service.get_room_messages(room_id, str(current_user.id), page, limit)
        return MessageListResponse(
            messages=messages,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get a specific message by ID"""
    chat_service = ChatService(db)
    try:
        message = await chat_service.get_message_by_id(message_id, str(current_user.id))
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    update_data: MessageUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a message"""
    chat_service = ChatService(db)
    try:
        updated_message = await chat_service.update_message(message_id, update_data, str(current_user.id))
        if not updated_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update message"
            )
        return updated_message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a message"""
    chat_service = ChatService(db)
    try:
        success = await chat_service.delete_message(message_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete message"
            )
        return {"message": "Message deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
