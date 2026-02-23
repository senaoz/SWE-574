import pytest
from fastapi import status


class TestAuthAPI:
    """Test /auth API endpoints"""
    
    def test_register_success(self, test_client, test_user_data):
        """Test successful user registration (returns token for auto sign-in)"""
        response = test_client.post("/auth/register", json=test_user_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        user = data["user"]
        assert user["email"] == test_user_data["email"]
        assert user["username"] == test_user_data["username"]
        assert "id" in user or "_id" in user
        user_id = user.get("id") or user.get("_id")
        assert user_id is not None
        assert "password_hash" not in user  # Password should not be in response
    
    def test_register_duplicate_email(self, test_client, test_user_data):
        """Test registration with duplicate email"""
        # Register first user
        test_client.post("/auth/register", json=test_user_data)
        
        # Try to register with same email but different username
        duplicate_data = test_user_data.copy()
        duplicate_data["username"] = "different_username"
        
        response = test_client.post("/auth/register", json=duplicate_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Email already registered" in response.json()["detail"]
    
    def test_register_duplicate_username(self, test_client, test_user_data):
        """Test registration with duplicate username"""
        # Register first user
        test_client.post("/auth/register", json=test_user_data)
        
        # Try to register with same username but different email
        duplicate_data = test_user_data.copy()
        duplicate_data["email"] = "different@example.com"
        
        response = test_client.post("/auth/register", json=duplicate_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Username already taken" in response.json()["detail"]
    
    def test_register_password_mismatch(self, test_client, test_user_data):
        """Test registration with mismatched passwords"""
        data = test_user_data.copy()
        data["confirm_password"] = "differentpassword"
        
        response = test_client.post("/auth/register", json=data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Passwords do not match" in response.json()["detail"]
    
    def test_login_success(self, test_client, test_user):
        """Test successful login with token generation"""
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = test_client.post("/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == login_data["email"]
    
    def test_login_invalid_credentials(self, test_client, test_user):
        """Test login with invalid credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = test_client.post("/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, test_client):
        """Test login with non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/auth/login", json=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Incorrect email or password" in response.json()["detail"]
    
    def test_get_current_user(self, test_client, test_user, auth_headers):
        """Test getting current user info with valid token"""
        response = test_client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == test_user.email
        # Pydantic models with alias can return either 'id' or '_id'
        user_id = data.get("id") or data.get("_id")
        assert user_id == str(test_user.id)
    
    def test_get_current_user_no_token(self, test_client):
        """Test getting current user without token"""
        response = test_client.get("/auth/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_current_user_invalid_token(self, test_client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = test_client.get("/auth/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_oauth_login_google(self, test_client):
        """Test OAuth login initiation for Google"""
        response = test_client.get("/auth/oauth/google")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "auth_url" in data
        assert "google.com" in data["auth_url"]
    
    def test_oauth_login_github(self, test_client):
        """Test OAuth login initiation for GitHub"""
        response = test_client.get("/auth/oauth/github")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "auth_url" in data
        assert "github.com" in data["auth_url"]
    
    def test_oauth_login_invalid_provider(self, test_client):
        """Test OAuth login with invalid provider"""
        response = test_client.get("/auth/oauth/invalid_provider")
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid OAuth provider" in response.json()["detail"]

