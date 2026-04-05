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

        items, total, recommendation_mode, show_profile_prompt = await service_service.get_recommended_services(
            user_id=str(test_user.id),
            filters=ServiceFilters(),
            page=1,
            limit=10,
        )

        assert total == 0
        assert items == []
        assert recommendation_mode == "empty"
        assert show_profile_prompt is False

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

        items, total, recommendation_mode, show_profile_prompt = await service_service.get_recommended_services(
            user_id=str(test_user.id),
            filters=ServiceFilters(),
            page=1,
            limit=10,
        )

        assert total == 0
        assert items == []
        assert recommendation_mode == "empty"
        assert show_profile_prompt is False

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

        items, total, recommendation_mode, show_profile_prompt = await service_service.get_recommended_services(
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
        assert recommendation_mode == "personalized"
        assert show_profile_prompt is False

    @pytest.mark.asyncio
    async def test_get_recommended_services_falls_back_to_nearby_posts_for_cold_start_user(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Cold-start users should see nearby posts when no personalized matches exist."""
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        nearby_service_data = sample_service_data.copy()
        nearby_service_data.update(
            {
                "title": "Nearby Gardening Help",
                "description": "Help with balcony plants and seasonal care.",
                "category": "gardening",
                "tags": ["gardening", "plants"],
                "location": {
                    "latitude": 41.0088,
                    "longitude": 28.979,
                    "address": "Beyoglu, Istanbul",
                },
            }
        )
        nearby_service = await service_service.create_service(
            ServiceCreate(**nearby_service_data),
            str(second_user.id),
        )

        farther_service_data = sample_service_data.copy()
        farther_service_data.update(
            {
                "title": "Farther Language Exchange",
                "description": "Practice English conversation over coffee.",
                "category": "language",
                "tags": ["language", "english"],
                "location": {
                    "latitude": 41.068,
                    "longitude": 29.02,
                    "address": "Sariyer, Istanbul",
                },
            }
        )
        farther_service = await service_service.create_service(
            ServiceCreate(**farther_service_data),
            str(second_user.id),
        )

        items, total, recommendation_mode, show_profile_prompt = (
            await service_service.get_recommended_services(
                user_id=str(test_user.id),
                filters=ServiceFilters(),
                page=1,
                limit=10,
                viewer_latitude=41.0082,
                viewer_longitude=28.9784,
            )
        )

        assert total == 2
        assert len(items) == 2
        assert recommendation_mode == "location_fallback"
        assert show_profile_prompt is True
        assert items[0].service.id == str(nearby_service.id)
        assert items[1].service.id == str(farther_service.id)
        assert "away from you" in items[0].reason

    @pytest.mark.asyncio
    async def test_get_recommended_services_keeps_personalized_results_without_location_fallback(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Nearby fallback should not be mixed in when personalized recommendations exist."""
        from bson import ObjectId
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        await mock_db.users.update_one(
            {"_id": ObjectId(str(test_user.id))},
            {"$set": {"interests": ["AI"]}},
        )

        nearby_unrelated_data = sample_service_data.copy()
        nearby_unrelated_data.update(
            {
                "title": "Nearby Dog Walking",
                "description": "Looking for a walking buddy for my dog.",
                "category": "pets",
                "tags": ["pets", "dog"],
                "location": {
                    "latitude": 41.0083,
                    "longitude": 28.9785,
                    "address": "Besiktas, Istanbul",
                },
            }
        )
        await service_service.create_service(
            ServiceCreate(**nearby_unrelated_data),
            str(second_user.id),
        )

        matching_service_data = sample_service_data.copy()
        matching_service_data.update(
            {
                "title": "AI Interview Practice",
                "description": "Practice AI interview questions together.",
                "category": "technology",
                "tags": ["career", "AI"],
                "location": {
                    "latitude": 41.04,
                    "longitude": 29.01,
                    "address": "Kadikoy, Istanbul",
                },
            }
        )
        matching_service = await service_service.create_service(
            ServiceCreate(**matching_service_data),
            str(second_user.id),
        )

        items, total, recommendation_mode, show_profile_prompt = (
            await service_service.get_recommended_services(
                user_id=str(test_user.id),
                filters=ServiceFilters(),
                page=1,
                limit=10,
                viewer_latitude=41.0082,
                viewer_longitude=28.9784,
            )
        )

        assert total == 1
        assert len(items) == 1
        assert items[0].service.id == str(matching_service.id)
        assert recommendation_mode == "personalized"
        assert show_profile_prompt is False

    @pytest.mark.asyncio
    async def test_get_recommended_services_hides_profile_prompt_when_user_has_existing_signals(
        self, mock_db, test_user, second_user, sample_service_data
    ):
        """Fallback can still be used without showing the cold-start profile prompt."""
        from datetime import datetime, timezone
        from app.models.service import ServiceCreate

        service_service = ServiceService(mock_db)

        saved_service_data = sample_service_data.copy()
        saved_service_data.update(
            {
                "title": "Saved Cooking Workshop",
                "description": "Learn practical meal prep for the week.",
                "category": "cooking",
                "tags": ["cooking", "meal prep"],
            }
        )
        saved_service = await service_service.create_service(
            ServiceCreate(**saved_service_data),
            str(second_user.id),
        )

        await mock_db.saved_services.insert_one(
            {
                "user_id": str(test_user.id),
                "service_id": str(saved_service.id),
                "created_at": datetime.now(timezone.utc),
            }
        )

        fallback_service_data = sample_service_data.copy()
        fallback_service_data.update(
            {
                "title": "Nearby Bike Repair Help",
                "description": "Help with basic bike maintenance and chain fixes.",
                "category": "repair",
                "tags": ["bike", "repair"],
                "location": {
                    "latitude": 41.0084,
                    "longitude": 28.9787,
                    "address": "Sisli, Istanbul",
                },
            }
        )
        fallback_service = await service_service.create_service(
            ServiceCreate(**fallback_service_data),
            str(second_user.id),
        )

        items, total, recommendation_mode, show_profile_prompt = (
            await service_service.get_recommended_services(
                user_id=str(test_user.id),
                filters=ServiceFilters(),
                page=1,
                limit=10,
                viewer_latitude=41.0082,
                viewer_longitude=28.9784,
            )
        )

        assert total == 1
        assert len(items) == 1
        assert items[0].service.id == str(fallback_service.id)
        assert recommendation_mode == "location_fallback"
        assert show_profile_prompt is False
    
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
