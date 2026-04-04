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
    async def test_get_potential_matches_excludes_saved_and_full_services(
        self, mock_db, test_user, second_user, sample_service, sample_service_data
    ):
        """Test potential matches only return eligible opposite-type services."""
        from app.models.service import ServiceCreate
        from bson import ObjectId

        service_service = ServiceService(mock_db)

        matching_need_data = sample_service_data.copy()
        matching_need_data["service_type"] = "need"
        matching_need = await service_service.create_service(
            ServiceCreate(**matching_need_data),
            str(second_user.id),
        )

        saved_need_data = sample_service_data.copy()
        saved_need_data["title"] = "Saved need"
        saved_need_data["service_type"] = "need"
        saved_need = await service_service.create_service(
            ServiceCreate(**saved_need_data),
            str(second_user.id),
        )

        full_need_data = sample_service_data.copy()
        full_need_data["title"] = "Full need"
        full_need_data["service_type"] = "need"
        full_need = await service_service.create_service(
            ServiceCreate(**full_need_data),
            str(second_user.id),
        )

        await mock_db.saved_services.insert_one(
            {
                "user_id": str(test_user.id),
                "service_id": str(saved_need.id),
                "created_at": datetime.utcnow(),
            }
        )
        await mock_db.services.update_one(
            {"_id": ObjectId(str(full_need.id))},
            {"$set": {"matched_user_ids": [ObjectId(str(test_user.id))]}},
        )

        items, total = await service_service.get_potential_matches(
            str(sample_service.id),
            current_user_id=str(test_user.id),
            limit=10,
        )

        assert total == 1
        assert len(items) == 1
        assert items[0].service.id == str(matching_need.id)
        assert items[0].service.service_type == ServiceType.NEED
        assert items[0].reason_label

    @pytest.mark.asyncio
    async def test_get_potential_matches_falls_back_to_same_type_when_needed(
        self, mock_db, sample_service, second_user, sample_service_data
    ):
        """Test similar same-type services are returned when no opposite-type matches exist."""
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        similar_offer_data = sample_service_data.copy()
        similar_offer_data["title"] = "Another test service"
        similar_offer = await service_service.create_service(
            ServiceCreate(**similar_offer_data),
            str(second_user.id),
        )

        items, total = await service_service.get_potential_matches(
            str(sample_service.id),
            current_user_id=None,
            limit=10,
        )

        assert total == 1
        assert len(items) == 1
        assert items[0].service.id == str(similar_offer.id)
        assert items[0].service.service_type == ServiceType.OFFER

    @pytest.mark.asyncio
    async def test_get_recommended_services_ignores_interest_substrings_in_words(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Interest matches should not be triggered by substrings such as health->healthy."""
        from bson import ObjectId
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        await mock_db.users.update_one(
            {"_id": ObjectId(str(test_user.id))},
            {"$set": {"interests": ["Health"]}},
        )

        unrelated_service_data = sample_service_data.copy()
        unrelated_service_data.update(
            {
                "title": "Home Cooking / Meal Prep",
                "description": "Share healthy cooking ideas and easy dinner prep.",
                "category": "cooking",
                "tags": ["cooking", "food"],
            }
        )
        await service_service.create_service(
            ServiceCreate(**unrelated_service_data),
            str(second_user.id),
        )

        items, total = await service_service.get_recommended_services(
            user_id=str(test_user.id),
            filters=ServiceFilters(),
            page=1,
            limit=10,
        )

        assert total == 0
        assert items == []

    @pytest.mark.asyncio
    async def test_get_recommended_services_ignores_short_interest_inside_other_words(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Short interests such as AI should only match whole terms, not word fragments."""
        from bson import ObjectId
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        await mock_db.users.update_one(
            {"_id": ObjectId(str(test_user.id))},
            {"$set": {"interests": ["AI"]}},
        )

        unrelated_service_data = sample_service_data.copy()
        unrelated_service_data.update(
            {
                "title": "Watercolor Portrait Of My Pet",
                "description": "Bring a painting reference for a birthday portrait workshop.",
                "category": "art",
                "tags": ["Watercolor Painting", "Portrait"],
            }
        )
        await service_service.create_service(
            ServiceCreate(**unrelated_service_data),
            str(second_user.id),
        )

        items, total = await service_service.get_recommended_services(
            user_id=str(test_user.id),
            filters=ServiceFilters(),
            page=1,
            limit=10,
        )

        assert total == 0
        assert items == []

    @pytest.mark.asyncio
    async def test_get_recommended_services_matches_interest_as_whole_term(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Whole-word interest matches should still produce recommendations."""
        from bson import ObjectId
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        await mock_db.users.update_one(
            {"_id": ObjectId(str(test_user.id))},
            {"$set": {"interests": ["AI"]}},
        )

        matching_service_data = sample_service_data.copy()
        matching_service_data.update(
            {
                "title": "AI Interview Practice",
                "description": "Practice AI interview questions together.",
                "category": "technology",
                "tags": ["career", "AI"],
            }
        )
        matching_service = await service_service.create_service(
            ServiceCreate(**matching_service_data),
            str(second_user.id),
        )

        items, total = await service_service.get_recommended_services(
            user_id=str(test_user.id),
            filters=ServiceFilters(),
            page=1,
            limit=10,
        )

        assert total == 1
        assert len(items) == 1
        assert items[0].service.id == str(matching_service.id)
        assert items[0].matched_interests == ["AI"]
        assert items[0].reason == "Because it matches your interest in AI"
    
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

    @pytest.mark.asyncio
    async def test_complete_service(self, mock_db, sample_service, second_user):
        """Test provider can mark service as completed"""
        service_service = ServiceService(mock_db)
        # Match first so service has participants and is in_progress
        await service_service.match_service(
            str(sample_service.id),
            str(second_user.id)
        )
        # Provider (owner) completes the service
        result = await service_service.complete_service(
            str(sample_service.id),
            str(sample_service.user_id),
        )
        assert result is True
        completed = await service_service.get_service_by_id(str(sample_service.id))
        assert completed.status == ServiceStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_complete_service_unauthorized(self, mock_db, sample_service, second_user):
        """Test only service owner (provider) can complete the service"""
        service_service = ServiceService(mock_db)
        await service_service.match_service(
            str(sample_service.id),
            str(second_user.id)
        )
        with pytest.raises(ValueError, match="Only the service owner"):
            await service_service.complete_service(
                str(sample_service.id),
                str(second_user.id),
            )

    @pytest.mark.asyncio
    async def test_complete_service_not_found(self, mock_db, test_user):
        """Test complete_service with non-existent service raises"""
        from bson import ObjectId
        service_service = ServiceService(mock_db)
        fake_id = str(ObjectId())
        with pytest.raises(ValueError, match="Service not found"):
            await service_service.complete_service(fake_id, str(test_user.id))

    @pytest.mark.asyncio
    async def test_complete_service_invalid_state(self, mock_db, sample_service):
        """Test completing a cancelled service raises"""
        service_service = ServiceService(mock_db)
        await service_service.update_service(
            str(sample_service.id),
            ServiceUpdate(status=ServiceStatus.CANCELLED),
            str(sample_service.user_id),
        )
        with pytest.raises(ValueError, match="not in a state that can be completed"):
            await service_service.complete_service(
                str(sample_service.id),
                str(sample_service.user_id),
            )
