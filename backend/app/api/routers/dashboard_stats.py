from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import Trade, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard Stats"])


class StatsResponse(BaseModel):
    total_trades: int
    open_trades: int
    win_rate: float
    total_pnl: float
    portfolio_value: float


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    total_q = await db.execute(
        select(func.count(Trade.id)).where(Trade.user_id == current_user.id)
    )
    total_trades = total_q.scalar() or 0

    open_q = await db.execute(
        select(func.count(Trade.id)).where(
            and_(Trade.user_id == current_user.id, Trade.status == "open")
        )
    )
    open_trades = open_q.scalar() or 0

    closed_q = await db.execute(
        select(Trade).where(
            and_(Trade.user_id == current_user.id, Trade.status == "closed")
        )
    )
    closed_trades = closed_q.scalars().all()

    winning = sum(1 for t in closed_trades if t.pnl > 0)
    win_rate = (winning / len(closed_trades) * 100) if closed_trades else 0
    total_pnl = sum(t.pnl for t in closed_trades)

    open_q2 = await db.execute(
        select(Trade).where(
            and_(Trade.user_id == current_user.id, Trade.status == "open")
        )
    )
    open_list = open_q2.scalars().all()
    portfolio_value = sum((t.current_price or t.entry_price or 0) * t.quantity for t in open_list)

    return StatsResponse(
        total_trades=total_trades,
        open_trades=open_trades,
        win_rate=round(win_rate, 2),
        total_pnl=round(total_pnl, 2),
        portfolio_value=round(portfolio_value, 2),
    )
