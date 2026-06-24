from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, select, desc
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.database import get_db, Base
from app.api.routers.auth import get_current_user
from app.models.models import User


def generate_uuid():
    return str(uuid.uuid4())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCount(BaseModel):
    total: int
    unread: int


async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    type: str = "info"
):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
    )
    db.add(notif)
    await db.commit()


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(50)
    )
    return result.scalars().all()


@router.get("/count", response_model=NotificationCount)
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import func as sqlfunc
    total = (await db.execute(
        sqlfunc.count(Notification.id)
        .select().where(Notification.user_id == current_user.id)
    )).scalar() or 0

    unread = (await db.execute(
        sqlfunc.count(Notification.id)
        .select().where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )).scalar() or 0

    return NotificationCount(total=total, unread=unread)


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import update
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/test")
async def create_test_notification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await create_notification(
        db,
        user_id=current_user.id,
        title="Welcome to AI Trading Platform!",
        message="Your account is set up and ready. Generate your first AI signal to get started!",
        type="success"
    )
    return {"message": "Test notification created"}
