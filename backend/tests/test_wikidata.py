"""
Tests for WikiData service integration
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta

from app.services.wikidata_service import WikidataService


@pytest.fixture
def wikidata_service():
    """Create a WikiData service instance for testing"""
    return WikidataService()


@pytest.fixture
def mock_wikidata_response():
    """Mock WikiData API response for wbsearchentities"""
    return {
        "search": [
            {
                "id": "Q1234",
                "label": "Cooking",
                "description": "The practice of preparing food",
                "aliases": ["culinary", "food preparation"],
                "url": "https://www.wikidata.org/wiki/Q1234"
            },
            {
                "id": "Q5678",
                "label": "Gardening",
                "description": "The practice of growing plants",
                "aliases": ["horticulture"],
                "url": "https://www.wikidata.org/wiki/Q5678"
            }
        ]
    }


@pytest.mark.asyncio
async def test_search_entities_simple_success(wikidata_service, mock_wikidata_response):
    """Test successful entity search"""
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value=mock_wikidata_response)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        results = await wikidata_service.search_entities_simple("cooking", limit=10)
        
        assert len(results) == 2
        assert results[0]["label"] == "Cooking"
        assert results[0]["entityId"] == "Q1234"
        assert results[1]["label"] == "Gardening"
        assert results[1]["entityId"] == "Q5678"


@pytest.mark.asyncio
async def test_search_entities_simple_empty_query(wikidata_service):
    """Test search with empty query"""
    results = await wikidata_service.search_entities_simple("")
    assert results == []


@pytest.mark.asyncio
async def test_search_entities_simple_cache(wikidata_service, mock_wikidata_response):
    """Test that caching works correctly"""
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value=mock_wikidata_response)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        # First call - should hit API
        results1 = await wikidata_service.search_entities_simple("cooking")
        assert len(results1) == 2
        assert mock_client.get.call_count == 1
        
        # Second call - should use cache
        results2 = await wikidata_service.search_entities_simple("cooking")
        assert len(results2) == 2
        assert results1 == results2
        # Should still be 1 call (cache hit)
        assert mock_client.get.call_count == 1


@pytest.mark.asyncio
async def test_search_entities_simple_timeout(wikidata_service):
    """Test timeout handling"""
    import httpx
    
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(side_effect=httpx.TimeoutException("Request timed out"))
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        results = await wikidata_service.search_entities_simple("cooking")
        assert results == []


@pytest.mark.asyncio
async def test_search_entities_simple_http_error(wikidata_service):
    """Test HTTP error handling"""
    import httpx
    
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.text = "Forbidden"
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "403 Forbidden", request=MagicMock(), response=mock_response
        )
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        results = await wikidata_service.search_entities_simple("cooking")
        assert results == []


@pytest.mark.asyncio
async def test_get_entity_by_id_success(wikidata_service):
    """Test getting entity by ID"""
    mock_entity_data = {
        "entities": {
            "Q42": {
                "id": "Q42",
                "labels": {"en": {"value": "Douglas Adams"}},
                "descriptions": {"en": {"value": "English writer"}}
            }
        }
    }
    
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value=mock_entity_data)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        entity = await wikidata_service.get_entity_by_id("Q42")
        
        assert entity is not None
        assert entity["id"] == "Q42"


@pytest.mark.asyncio
async def test_get_entity_by_id_not_found(wikidata_service):
    """Test getting non-existent entity"""
    mock_entity_data = {
        "entities": {
            "Q999999": {
                "id": "Q999999",
                "missing": ""
            }
        }
    }
    
    with patch("app.services.wikidata_service.httpx.AsyncClient") as mock_client_class:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json = MagicMock(return_value=mock_entity_data)
        mock_response.raise_for_status = MagicMock()
        
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_class.return_value = mock_client
        
        entity = await wikidata_service.get_entity_by_id("Q999999")
        # Should return None if entity has "missing" key
        assert entity is None or "missing" in entity


def test_cache_key_generation(wikidata_service):
    """Test cache key generation"""
    key1 = wikidata_service._get_cache_key("cooking", "en", "text")
    key2 = wikidata_service._get_cache_key("cooking", "en", "text")
    key3 = wikidata_service._get_cache_key("gardening", "en", "text")
    
    assert key1 == key2
    assert key1 != key3


def test_cache_validation(wikidata_service):
    """Test cache validation"""
    cache_key = "test:key"
    
    # Cache should be invalid initially
    assert not wikidata_service._is_cache_valid(cache_key)
    
    # Add to cache
    wikidata_service.cache[cache_key] = []
    wikidata_service.cache_timestamps[cache_key] = datetime.utcnow()
    
    # Should be valid now
    assert wikidata_service._is_cache_valid(cache_key)
    
    # Make cache old
    wikidata_service.cache_timestamps[cache_key] = datetime.utcnow() - timedelta(hours=25)
    
    # Should be invalid now
    assert not wikidata_service._is_cache_valid(cache_key)


def test_clear_cache(wikidata_service):
    """Test cache clearing"""
    # Add some cache entries
    wikidata_service.cache["key1"] = []
    wikidata_service.cache["key2"] = []
    wikidata_service.cache_timestamps["key1"] = datetime.utcnow()
    wikidata_service.cache_timestamps["key2"] = datetime.utcnow()
    
    assert len(wikidata_service.cache) == 2
    
    wikidata_service.clear_cache()
    
    assert len(wikidata_service.cache) == 0
    assert len(wikidata_service.cache_timestamps) == 0


def test_get_cache_stats(wikidata_service):
    """Test cache statistics"""
    # Empty cache
    stats = wikidata_service.get_cache_stats()
    assert stats["total_entries"] == 0
    
    # Add entries
    wikidata_service.cache["key1"] = []
    wikidata_service.cache_timestamps["key1"] = datetime.utcnow()
    
    stats = wikidata_service.get_cache_stats()
    assert stats["total_entries"] == 1
    assert "key1" in stats["cache_keys"]

