import pytest
from datetime import timedelta
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    verify_token
)


class TestPasswordHashing:
    """Test password hashing and verification functions"""
    
    def test_password_hashing(self):
        """Verify that password hashing works and produces different hashes for same password"""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        # Hashes should be different (due to salt)
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)
    
    def test_password_verification_success(self):
        """Test successful password verification"""
        password = "mypassword"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test failed password verification with wrong password"""
        password = "mypassword"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False
    
    def test_password_hash_length_limit(self):
        """Test that very long passwords are handled correctly"""
        # Passwords longer than 72 chars should still work
        long_password = "a" * 100
        hashed = get_password_hash(long_password)
        assert verify_password(long_password, hashed) is True


class TestJWTTokens:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self):
        """Test that access tokens are created successfully"""
        data = {"sub": "user123"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_verify_token_success(self):
        """Test successful token verification"""
        data = {"sub": "user123", "exp": None}
        token = create_access_token(data)
        
        payload = verify_token(token)
        assert payload["sub"] == "user123"
        assert "exp" in payload
    
    def test_verify_token_invalid(self):
        """Test that invalid tokens raise exceptions"""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(Exception):  # Should raise HTTPException
            verify_token(invalid_token)
    
    def test_token_expiration(self):
        """Test that tokens can be created with custom expiration"""
        data = {"sub": "user123"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta=expires_delta)
        
        payload = verify_token(token)
        assert payload["sub"] == "user123"
        # Check that expiration is set (should be approximately 15 minutes from now)
        assert "exp" in payload

