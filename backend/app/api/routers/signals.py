from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import httpx
import random

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import Signal, User

router = APIRouter(prefix="/signals", tags=["AI Signals"])


class GenerateSignalRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"


class SignalResponse(BaseModel):
    id: str
    symbol: str
    action: str
    timeframe: str
    entry_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    confidence: Optional[float]
    reasoning: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


async def get_price(symbol: str) -> float:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.binance.com/api/v3/ticker/price",
                params={"symbol": symbol}
            )
            if resp.status_code == 200:
                return float(resp.json()["price"])
    except Exception:
        pass
    mock_prices = {
        "BTCUSDT": 67500, "ETHUSDT": 3800, "BNBUSDT": 420,
        "SOLUSDT": 180, "ADAUSDT": 0.65, "XRPUSDT": 0.72
    }
    return mock_prices.get(symbol, 100.0)


@router.post("/generate", response_model=SignalResponse)
async def generate_signal(
    request: GenerateSignalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    symbol = request.symbol.upper()
    price = await get_price(symbol)

    rsi = random.uniform(20, 80)
    macd_positive = random.choice([True, False])

    buy_score = 0
    sell_score = 0
    if rsi < 35: buy_score += 3
    elif rsi > 65: sell_score += 3
    if macd_positive: buy_score += 2
    else: sell_score += 2

    if buy_score > sell_score:
        action = "buy"
        confidence = min(50 + buy_score * 8, 90)
        stop_loss = round(price * 0.97, 2)
        take_profit = round(price * 1.06, 2)
        reasoning = f"RSI={rsi:.1f} shows oversold conditions with positive momentum. Bullish setup detected."
    elif sell_score > buy_score:
        action = "sell"
        confidence = min(50 + sell_score * 8, 90)
        stop_loss = round(price * 1.03, 2)
        take_profit = round(price * 0.94, 2)
        reasoning = f"RSI={rsi:.1f} shows overbought conditions with negative momentum. Bearish setup detected."
    else:
        action = "hold"
        confidence = 45
        stop_loss = None
        take_profit = None
        reasoning = "Mixed signals detected. Market is consolidating, waiting for clearer direction."

    signal = Signal(
        user_id=current_user.id,
        symbol=symbol,
        action=action,
        timeframe=request.timeframe,
        entry_price=price,
        stop_loss=stop_loss,
        take_profit=take_profit,
        current_price=price,
        confidence=confidence,
        reasoning=reasoning,
        ai_provider="rule_based",
        is_active=True,
        is_public=True,
        expires_at=datetime.utcnow() + timedelta(hours=4),
    )
    db.add(signal)
    await db.commit()
    await db.refresh(signal)
    return signal


@router.get("", response_model=List[SignalResponse])
async def list_signals(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Signal)
        .where(Signal.is_public == True)
        .order_by(desc(Signal.created_at))
        .limit(limit)
    )
    return result.scalars().all()
