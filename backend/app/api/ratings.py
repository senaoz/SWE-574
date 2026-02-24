from fastapi import APIRouter, Depends, HTTPException, status

from ..models.rating import RatingCreate, RatingResponse, RatingListResponse
from ..models.user import UserResponse
from ..services.rating_service import RatingService
from ..api.auth import get_current_user
from ..core.database import get_database

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/", response_model=RatingResponse)
async def create_rating(
    rating_data: RatingCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    rating_service = RatingService(db)
    try:
        rating = await rating_service.create_rating(str(current_user.id), rating_data)
        return rating
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/user/{user_id}", response_model=RatingListResponse)
async def get_user_ratings(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    db=Depends(get_database),
):
    rating_service = RatingService(db)
    try:
        ratings, total, avg = await rating_service.get_ratings_for_user(user_id, page, limit)
        return RatingListResponse(ratings=ratings, total=total, average_score=avg)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/transaction/{transaction_id}", response_model=list[RatingResponse])
async def get_transaction_ratings(
    transaction_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database),
):
    rating_service = RatingService(db)
    try:
        ratings = await rating_service.get_ratings_for_transaction(transaction_id)
        return ratings
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
