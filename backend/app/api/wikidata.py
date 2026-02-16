from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List

from ..services.wikidata_service import WikidataService

router = APIRouter(prefix="/wikidata", tags=["wikidata"])

# Initialize WikiData service
wikidata_service = WikidataService()

@router.get("/search")
async def search_entities(
    query: str = Query(..., min_length=1, max_length=100, description="Search query"),
    language: Optional[str] = Query("en", max_length=5, description="Language code (e.g., 'en', 'tr')"),
    limit: Optional[int] = Query(10, ge=1, le=50, description="Maximum number of results")
):
    """
    Search WikiData entities
    
    Returns a list of matching entities with their labels, entity IDs, descriptions, and aliases.
    Results are cached for 24 hours to reduce API calls.
    
    Note: Rate limiting is handled by the caching mechanism and WikiData's own rate limits.
    """
    try:
        entities = await wikidata_service.search_entities(
            query=query,
            language=language or "en",
            limit=limit or 10
        )
        
        return {
            "query": query,
            "language": language or "en",
            "results": entities,
            "count": len(entities)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching WikiData: {str(e)}"
        )

