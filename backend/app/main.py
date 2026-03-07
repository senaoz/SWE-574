import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from .core.config import settings
from .core.database import connect_to_mongo, close_mongo_connection
from .api import auth, users, services, admin, comments, join_requests, transactions, chat, wikidata, ratings, forum, upload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Connecting to MongoDB...")
    await connect_to_mongo()
    # Ensure upload directories exist
    upload_dir = settings.upload_dir
    for sub in ("profile", "services"):
        path = os.path.join(upload_dir, sub)
        os.makedirs(path, exist_ok=True)
    logger.info("Application startup complete")
    yield
    # Shutdown
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
app.include_router(upload.router)

# Ensure upload directory exists before mounting (StaticFiles requires it at init)
upload_dir = settings.upload_dir
os.makedirs(upload_dir, exist_ok=True)
for sub in ("profile", "services"):
    os.makedirs(os.path.join(upload_dir, sub), exist_ok=True)

# Mount static files for uploaded images (must be after routes to avoid shadowing)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to The Hive Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
