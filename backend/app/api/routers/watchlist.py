from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, DateTime, ForeignKey, select, desc
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
import httpx

from app.core.database import get_db, Base
from app.api.routers.auth import get_current_user
from app.models.models import User


def generate_uuid():
    return str(uuid.uuid4())


class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


class WatchlistAdd(BaseModel):
    symbol: str


class WatchlistResponse(BaseModel):
    id: str
    symbol: str
    price: float
    change_percent_24h: float
    created_at: datetime

    class Config:
        from_attributes = True


async def get_kraken_price(symbol: str) -> tuple:
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
                    price = float(val["c"][0])
                    open_price = float(val["o"])
                    change = ((price - open_price) / open_price * 100) if open_price else 0
                    return price, round(change, 2)
    except Exception:
        pass
    return 0.0, 0.0


@router.get("", response_model=List[WatchlistResponse])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(desc(WatchlistItem.created_at))
    )
    items = result.scalars().all()

    response = []
    for item in items:
        price, change = await get_kraken_price(item.symbol)
        response.append(WatchlistResponse(
            id=item.id,
            symbol=item.symbol,
            price=price,
            change_percent_24h=change,
            created_at=item.created_at,
        ))
    return response


@router.post("", status_code=201)
async def add_to_watchlist(
    data: WatchlistAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if already in watchlist
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == data.symbol.upper()
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already in watchlist")

    item = WatchlistItem(
        user_id=current_user.id,
        symbol=data.symbol.upper(),
    )
    db.add(item)
    await db.commit()
    return {"message": f"{data.symbol.upper()} added to watchlist"}


@router.delete("/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == symbol.upper()
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    await db.delete(item)
    await db.commit()
    return {"message": f"{symbol.upper()} removed from watchlist"}
