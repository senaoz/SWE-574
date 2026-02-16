from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from ..models.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionListResponse
from ..models.user import UserResponse
from ..services.transaction_service import TransactionService
from ..api.auth import get_current_user
from ..core.database import get_database
from ..core.permissions import require_admin

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new transaction"""
    transaction_service = TransactionService(db)
    try:
        transaction = await transaction_service.create_transaction(transaction_data)
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my-transactions", response_model=TransactionListResponse)
async def get_my_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get transactions for the current user"""
    transaction_service = TransactionService(db)
    try:
        transactions, total = await transaction_service.get_user_transactions(str(current_user.id), page, limit)
        return TransactionListResponse(
            transactions=transactions,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/service/{service_id}", response_model=TransactionListResponse)
async def get_service_transactions(
    service_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get transactions for a specific service"""
    transaction_service = TransactionService(db)
    try:
        transactions, total = await transaction_service.get_service_transactions(service_id, page, limit)
        return TransactionListResponse(
            transactions=transactions,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a transaction"""
    transaction_service = TransactionService(db)
    try:
        updated_transaction = await transaction_service.update_transaction_status(transaction_id, update_data, str(current_user.id))
        if not updated_transaction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update transaction"
            )
        return updated_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{transaction_id}/confirm-completion", response_model=TransactionResponse)
async def confirm_transaction_completion(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Confirm transaction completion (requires both provider and requester to confirm)"""
    transaction_service = TransactionService(db)
    try:
        updated_transaction = await transaction_service.confirm_transaction_completion(transaction_id, str(current_user.id))
        return updated_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{transaction_id}/complete", response_model=TransactionResponse)
async def complete_transaction(
    transaction_id: str,
    completion_notes: str = None,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Mark a transaction as completed (deprecated - use confirm-completion instead)"""
    transaction_service = TransactionService(db)
    try:
        completed_transaction = await transaction_service.complete_transaction(transaction_id, str(current_user.id), completion_notes)
        if not completed_transaction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to complete transaction"
            )
        return completed_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get a specific transaction by ID"""
    transaction_service = TransactionService(db)
    try:
        transaction = await transaction_service.get_transaction_by_id(transaction_id)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        return transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/admin/all", response_model=TransactionListResponse)
async def get_all_transactions_admin(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(require_admin()),
    db=Depends(get_database)
):
    """Get all transactions (admin only)"""
    transaction_service = TransactionService(db)
    try:
        transactions, total = await transaction_service.get_all_transactions(page, limit)
        return TransactionListResponse(
            transactions=transactions,
            total=total,
            page=page,
            limit=limit
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
