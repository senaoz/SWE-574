from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Log connection attempt for debugging
        logger.info(f"Attempting to connect to MongoDB at: {settings.mongodb_url.split('@')[-1] if '@' in settings.mongodb_url else settings.mongodb_url}")
        
        # Use authentication if credentials are provided
        if "admin:password" in settings.mongodb_url:
            db.client = AsyncIOMotorClient(settings.mongodb_url)
        else:
            # For local development without auth
            db.client = AsyncIOMotorClient(settings.mongodb_url)
        
        db.database = db.client[settings.database_name]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info(f"Connected to MongoDB successfully. Database: {settings.database_name}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # User collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("username", unique=True)
        
        # Services collection indexes
        await db.database.services.create_index([("location", "2dsphere")])
        await db.database.services.create_index("user_id")
        await db.database.services.create_index("status")
        await db.database.services.create_index("tags")
        await db.database.services.create_index("created_at")
        
        # TimeBank transactions index
        await db.database.timebank_transactions.create_index("user_id")
        await db.database.timebank_transactions.create_index("created_at")
        
        # Failed TimeBank transactions indexes
        await db.database.failed_timebank_transactions.create_index("user_id")
        await db.database.failed_timebank_transactions.create_index("service_id")
        await db.database.failed_timebank_transactions.create_index("reason")
        await db.database.failed_timebank_transactions.create_index("created_at")
        
        # Join requests indexes
        await db.database.join_requests.create_index("service_id")
        await db.database.join_requests.create_index("user_id")
        await db.database.join_requests.create_index("status")
        await db.database.join_requests.create_index("created_at")
        
        # Transactions indexes
        await db.database.transactions.create_index("service_id")
        await db.database.transactions.create_index("provider_id")
        await db.database.transactions.create_index("requester_id")
        await db.database.transactions.create_index("status")
        await db.database.transactions.create_index("created_at")
        
        # Chat rooms indexes
        await db.database.chat_rooms.create_index("participant_ids")
        await db.database.chat_rooms.create_index("service_id")
        await db.database.chat_rooms.create_index("transaction_id")
        await db.database.chat_rooms.create_index("is_active")
        await db.database.chat_rooms.create_index("last_message_at")
        await db.database.chat_rooms.create_index("created_at")
        
        # Messages indexes
        await db.database.messages.create_index("room_id")
        await db.database.messages.create_index("sender_id")
        await db.database.messages.create_index("created_at")
        await db.database.messages.create_index("is_deleted")
        
        # Saved services indexes
        await db.database.saved_services.create_index(
            [("user_id", 1), ("service_id", 1)], unique=True
        )
        await db.database.saved_services.create_index("user_id")
        await db.database.saved_services.create_index("created_at")

        # Forum indexes
        await db.database.forum_discussions.create_index("user_id")
        await db.database.forum_discussions.create_index("created_at")
        await db.database.forum_discussions.create_index("tags.label")

        await db.database.forum_events.create_index("user_id")
        await db.database.forum_events.create_index("event_at")
        await db.database.forum_events.create_index("created_at")
        await db.database.forum_events.create_index("tags.label")
        await db.database.forum_events.create_index("service_id")
        await db.database.forum_events.create_index("latitude")

        await db.database.forum_comments.create_index([("target_type", 1), ("target_id", 1)])
        await db.database.forum_comments.create_index("user_id")
        await db.database.forum_comments.create_index("created_at")

        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def get_database():
    """Get database instance"""
    return db.database
