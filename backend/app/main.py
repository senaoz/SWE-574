import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import connect_to_mongo, close_mongo_connection, get_database
from .api import auth, users, services, admin, comments, join_requests, transactions, chat, wikidata, ratings, forum

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

EXPIRY_CHECK_INTERVAL_SECONDS = 3600  # Her saat başı çalışır

async def run_expiry_checker():
    """Süresi geçmiş servisleri periyodik olarak expired'a çeker."""
    from .services.service_service import ServiceService
    # Uygulama başlarken DB bağlantısı hazır olsun diye kısa bekle
    await asyncio.sleep(5)
    while True:
        try:
            db = get_database()
            service_service = ServiceService(db)
            rejected = await service_service.check_and_handle_expired_services()
            if rejected:
                logger.info(f"Expiry check: {rejected} pending request(s) rejected.")
            else:
                logger.debug("Expiry check: no expired services found.")
        except Exception as e:
            logger.error(f"Expiry check error: {e}")
        await asyncio.sleep(EXPIRY_CHECK_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Connecting to MongoDB...")
    await connect_to_mongo()
    logger.info("Application startup complete")
    expiry_task = asyncio.create_task(run_expiry_checker())
    yield
    # Shutdown
    expiry_task.cancel()
    try:
        await expiry_task
    except asyncio.CancelledError:
        pass
    await close_mongo_connection()
    logger.info("Application shutdown complete")

app = FastAPI(
    title=settings.app_name,
    description="A community-oriented service exchange platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(comments.router)
app.include_router(admin.router)
app.include_router(join_requests.router)
app.include_router(transactions.router)
app.include_router(chat.router)
app.include_router(wikidata.router)
app.include_router(ratings.router)
app.include_router(forum.router)

@app.get("/")
async def root():
    return {"message": "Welcome to The Hive Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
