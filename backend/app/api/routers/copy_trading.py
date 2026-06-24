from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, select, desc, func
from sqlalchemy.sql import func as sqlfunc
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

from app.core.database import get_db, Base
from app.api.routers.auth import get_current_user
from app.models.models import User, Trade


def generate_uuid():
    return str(uuid.uuid4())


class CopyRelationship(Base):
    __tablename__ = "copy_relationships"

    id = Column(String, primary_key=True, default=generate_uuid)
    follower_id = Column(String, ForeignKey("users.id"), nullable=False)
    trader_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=sqlfunc.now())


router = APIRouter(prefix="/copy-trading", tags=["Copy Trading"])


class TraderProfile(BaseModel):
    id: str
    username: str
    total_trades: int
    win_rate: float
    total_pnl: float
    is_following: bool


class FollowRequest(BaseModel):
    trader_id: str


class FollowResponse(BaseModel):
    id: str
    trader_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/traders", response_model=List[TraderProfile])
async def get_top_traders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(
            User.is_active == True,
            User.id != current_user.id
        )
    )
    users = result.scalars().all()

    # Get who current user is following
    following_result = await db.execute(
        select(CopyRelationship).where(
            CopyRelationship.follower_id == current_user.id,
            CopyRelationship.is_active == True
        )
    )
    following_ids = {r.trader_id for r in following_result.scalars().all()}

    traders = []
    for user in users:
        trades_result = await db.execute(
            select(Trade).where(
                Trade.user_id == user.id,
                Trade.status == "closed"
            )
        )
        trades = trades_result.scalars().all()
        if not trades:
            continue

        total = len(trades)
        winning = sum(1 for t in trades if t.pnl > 0)
        win_rate = (winning / total * 100) if total > 0 else 0
        total_pnl = sum(t.pnl for t in trades)

        traders.append(TraderProfile(
            id=user.id,
            username=user.username,
            total_trades=total,
            win_rate=round(win_rate, 2),
            total_pnl=round(total_pnl, 2),
            is_following=user.id in following_ids
        ))

    traders.sort(key=lambda x: x.total_pnl, reverse=True)
    return traders


@router.post("/follow", response_model=FollowResponse)
async def follow_trader(
    data: FollowRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.trader_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check if already following
    existing = await db.execute(
        select(CopyRelationship).where(
            CopyRelationship.follower_id == current_user.id,
            CopyRelationship.trader_id == data.trader_id
        )
    )
    rel = existing.scalar_one_or_none()

    if rel:
        rel.is_active = not rel.is_active
        await db.commit()
        return rel

    rel = CopyRelationship(
        follower_id=current_user.id,
        trader_id=data.trader_id,
    )
    db.add(rel)
    await db.commit()
    await db.refresh(rel)
    return rel


@router.get("/following")
async def get_following(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CopyRelationship).where(
            CopyRelationship.follower_id == current_user.id,
            CopyRelationship.is_active == True
        )
    )
    relationships = result.scalars().all()

    following = []
    for rel in relationships:
        trader = await db.execute(
            select(User).where(User.id == rel.trader_id)
        )
        trader = trader.scalar_one_or_none()
        if trader:
            following.append({
                "trader_id": rel.trader_id,
                "username": trader.username,
                "since": rel.created_at
            })

    return following
