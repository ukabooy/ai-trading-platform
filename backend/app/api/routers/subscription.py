from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/subscription", tags=["Subscription"])


PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "signals_per_day": 3,
        "max_trade_amount": 100,
        "features": [
            "3 AI signals per day",
            "Paper trading only",
            "Basic market data",
            "Price alerts (3 max)",
        ]
    },
    "basic": {
        "name": "Basic",
        "price": 9.99,
        "signals_per_day": 20,
        "max_trade_amount": 1000,
        "features": [
            "20 AI signals per day",
            "Paper + live trading",
            "Real-time market data",
            "Price alerts (20 max)",
            "Trade history export",
        ]
    },
    "pro": {
        "name": "Pro",
        "price": 29.99,
        "signals_per_day": 999,
        "max_trade_amount": 100000,
        "features": [
            "Unlimited AI signals",
            "Live trading with Binance",
            "Real-time market data",
            "Unlimited price alerts",
            "Auto-trading bot",
            "Priority support",
            "Advanced backtesting",
        ]
    }
}


class PlanResponse(BaseModel):
    id: str
    name: str
    price: float
    signals_per_day: int
    max_trade_amount: float
    features: List[str]
    is_current: bool


class UpgradeRequest(BaseModel):
    plan: str


@router.get("/plans")
async def get_plans(
    current_user: User = Depends(get_current_user)
):
    result = []
    for plan_id, plan in PLANS.items():
        result.append(PlanResponse(
            id=plan_id,
            name=plan["name"],
            price=plan["price"],
            signals_per_day=plan["signals_per_day"],
            max_trade_amount=plan["max_trade_amount"],
            features=plan["features"],
            is_current=current_user.subscription_plan == plan_id
        ))
    return result


@router.post("/upgrade")
async def upgrade_plan(
    data: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    if data.plan == current_user.subscription_plan:
        raise HTTPException(status_code=400, detail="Already on this plan")

    # In production this would go through Stripe payment
    # For now we upgrade directly (demo mode)
    current_user.subscription_plan = data.plan
    plan_info = PLANS[data.plan]
    current_user.max_trade_amount = plan_info["max_trade_amount"]

    if data.plan != "free":
        current_user.subscription_expires = datetime.utcnow() + timedelta(days=30)

    await db.commit()
    return {
        "message": f"Successfully upgraded to {plan_info['name']} plan!",
        "plan": data.plan,
        "expires": current_user.subscription_expires
    }


@router.get("/current")
async def get_current_plan(
    current_user: User = Depends(get_current_user)
):
    plan_id = current_user.subscription_plan
    plan = PLANS.get(plan_id, PLANS["free"])
    return {
        "plan": plan_id,
        "name": plan["name"],
        "price": plan["price"],
        "features": plan["features"],
        "expires": current_user.subscription_expires
    }
