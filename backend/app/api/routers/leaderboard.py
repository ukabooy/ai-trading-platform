from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import Trade, User

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    total_trades: int
    winning_trades: int
    win_rate: float
    total_pnl: float

    class Config:
        from_attributes = True


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.is_active == True)
    )
    users = result.scalars().all()

    entries = []
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

        total_trades = len(trades)
        winning = sum(1 for t in trades if t.pnl > 0)
        win_rate = (winning / total_trades * 100) if total_trades > 0 else 0
        total_pnl = sum(t.pnl for t in trades)

        entries.append({
            "username": user.username,
            "total_trades": total_trades,
            "winning_trades": winning,
            "win_rate": round(win_rate, 2),
            "total_pnl": round(total_pnl, 2),
        })

    entries.sort(key=lambda x: x["total_pnl"], reverse=True)
    ranked = []
    for i, entry in enumerate(entries):
        ranked.append(LeaderboardEntry(rank=i + 1, **entry))

    return ranked
