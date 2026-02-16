import pytest
from fastapi import status


class TestServicesAPI:
    """Test /services API endpoints"""
    
    def test_create_service_endpoint(self, test_client, auth_headers, sample_service_data):
        """Test creating a service via API"""
        response = test_client.post(
            "/services/",
            json=sample_service_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == sample_service_data["title"]
        assert data["status"] == "active"
        # Pydantic models with alias can return either 'id' or '_id'
        assert "id" in data or "_id" in data
        assert "user_id" in data or "user_id" in data
    
    def test_create_service_endpoint_unauthorized(self, test_client, sample_service_data):
        """Test creating a service without authentication"""
        response = test_client.post("/services/", json=sample_service_data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_services_endpoint(self, test_client, sample_service):
        """Test getting services list"""
        response = test_client.get("/services/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "services" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert len(data["services"]) > 0
    
    def test_get_services_endpoint_with_filters(self, test_client, sample_service):
        """Test getting services with filters"""
        response = test_client.get(
            "/services/",
            params={"category": "test", "service_type": "offer"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] >= 0
    
    def test_get_services_endpoint_pagination(self, test_client, sample_service):
        """Test services pagination"""
        response = test_client.get("/services/", params={"page": 1, "limit": 1})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 1
        assert len(data["services"]) <= 1
    
    def test_get_service_detail(self, test_client, sample_service):
        """Test getting a specific service by ID"""
        response = test_client.get(f"/services/{sample_service.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Pydantic models with alias can return either 'id' or '_id'
        service_id = data.get("id") or data.get("_id")
        assert service_id == str(sample_service.id)
        assert data["title"] == sample_service.title
    
    def test_get_service_detail_nonexistent(self, test_client):
        """Test getting non-existent service"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = test_client.get(f"/services/{fake_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_service_endpoint(self, test_client, sample_service, auth_headers):
        """Test updating a service via API"""
        update_data = {"title": "Updated Service Title"}
        
        response = test_client.put(
            f"/services/{sample_service.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Service Title"
    
    def test_update_service_endpoint_unauthorized(self, test_client, sample_service, second_user):
        """Test updating a service without being the owner"""
        from app.core.security import create_access_token
        
        # Create auth headers for second user
        token = create_access_token(data={"sub": str(second_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        update_data = {"title": "Unauthorized Update"}
        
        response = test_client.put(
            f"/services/{sample_service.id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_delete_service_endpoint(self, test_client, sample_service, auth_headers):
        """Test deleting a service via API"""
        response = test_client.delete(
            f"/services/{sample_service.id}",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        
        # Verify service was deleted
        get_response = test_client.get(f"/services/{sample_service.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_service_endpoint_unauthorized(self, test_client, sample_service, second_user):
        """Test deleting a service without being the owner"""
        from app.core.security import create_access_token
        
        # Create auth headers for second user
        token = create_access_token(data={"sub": str(second_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = test_client.delete(
            f"/services/{sample_service.id}",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_match_service_endpoint(self, test_client, sample_service, second_user):
        """Test matching with a service via API"""
        from app.core.security import create_access_token
        
        # Create auth headers for second user
        token = create_access_token(data={"sub": str(second_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = test_client.post(
            f"/services/{sample_service.id}/match",
            headers=headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
    
    def test_match_service_endpoint_own_service(self, test_client, sample_service, auth_headers):
        """Test that user cannot match with their own service"""
        response = test_client.post(
            f"/services/{sample_service.id}/match",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_cancel_service_endpoint(self, test_client, sample_service, auth_headers):
        """Test cancelling a service via API"""
        response = test_client.post(
            f"/services/{sample_service.id}/cancel",
            headers=auth_headers
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        
        # Verify service was cancelled
        get_response = test_client.get(f"/services/{sample_service.id}")
        assert get_response.json()["status"] == "cancelled"
    
    @pytest.mark.asyncio
    async def test_get_service_participants_endpoint(self, test_client, mock_db, sample_service, second_user):
        """Test getting service participants"""
        from app.services.service_service import ServiceService
        
        # Match with service first
        service_service = ServiceService(mock_db)
        await service_service.match_service(str(sample_service.id), str(second_user.id))
        
        response = test_client.get(f"/services/{sample_service.id}/participants")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "participants" in data
        assert len(data["participants"]) >= 1

