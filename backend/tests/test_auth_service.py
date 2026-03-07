import pytest
from app.services.auth_service import AuthService
from app.models.user import UserCreate, UserRole
from app.core.security import verify_password


class TestAuthService:
    """Test AuthService business logic"""
    
    @pytest.mark.asyncio
    async def test_create_user(self, mock_db, test_user_data):
        """Test user creation with password hashing"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        user = await auth_service.create_user(user_create)
        
        assert user is not None
        assert user.email == test_user_data["email"]
        assert user.username == test_user_data["username"]
        assert user.timebank_balance == 3.0  # Default starting balance
        assert user.is_active is True
        assert user.role == UserRole.USER
        
        # Verify password was hashed (check in database)
        user_doc = await mock_db.users.find_one({"email": test_user_data["email"]})
        assert user_doc is not None
        assert "password_hash" in user_doc
        assert user_doc["password_hash"] != test_user_data["password"]
        # Verify password hash is correct
        assert verify_password(test_user_data["password"], user_doc["password_hash"])
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, mock_db, test_user_data):
        """Test that creating a user with duplicate email raises an error"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        # Create first user
        await auth_service.create_user(user_create)
        
        # Try to create another user with same email
        with pytest.raises(ValueError, match="Email already registered"):
            await auth_service.create_user(user_create)
    
    @pytest.mark.asyncio
    async def test_authenticate_user(self, mock_db, test_user_data):
        """Test successful user authentication"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        # Create user first
        created_user = await auth_service.create_user(user_create)
        
        # Authenticate
        authenticated_user = await auth_service.authenticate_user(
            test_user_data["email"],
            test_user_data["password"]
        )
        
        assert authenticated_user is not None
        assert authenticated_user.id == created_user.id
        assert authenticated_user.email == test_user_data["email"]
    
    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_password(self, mock_db, test_user_data):
        """Test authentication with invalid password"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        # Create user first
        await auth_service.create_user(user_create)
        
        # Try to authenticate with wrong password
        authenticated_user = await auth_service.authenticate_user(
            test_user_data["email"],
            "wrongpassword"
        )
        
        assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_authenticate_user_nonexistent(self, mock_db):
        """Test authentication with non-existent user"""
        auth_service = AuthService(mock_db)
        
        authenticated_user = await auth_service.authenticate_user(
            "nonexistent@example.com",
            "password123"
        )
        
        assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self, mock_db, test_user_data):
        """Test retrieving user by email"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        # Create user first
        created_user = await auth_service.create_user(user_create)
        
        # Retrieve by email
        retrieved_user = await auth_service.get_user_by_email(test_user_data["email"])
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == test_user_data["email"]
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_nonexistent(self, mock_db):
        """Test retrieving non-existent user by email"""
        auth_service = AuthService(mock_db)
        
        user = await auth_service.get_user_by_email("nonexistent@example.com")
        
        assert user is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_username(self, mock_db, test_user_data):
        """Test retrieving user by username"""
        auth_service = AuthService(mock_db)
        user_create = UserCreate(**test_user_data)
        
        # Create user first
        created_user = await auth_service.create_user(user_create)
        
        # Retrieve by username
        retrieved_user = await auth_service.get_user_by_username(test_user_data["username"])
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.username == test_user_data["username"]

