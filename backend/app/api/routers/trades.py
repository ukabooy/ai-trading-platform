from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import Trade, User

router = APIRouter(prefix="/trades", tags=["Trades"])


class TradeCreate(BaseModel):
    symbol: str
    direction: str  # long or short
    quantity: float
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


class TradeClose(BaseModel):
    exit_price: float


class TradeResponse(BaseModel):
    id: str
    symbol: str
    direction: str
    status: str
    entry_price: Optional[float]
    exit_price: Optional[float]
    quantity: float
    pnl: float
    pnl_percent: float
    is_paper_trade: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=TradeResponse, status_code=201)
async def create_trade(
    data: TradeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    total_value = data.entry_price * data.quantity
    trade = Trade(
        user_id=current_user.id,
        symbol=data.symbol.upper(),
        direction=data.direction,
        status="open",
        entry_price=data.entry_price,
        stop_loss=data.stop_loss,
        take_profit=data.take_profit,
        current_price=data.entry_price,
        quantity=data.quantity,
        total_value=total_value,
        is_paper_trade=True,
        opened_at=datetime.utcnow(),
    )
    db.add(trade)
    await db.commit()
    await db.refresh(trade)
    return trade


@router.get("", response_model=List[TradeResponse])
async def list_trades(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade)
        .where(Trade.user_id == current_user.id)
        .order_by(desc(Trade.created_at))
    )
    return result.scalars().all()


@router.post("/{trade_id}/close", response_model=TradeResponse)
async def close_trade(
    trade_id: str,
    data: TradeClose,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Trade).where(Trade.id == trade_id, Trade.user_id == current_user.id)
    )
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if trade.status != "open":
        raise HTTPException(status_code=400, detail="Trade is not open")

    trade.exit_price = data.exit_price
    trade.status = "closed"
    trade.closed_at = datetime.utcnow()

    if trade.direction == "long":
        trade.pnl = (data.exit_price - trade.entry_price) * trade.quantity
    else:
        trade.pnl = (trade.entry_price - data.exit_price) * trade.quantity

    if trade.total_value:
        trade.pnl_percent = (trade.pnl / trade.total_value) * 100

    await db.commit()
    await db.refresh(trade)
    return trade
