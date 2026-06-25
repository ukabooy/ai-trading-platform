from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
import httpx

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import User, Trade


router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


class PositionItem(BaseModel):
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    total_value: float
    pnl: float
    pnl_percent: float


class PortfolioSummary(BaseModel):
    total_value: float
    total_pnl: float
    total_pnl_percent: float
    positions: List[PositionItem]
    best_performer: str
    worst_performer: str


async def get_kraken_price(symbol: str) -> float:
    pair = symbol.replace("USDT", "USD")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.kraken.com/0/public/Ticker",
                params={"pair": pair}
            )
            if resp.status_code == 200:
                data = resp.json().get("result", {})
                for key, val in data.items():
                    return float(val["c"][0])
    except Exception:
        pass
    return 0.0


@router.get("/summary", response_model=PortfolioSummary)
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get all open trades
    result = await db.execute(
        select(Trade).where(
            Trade.user_id == current_user.id,
            Trade.status == "open"
        )
    )
    open_trades = result.scalars().all()

    # Group by symbol
    positions = {}
    for trade in open_trades:
        sym = trade.symbol
        if sym not in positions:
            positions[sym] = {
                "quantity": 0,
                "total_cost": 0,
                "trades": 0
            }
        positions[sym]["quantity"] += trade.quantity
        positions[sym]["total_cost"] += (trade.entry_price or 0) * trade.quantity
        positions[sym]["trades"] += 1

    # Get current prices and calculate PnL
    position_items = []
    total_value = 0
    total_cost = 0

    for sym, pos in positions.items():
        if pos["quantity"] <= 0:
            continue

        current_price = await get_kraken_price(sym)
        if current_price == 0:
            current_price = pos["total_cost"] / pos["quantity"]

        avg_entry = pos["total_cost"] / pos["quantity"]
        value = current_price * pos["quantity"]
        pnl = (current_price - avg_entry) * pos["quantity"]
        pnl_pct = ((current_price - avg_entry) / avg_entry * 100) if avg_entry > 0 else 0

        position_items.append(PositionItem(
            symbol=sym,
            quantity=round(pos["quantity"], 6),
            avg_entry_price=round(avg_entry, 4),
            current_price=round(current_price, 4),
            total_value=round(value, 2),
            pnl=round(pnl, 2),
            pnl_percent=round(pnl_pct, 2),
        ))

        total_value += value
        total_cost += pos["total_cost"]

    total_pnl = total_value - total_cost
    total_pnl_pct = ((total_pnl / total_cost) * 100) if total_cost > 0 else 0

    position_items.sort(key=lambda x: x.pnl_percent, reverse=True)

    best = position_items[0].symbol if position_items else "N/A"
    worst = position_items[-1].symbol if position_items else "N/A"

    return PortfolioSummary(
        total_value=round(total_value, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_percent=round(total_pnl_pct, 2),
        positions=position_items,
        best_performer=best,
        worst_performer=worst,
    )
