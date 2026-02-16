from typing import List, Optional, Dict
from datetime import datetime, timedelta
import httpx
import logging
import time

logger = logging.getLogger(__name__)

# API URLs
WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php"
CACHE_TTL_HOURS = 24

# User-Agent header required by WikiData API
# Format: AppName/Version (ContactInfo)
USER_AGENT = "HivePlatform/1.0 (https://github.com/senaoz/swe-573)"


class WikidataService:
    """Service for querying WikiData with semantic search and caching"""
    
    def __init__(self):
        self.cache: Dict[str, List[Dict]] = {}
        self.cache_timestamps: Dict[str, datetime] = {}
        logger.info("WikiDataService initialized")
    
    def _get_cache_key(self, query: str, language: str = "en", search_type: str = "text") -> str:
        """Generate cache key from query, language, and search type"""
        cache_key = f"{search_type}:{query.lower().strip()}:{language}"
        logger.debug(f"Generated cache key: {cache_key[:50]}...")
        return cache_key
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cache entry is still valid"""
        if cache_key not in self.cache_timestamps:
            logger.debug(f"Cache miss: {cache_key[:50]}... (not in cache)")
            return False
        
        timestamp = self.cache_timestamps[cache_key]
        age = datetime.utcnow() - timestamp
        is_valid = age < timedelta(hours=CACHE_TTL_HOURS)
        
        if is_valid:
            logger.debug(f"Cache hit: {cache_key[:50]}... (age: {age.total_seconds():.1f}s)")
        else:
            logger.debug(f"Cache expired: {cache_key[:50]}... (age: {age.total_seconds() / 3600:.2f}h)")
        
        return is_valid
    
    async def search_entities(
        self, 
        query: str, 
        language: str = "en", 
        limit: int = 10,
        search_type: str = "text"
    ) -> List[Dict[str, str]]:
        """
        Semantic search for WikiData entities using MediaWiki's full-text search.
        
        This uses the action=query&list=search API which provides better semantic
        search capabilities than wbsearchentities, including:
        - Full-text search across content
        - Query rewriting for spelling corrections
        - Better ranking algorithms
        - Relevance-based sorting
        
        Args:
            query: Search query string
            language: Language code (default: "en")
            limit: Maximum number of results (default: 10)
            search_type: Type of search - "text" (full-text), "title" (title only),
                        or "nearmatch" (near match to title)
        
        Returns:
            List of entities with title, pageId, snippet, timestamp, and wordcount
        """
        start_time = time.time()
        logger.info(f"search_entities called: query='{query}', language={language}, limit={limit}, search_type={search_type}")
        
        if not query or not query.strip():
            logger.warning("Empty query provided to search_entities")
            return []
        
        # Check cache first
        cache_key = self._get_cache_key(query, language, search_type)
        if self._is_cache_valid(cache_key):
            cached_results = self.cache[cache_key]
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Cache hit for query '{query}': returned {len(cached_results)} entities in {elapsed:.2f}ms")
            return cached_results
        
        logger.info(f"Cache miss for query '{query}', querying WikiData API...")
        
        try:
            request_start = time.time()
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "action": "query",
                    "list": "search",
                    "srsearch": query.strip(),
                    "srwhat": search_type,  # text, title, or nearmatch
                    "srlimit": min(limit, 500),  # Max 500 (5000 for bots)
                    "srprop": "snippet|titlesnippet|wordcount|timestamp|size",
                    "format": "json",
                    "srenablerewrites": True,  # Enable query rewriting for better results
                    "uselang": language  # Set UI language for snippets
                }
                
                logger.debug(f"WikiData API request: {WIKIDATA_API_URL} with params: {params}")
                headers = {"User-Agent": USER_AGENT}
                response = await client.get(WIKIDATA_API_URL, params=params, headers=headers)
                request_time = (time.time() - request_start) * 1000
                logger.info(f"WikiData API response received in {request_time:.2f}ms: status={response.status_code}")
                
                response.raise_for_status()
                data = response.json()
                logger.debug(f"Response data keys: {list(data.keys())}")
                
                # Parse results
                entities = []
                if "query" in data and "search" in data["query"]:
                    search_results = data["query"]["search"]
                    logger.debug(f"Parsing {len(search_results)} search results from API response")
                    
                    for item in search_results:
                        entity = {
                            "title": item.get("title", ""),
                            "pageId": str(item.get("pageid", "")),
                            "snippet": item.get("snippet", ""),  # HTML snippet of matching content
                            "titleSnippet": item.get("titlesnippet", ""),
                            "wordcount": item.get("wordcount", 0),
                            "size": item.get("size", 0),  # Size in bytes
                            "timestamp": item.get("timestamp", ""),  # Last edit timestamp
                            "url": f"https://www.wikidata.org/wiki/{item.get('title', '')}"
                        }
                        entities.append(entity)
                        logger.debug(f"Parsed entity: {entity['title']} (pageId: {entity['pageId']})")
                else:
                    logger.warning(f"No search results found in API response for query '{query}'")
                
                # Store in cache
                self.cache[cache_key] = entities
                self.cache_timestamps[cache_key] = datetime.utcnow()
                cache_size = len(self.cache)
                elapsed = (time.time() - start_time) * 1000
                
                logger.info(f"Found {len(entities)} entities for query '{query}' in {elapsed:.2f}ms (cache size: {cache_size})")
                return entities
                
        except httpx.TimeoutException:
            logger.error(f"Timeout querying WikiData for: {query}")
            return []
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error querying WikiData: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error querying WikiData: {str(e)}")
            return []
    
    async def search_entities_simple(
        self, 
        query: str, 
        language: str = "en", 
        limit: int = 10,
        entity_type: str = "item"
    ) -> List[Dict[str, str]]:
        """
        Simple entity search using wbsearchentities (for entity labels/IDs).
        
        Use this when you need to search specifically for entity labels and IDs
        rather than full-text content. This is faster but less semantic than
        the full search API.
        
        Args:
            query: Search query string
            language: Language code (default: "en")
            limit: Maximum number of results (default: 10)
            entity_type: Type of entity to search for ("item" or "property")
        
        Returns:
            List of entities with label, entityId, description, and aliases
        """
        start_time = time.time()
        logger.info(f"search_entities_simple called: query='{query}', language={language}, limit={limit}, entity_type={entity_type}")
        
        if not query or not query.strip():
            logger.warning("Empty query provided to search_entities_simple")
            return []
        
        # Check cache first
        cache_key = f"simple:{query.lower().strip()}:{language}:{entity_type}"
        if self._is_cache_valid(cache_key):
            cached_results = self.cache[cache_key]
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Cache hit for simple query '{query}': returned {len(cached_results)} entities in {elapsed:.2f}ms")
            return cached_results
        
        logger.info(f"Cache miss for simple query '{query}', querying WikiData API...")
        
        try:
            request_start = time.time()
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "action": "wbsearchentities",
                    "search": query.strip(),
                    "language": language,
                    "limit": min(limit, 50),  # WikiData max is 50
                    "format": "json",
                    "type": entity_type,
                    "strictlanguage": False  # Allow language fallback
                }
                
                logger.debug(f"WikiData API request (simple): {WIKIDATA_API_URL} with params: {params}")
                headers = {"User-Agent": USER_AGENT}
                response = await client.get(WIKIDATA_API_URL, params=params, headers=headers)
                request_time = (time.time() - request_start) * 1000
                logger.info(f"WikiData API response (simple) received in {request_time:.2f}ms: status={response.status_code}")
                
                response.raise_for_status()
                data = response.json()
                logger.debug(f"Response data keys: {list(data.keys())}")
                
                # Parse results
                entities = []
                if "search" in data:
                    search_results = data["search"]
                    logger.debug(f"Parsing {len(search_results)} entity results from API response")
                    
                    for item in search_results:
                        entity = {
                            "label": item.get("label", ""),
                            "entityId": item.get("id", ""),
                            "description": item.get("description", ""),
                            "aliases": item.get("aliases", []),
                            "url": item.get("url", f"https://www.wikidata.org/wiki/{item.get('id', '')}")
                        }
                        entities.append(entity)
                        logger.debug(f"Parsed entity: {entity['label']} (ID: {entity['entityId']})")
                else:
                    logger.warning(f"No search results found in API response for simple query '{query}'")
                
                # Store in cache
                self.cache[cache_key] = entities
                self.cache_timestamps[cache_key] = datetime.utcnow()
                cache_size = len(self.cache)
                elapsed = (time.time() - start_time) * 1000
                
                logger.info(f"Found {len(entities)} entities for simple query '{query}' in {elapsed:.2f}ms (cache size: {cache_size})")
                return entities
                
        except httpx.TimeoutException:
            elapsed = (time.time() - start_time) * 1000
            logger.error(f"Timeout querying WikiData (simple) for query '{query}' after {elapsed:.2f}ms")
            return []
        except httpx.HTTPStatusError as e:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"HTTP error querying WikiData (simple) for query '{query}': "
                f"status={e.response.status_code}, "
                f"elapsed={elapsed:.2f}ms, "
                f"response={e.response.text[:200] if e.response.text else 'N/A'}"
            )
            return []
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"Unexpected error querying WikiData (simple) for query '{query}': "
                f"{type(e).__name__}: {str(e)}, "
                f"elapsed={elapsed:.2f}ms",
                exc_info=True
            )
            return []
    
    async def get_entity_by_id(self, entity_id: str, language: str = "en") -> Optional[Dict]:
        """
        Get detailed information about a specific entity by its ID.
        
        Args:
            entity_id: WikiData entity ID (e.g., "Q42")
            language: Language code (default: "en")
        
        Returns:
            Detailed entity information or None if not found
        """
        start_time = time.time()
        logger.info(f"get_entity_by_id called: entity_id={entity_id}, language={language}")
        
        if not entity_id or not entity_id.strip():
            logger.warning("Empty entity_id provided to get_entity_by_id")
            return None
        
        try:
            request_start = time.time()
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "action": "wbgetentities",
                    "ids": entity_id,
                    "format": "json",
                    "languages": language,
                    "languagefallback": True,
                    "props": "labels|descriptions|aliases|claims|sitelinks"
                }
                
                logger.debug(f"WikiData API request (get_entity): {WIKIDATA_API_URL} with params: {params}")
                headers = {"User-Agent": USER_AGENT}
                response = await client.get(WIKIDATA_API_URL, params=params, headers=headers)
                request_time = (time.time() - request_start) * 1000
                logger.info(f"WikiData API response (get_entity) received in {request_time:.2f}ms: status={response.status_code}")
                
                response.raise_for_status()
                data = response.json()
                logger.debug(f"Response data keys: {list(data.keys())}")
                
                if "entities" in data and entity_id in data["entities"]:
                    entity_data = data["entities"][entity_id]
                    elapsed = (time.time() - start_time) * 1000
                    logger.info(f"Successfully retrieved entity {entity_id} in {elapsed:.2f}ms")
                    return entity_data
                
                elapsed = (time.time() - start_time) * 1000
                logger.warning(f"Entity {entity_id} not found in API response (elapsed: {elapsed:.2f}ms)")
                return None
                
        except httpx.TimeoutException:
            elapsed = (time.time() - start_time) * 1000
            logger.error(f"Timeout fetching entity {entity_id} after {elapsed:.2f}ms")
            return None
        except httpx.HTTPStatusError as e:
            elapsed = (time.time() - start_time) * 1000
            if e.response.status_code == 404:
                logger.warning(f"Entity {entity_id} not found (404) after {elapsed:.2f}ms")
            else:
                logger.error(
                    f"HTTP error fetching entity {entity_id}: "
                    f"status={e.response.status_code}, "
                    f"elapsed={elapsed:.2f}ms, "
                    f"response={e.response.text[:200] if e.response.text else 'N/A'}"
                )
            return None
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            logger.error(
                f"Unexpected error fetching entity {entity_id}: "
                f"{type(e).__name__}: {str(e)}, "
                f"elapsed={elapsed:.2f}ms",
                exc_info=True
            )
            return None
    
    def clear_cache(self):
        """Clear the cache (useful for testing or manual cache invalidation)"""
        cache_size = len(self.cache)
        self.cache.clear()
        self.cache_timestamps.clear()
        logger.info(f"WikiData cache cleared: removed {cache_size} entries")
    
    def get_cache_stats(self) -> Dict[str, any]:
        """Get cache statistics for monitoring"""
        stats = {
            "total_entries": len(self.cache),
            "cache_keys": list(self.cache.keys())[:10],  # First 10 keys for debugging
            "oldest_entry": None,
            "newest_entry": None,
        }
        
        if self.cache_timestamps:
            timestamps = list(self.cache_timestamps.values())
            stats["oldest_entry"] = min(timestamps).isoformat() if timestamps else None
            stats["newest_entry"] = max(timestamps).isoformat() if timestamps else None
        
        logger.debug(f"Cache stats: {stats}")
        return stats