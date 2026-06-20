from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, select, desc
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


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    target_price = Column(Float, nullable=False)
    direction = Column(String(10), nullable=False)  # above or below
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


router = APIRouter(prefix="/alerts", tags=["Price Alerts"])


class AlertCreate(BaseModel):
    symbol: str
    target_price: float
    direction: str  # "above" or "below"


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
