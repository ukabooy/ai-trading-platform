from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api.routers.auth import router as auth_router
from app.api.routers.signals import router as signals_router
from app.api.routers.trades import router as trades_router
from app.api.routers.market import router as market_router
from app.api.routers.settings import router as settings_router
from app.api.routers.twofa import router as twofa_router
from app.api.routers.dashboard_stats import router as dashboard_router
from app.api.routers.alerts import router as alerts_router
from app.api.routers.leaderboard import router as leaderboard_router
from app.api.routers.subscription import router as subscription_router
from app.api.routers.admin import router as admin_router
from app.api.routers.copy_trading import router as copy_router
from app.api.routers.referral import router as referral_router
from app.api.routers.notifications import router as notifications_router
from app.api.routers.watchlist import router as watchlist_router

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
app.include_router(market_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(twofa_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(leaderboard_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(copy_router, prefix="/api")
app.include_router(referral_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "message": "AI Trading Platform is running!",
        "version": settings.APP_VERSION
    }
