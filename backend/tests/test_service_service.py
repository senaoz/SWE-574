import pytest
from datetime import datetime, timedelta
from app.services.service_service import ServiceService
from app.models.service import ServiceCreate, ServiceUpdate, ServiceStatus, ServiceType, ServiceFilters
from app.models.user import UserRole


class TestServiceService:
    """Test ServiceService business logic"""
    
    @pytest.mark.asyncio
    async def test_create_service(self, mock_db, test_user, sample_service_data):
        """Test service creation"""
        service_service = ServiceService(mock_db)
        service_create = ServiceCreate(**sample_service_data)
        
        service = await service_service.create_service(service_create, str(test_user.id))
        
        assert service is not None
        assert service.title == sample_service_data["title"]
        assert service.user_id == str(test_user.id)
        assert service.status == ServiceStatus.ACTIVE
        assert service.created_at is not None
    
    @pytest.mark.asyncio
    async def test_get_service_by_id(self, mock_db, sample_service):
        """Test retrieving service by ID"""
        service_service = ServiceService(mock_db)
        
        retrieved_service = await service_service.get_service_by_id(str(sample_service.id))
        
        assert retrieved_service is not None
        assert retrieved_service.id == sample_service.id
        assert retrieved_service.title == sample_service.title
    
    @pytest.mark.asyncio
    async def test_get_service_by_id_nonexistent(self, mock_db):
        """Test retrieving non-existent service"""
        service_service = ServiceService(mock_db)
        from bson import ObjectId
        
        fake_id = str(ObjectId())
        service = await service_service.get_service_by_id(fake_id)
        
        assert service is None
    
    @pytest.mark.asyncio
    async def test_get_services_with_filters(self, mock_db, test_user, sample_service_data):
        """Test getting services with filters"""
        service_service = ServiceService(mock_db)
        
        # Create multiple services
        service1_data = sample_service_data.copy()
        service1_data["category"] = "category1"
        service1 = await service_service.create_service(
            ServiceCreate(**service1_data),
            str(test_user.id)
        )
        
        service2_data = sample_service_data.copy()
        service2_data["category"] = "category2"
        service2 = await service_service.create_service(
            ServiceCreate(**service2_data),
            str(test_user.id)
        )
        
        # Filter by category
        filters = ServiceFilters(category="category1")
        services, total = await service_service.get_services(filters, page=1, limit=10)
        
        assert total == 1
        assert len(services) == 1
        assert services[0].category == "category1"
    
    @pytest.mark.asyncio
    async def test_get_services_pagination(self, mock_db, test_user, sample_service_data):
        """Test service pagination"""
        service_service = ServiceService(mock_db)
        
        # Create multiple services
        for i in range(5):
            service_data = sample_service_data.copy()
            service_data["title"] = f"Service {i}"
            await service_service.create_service(
                ServiceCreate(**service_data),
                str(test_user.id)
            )
        
        # Get first page
        filters = ServiceFilters()
        services, total = await service_service.get_services(filters, page=1, limit=2)
        
        assert total == 5
        assert len(services) == 2
        
        # Get second page
        services_page2, _ = await service_service.get_services(filters, page=2, limit=2)
        assert len(services_page2) == 2
    
    @pytest.mark.asyncio
    async def test_update_service(self, mock_db, sample_service):
        """Test updating service"""
        service_service = ServiceService(mock_db)
        
        update_data = ServiceUpdate(title="Updated Title")
        updated_service = await service_service.update_service(
            str(sample_service.id),
            update_data,
            str(sample_service.user_id)
        )
        
        assert updated_service is not None
        assert updated_service.title == "Updated Title"
        assert updated_service.id == sample_service.id
    
    @pytest.mark.asyncio
    async def test_update_service_status_transition(self, mock_db, sample_service):
        """Test valid status transitions"""
        service_service = ServiceService(mock_db)
        
        # Transition from ACTIVE to IN_PROGRESS
        update_data = ServiceUpdate(status=ServiceStatus.IN_PROGRESS)
        updated_service = await service_service.update_service(
            str(sample_service.id),
            update_data,
            str(sample_service.user_id)
        )
        
        assert updated_service.status == ServiceStatus.IN_PROGRESS
    
    @pytest.mark.asyncio
    async def test_update_service_invalid_status_transition(self, mock_db, sample_service):
        """Test invalid status transitions"""
        service_service = ServiceService(mock_db)
        
        # Try to transition from ACTIVE directly to COMPLETED (invalid)
        update_data = ServiceUpdate(status=ServiceStatus.COMPLETED)
        
        with pytest.raises(ValueError, match="Cannot transition"):
            await service_service.update_service(
                str(sample_service.id),
                update_data,
                str(sample_service.user_id)
            )
    
    @pytest.mark.asyncio
    async def test_match_service(self, mock_db, sample_service, second_user):
        """Test matching with a service"""
        service_service = ServiceService(mock_db)
        
        success = await service_service.match_service(
            str(sample_service.id),
            str(second_user.id)
        )
        
        assert success is True
        
        # Verify service was updated
        updated_service = await service_service.get_service_by_id(str(sample_service.id))
        assert updated_service.status == ServiceStatus.IN_PROGRESS
        assert str(second_user.id) in [str(uid) for uid in updated_service.matched_user_ids]
    
    @pytest.mark.asyncio
    async def test_match_service_own_service(self, mock_db, sample_service):
        """Test that user cannot match with their own service"""
        service_service = ServiceService(mock_db)
        
        with pytest.raises(ValueError, match="Cannot match with your own service"):
            await service_service.match_service(
                str(sample_service.id),
                str(sample_service.user_id)
            )
    
    @pytest.mark.asyncio
    async def test_match_service_not_active(self, mock_db, sample_service, second_user):
        """Test that non-active services cannot be matched"""
        service_service = ServiceService(mock_db)
        
        # Set service to cancelled
        await service_service.update_service(
            str(sample_service.id),
            ServiceUpdate(status=ServiceStatus.CANCELLED),
            str(sample_service.user_id)
        )
        
        with pytest.raises(ValueError, match="Service is not available"):
            await service_service.match_service(
                str(sample_service.id),
                str(second_user.id)
            )
    
    @pytest.mark.asyncio
    async def test_cancel_service(self, mock_db, sample_service):
        """Test cancelling a service"""
        service_service = ServiceService(mock_db)
        
        success = await service_service.cancel_service(
            str(sample_service.id),
            str(sample_service.user_id)
        )
        
        assert success is True
        
        # Verify service was cancelled
        cancelled_service = await service_service.get_service_by_id(str(sample_service.id))
        assert cancelled_service.status == ServiceStatus.CANCELLED
    
    @pytest.mark.asyncio
    async def test_cancel_service_unauthorized(self, mock_db, sample_service, second_user):
        """Test that only owner or participant can cancel"""
        service_service = ServiceService(mock_db)
        
        with pytest.raises(ValueError, match="Not authorized"):
            await service_service.cancel_service(
                str(sample_service.id),
                str(second_user.id)
            )
    
    @pytest.mark.asyncio
    async def test_delete_service(self, mock_db, sample_service):
        """Test deleting a service"""
        service_service = ServiceService(mock_db)
        
        success = await service_service.delete_service(str(sample_service.id))
        
        assert success is True
        
        # Verify service was deleted
        deleted_service = await service_service.get_service_by_id(str(sample_service.id))
        assert deleted_service is None
    
    @pytest.mark.asyncio
    async def test_get_service_participants(self, mock_db, sample_service, second_user):
        """Test getting service participants"""
        service_service = ServiceService(mock_db)
        
        # Match with service first
        await service_service.match_service(
            str(sample_service.id),
            str(second_user.id)
        )
        
        participants = await service_service.get_service_participants(str(sample_service.id))
        
        assert len(participants) == 2  # Provider and participant
        participant_roles = [p["role"] for p in participants]
        assert "provider" in participant_roles
        assert "participant" in participant_roles

