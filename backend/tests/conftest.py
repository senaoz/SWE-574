import pytest
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from mongomock import MongoClient
from bson import ObjectId
from datetime import datetime
from typing import AsyncGenerator

from app.main import app
from app.core.database import get_database
from app.core.security import create_access_token
from app.models.user import UserResponse, UserRole


def convert_objectid_to_str(obj):
    """Recursively convert ObjectId to string in dictionaries"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: convert_objectid_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_str(item) for item in obj]
    return obj


# Simple async wrapper for mongomock collections
class AsyncMockCollection:
    """Async wrapper for mongomock collection"""
    def __init__(self, sync_collection):
        self._sync_collection = sync_collection
    
    async def find_one(self, filter=None, *args, **kwargs):
        result = self._sync_collection.find_one(filter, *args, **kwargs)
        if result:
            return convert_objectid_to_str(result)
        return result
    
    def find(self, filter=None, *args, **kwargs):
        """Find documents - returns cursor synchronously (like motor)"""
        cursor = self._sync_collection.find(filter, *args, **kwargs)
        # Don't convert to list immediately - let the cursor handle it
        return AsyncMockCursor(cursor, is_sync_cursor=True)
    
    async def insert_one(self, document, *args, **kwargs):
        result = self._sync_collection.insert_one(document, *args, **kwargs)
        return type('Result', (), {'inserted_id': result.inserted_id})()
    
    async def update_one(self, filter, update, *args, **kwargs):
        result = self._sync_collection.update_one(filter, update, *args, **kwargs)
        return type('Result', (), {
            'modified_count': result.modified_count,
            'matched_count': result.matched_count
        })()
    
    async def delete_one(self, filter, *args, **kwargs):
        result = self._sync_collection.delete_one(filter, *args, **kwargs)
        return type('Result', (), {'deleted_count': result.deleted_count})()
    
    async def count_documents(self, filter, *args, **kwargs):
        return self._sync_collection.count_documents(filter, *args, **kwargs)
    
    async def aggregate(self, pipeline, *args, **kwargs):
        cursor = self._sync_collection.aggregate(pipeline, *args, **kwargs)
        data = list(cursor)
        return AsyncMockCursor(data)
    
    async def create_index(self, *args, **kwargs):
        return self._sync_collection.create_index(*args, **kwargs)


class AsyncMockCursor:
    """Async cursor wrapper for mongomock with skip, limit, sort support"""
    def __init__(self, data, is_sync_cursor=False):
        if is_sync_cursor:
            # Store the sync cursor, don't convert to list yet
            self._sync_cursor = data
            self._data = None
            self._is_sync_cursor = True
        else:
            # Already have a list
            self._original_data = data if isinstance(data, list) else list(data)
            self._data = None
            self._is_sync_cursor = False
        self._index = 0
        self._skip = 0
        self._limit = None
        self._sort_key = None
        self._sort_direction = 1
        self._operations_applied = False
    
    def skip(self, n):
        """Skip n documents"""
        self._skip = n
        self._operations_applied = False
        return self
    
    def limit(self, n):
        """Limit to n documents"""
        self._limit = n
        self._operations_applied = False
        return self
    
    def sort(self, key, direction=None):
        """Sort documents by key"""
        if direction is None:
            # Handle tuple format like ("created_at", -1)
            if isinstance(key, tuple):
                self._sort_key = key[0]
                self._sort_direction = key[1] if len(key) > 1 else 1
            # Handle list of tuples like [("created_at", -1)]
            elif isinstance(key, list) and key:
                self._sort_key = key[0][0]
                self._sort_direction = key[0][1] if len(key[0]) > 1 else 1
            else:
                self._sort_key = key
                self._sort_direction = 1
        else:
            self._sort_key = key
            self._sort_direction = direction
        self._operations_applied = False
        return self
    
    def _apply_operations(self):
        """Apply sort, skip, and limit operations"""
        if self._operations_applied:
            return
        
        # Get data from sync cursor if needed
        if self._is_sync_cursor:
            self._original_data = list(self._sync_cursor)
            self._is_sync_cursor = False
        
        if self._original_data is None:
            self._original_data = []
        
        self._data = self._original_data.copy()
        
        # Sort
        if self._sort_key:
            reverse = self._sort_direction == -1
            try:
                self._data.sort(key=lambda x: x.get(self._sort_key) if x.get(self._sort_key) is not None else 0, reverse=reverse)
            except (TypeError, AttributeError):
                # If sort fails, just keep original order
                pass
        
        # Skip
        if self._skip > 0:
            self._data = self._data[self._skip:]
        
        # Limit
        if self._limit is not None:
            self._data = self._data[:self._limit]
        
        # Reset index for iteration
        self._index = 0
        self._operations_applied = True
    
    def __aiter__(self):
        self._apply_operations()
        self._index = 0
        return self
    
    async def __anext__(self):
        if self._data is None:
            self._apply_operations()
        
        if self._index >= len(self._data):
            raise StopAsyncIteration
        item = convert_objectid_to_str(self._data[self._index])
        self._index += 1
        return item


class AsyncMockDatabase:
    """Async wrapper for mongomock database"""
    def __init__(self, sync_db):
        self._sync_db = sync_db
        self.client = sync_db.client
    
    def __getattr__(self, name):
        if name.startswith('_'):
            return getattr(self._sync_db, name)
        collection = getattr(self._sync_db, name)
        return AsyncMockCollection(collection)


@pytest.fixture
async def mock_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Create a mock MongoDB database for testing"""
    # Create a sync mongomock client
    sync_client = MongoClient()
    sync_db = sync_client["test_hive_platform"]
    
    # Wrap with async interface
    db = AsyncMockDatabase(sync_db)
    
    # Override the database dependency
    async def override_get_database():
        return db
    
    app.dependency_overrides[get_database] = override_get_database
    
    yield db
    
    # Cleanup
    sync_client.close()
    app.dependency_overrides.clear()


