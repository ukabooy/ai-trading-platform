from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import User, Trade, Signal

router = APIRouter(prefix="/admin", tags=["Admin"])


async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_trades: int
    total_signals: int
    pro_users: int
    basic_users: int
    free_users: int


class UserSummary(BaseModel):
    id: str
    email: str
    username: str
    role: str
    subscription_plan: str
    is_active: bool
    total_trades: int
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateUserRole(BaseModel):
    role: str


@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )).scalar() or 0
    total_trades = (await db.execute(select(func.count(Trade.id)))).scalar() or 0
    total_signals = (await db.execute(select(func.count(Signal.id)))).scalar() or 0
    pro_users = (await db.execute(
        select(func.count(User.id)).where(User.subscription_plan == "pro")
    )).scalar() or 0
    basic_users = (await db.execute(
        select(func.count(User.id)).where(User.subscription_plan == "basic")
    )).scalar() or 0
    free_users = (await db.execute(
        select(func.count(User.id)).where(User.subscription_plan == "free")
    )).scalar() or 0

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        total_trades=total_trades,
        total_signals=total_signals,
        pro_users=pro_users,
        basic_users=basic_users,
        free_users=free_users,
    )


@router.get("/users", response_model=List[UserSummary])
async def list_users(
    admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).order_by(desc(User.created_at))
    )
    users = result.scalars().all()

    summaries = []
    for user in users:
        trades_count = (await db.execute(
            select(func.count(Trade.id)).where(Trade.user_id == user.id)
        )).scalar() or 0

        summaries.append(UserSummary(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            subscription_plan=user.subscription_plan,
            is_active=user.is_active,
            total_trades=trades_count,
            created_at=user.created_at,
        ))

    return summaries


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: UpdateUserRole,
    admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    await db.commit()
    return {"message": f"User role updated to {data.role}"}


@router.patch("/users/{user_id}/toggle")
async def toggle_user(
    user_id: str,
    admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    status = "activated" if user.is_active else "deactivated"
    return {"message": f"User {status}"}
