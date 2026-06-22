from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, select, desc
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import httpx

from app.core.database import get_db, Base
from app.api.routers.auth import get_current_user
from app.models.models import User


def generate_uuid():
    return str(uuid.uuid4())


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    target_price = Column(Float, nullable=False)
    direction = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


router = APIRouter(prefix="/alerts", tags=["Price Alerts"])


class AlertCreate(BaseModel):
    symbol: str
    target_price: float
    direction: str


class AlertResponse(BaseModel):
    id: str
    symbol: str
    target_price: float
    direction: str
    is_active: bool
    is_triggered: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(
    data: AlertCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    alert = PriceAlert(
        user_id=current_user.id,
        symbol=data.symbol.upper(),
        target_price=data.target_price,
        direction=data.direction,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert)
        .where(PriceAlert.user_id == current_user.id)
        .order_by(desc(PriceAlert.created_at))
    )
    return result.scalars().all()


@router.get("/check", response_model=List[AlertResponse])
async def check_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(
            PriceAlert.user_id == current_user.id,
            PriceAlert.is_active == True,
            PriceAlert.is_triggered == False
        )
    )
    alerts = result.scalars().all()
    if not alerts:
        return []

    triggered = []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            symbols = list(set(a.symbol for a in alerts))
            pairs = ",".join(s.replace("USDT", "USD") for s in symbols)
            resp = await client.get(
                "https://api.kraken.com/0/public/Ticker",
                params={"pair": pairs}
            )
            prices = {}
            if resp.status_code == 200:
                data = resp.json().get("result", {})
                for key, val in data.items():
                    price = float(val["c"][0])
                    for s in symbols:
                        base = s.replace("USDT", "")
                        if base in key.upper():
                            prices[s] = price
                            break

            for alert in alerts:
                current_price = prices.get(alert.symbol)
                if current_price:
                    if alert.direction == "above" and current_price >= alert.target_price:
                        alert.is_triggered = True
                        triggered.append(alert)
                    elif alert.direction == "below" and current_price <= alert.target_price:
                        alert.is_triggered = True
                        triggered.append(alert)
            await db.commit()
    except Exception:
        pass

    return triggered


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PriceAlert).where(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    await db.commit()