@pytest.fixture
def test_client(mock_db) -> TestClient:
    """Create a test client for FastAPI"""
    return TestClient(app)


@pytest.fixture
def test_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "full_name": "Test User",
        "bio": "Test bio",
        "location": "Test Location",
        "role": UserRole.USER,
        "profile_visible": True,
        "show_email": False,
        "show_location": True,
        "email_notifications": True,
        "service_matches_notifications": True,
        "messages_notifications": True
    }


@pytest.fixture
async def test_user(mock_db, test_user_data):
    """Create a test user in the database"""
    from app.services.auth_service import AuthService
    from app.models.user import UserCreate
    
    auth_service = AuthService(mock_db)
    user_create = UserCreate(**test_user_data)
    user = await auth_service.create_user(user_create)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for a test user"""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_service_data():
    """Sample service data for testing"""
    return {
        "title": "Test Service",
        "description": "This is a test service description that is long enough",
        "category": "test",
        "tags": ["test", "sample"],
        "estimated_duration": 2.0,
        "location": {
            "latitude": 41.0082,
            "longitude": 28.9784,
            "address": "Istanbul, Turkey"
        },
        "service_type": "offer",
        "max_participants": 1
    }


@pytest.fixture
async def sample_service(mock_db, test_user, sample_service_data):
    """Create a sample service in the database"""
    from app.services.service_service import ServiceService
    from app.models.service import ServiceCreate
    
    service_service = ServiceService(mock_db)
    service_create = ServiceCreate(**sample_service_data)
    service = await service_service.create_service(service_create, str(test_user.id))
    return service


@pytest.fixture
def second_user_data():
    """Second user data for testing interactions"""
    return {
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "testpassword123",
        "confirm_password": "testpassword123",
        "full_name": "Test User 2",
        "bio": "Test bio 2",
        "location": "Test Location 2",
        "role": UserRole.USER,
        "profile_visible": True,
        "show_email": False,
        "show_location": True,
        "email_notifications": True,
        "service_matches_notifications": True,
        "messages_notifications": True
    }


@pytest.fixture
async def second_user(mock_db, second_user_data):
    """Create a second test user in the database"""
    from app.services.auth_service import AuthService
    from app.models.user import UserCreate
    
    auth_service = AuthService(mock_db)
    user_create = UserCreate(**second_user_data)
    user = await auth_service.create_user(user_create)
    return user
