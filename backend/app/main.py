from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.routers.auth import router as auth_router
from app.api.routers.signals import router as signals_router
from app.api.routers.trades import router as trades_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Trading Platform...")
    await init_db()
    logger.info("Database tables created!")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(signals_router, prefix="/api")
app.include_router(trades_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "message": "AI Trading Platform is running!",
        "version": settings.APP_VERSION
    }
