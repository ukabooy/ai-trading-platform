from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import os

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
        "stripe_price_id": None,
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
        "stripe_price_id": os.getenv("STRIPE_BASIC_PRICE_ID", ""),
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
        "stripe_price_id": os.getenv("STRIPE_PRO_PRICE_ID", ""),
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
    stripe_price_id: str


class UpgradeRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str
    plan: str


@router.get("/plans")
async def get_plans(current_user: User = Depends(get_current_user)):
    result = []
    for plan_id, plan in PLANS.items():
        result.append({
            "id": plan_id,
            "name": plan["name"],
            "price": plan["price"],
            "signals_per_day": plan["signals_per_day"],
            "max_trade_amount": plan["max_trade_amount"],
            "features": plan["features"],
            "is_current": current_user.subscription_plan == plan_id,
            "stripe_price_id": plan["stripe_price_id"] or ""
        })
    return result


@router.post("/create-checkout")
async def create_checkout(
    data: UpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan = PLANS[data.plan]

    # Try Stripe if configured
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    stripe_price_id = plan.get("stripe_price_id", "")

    if stripe_key and stripe_price_id:
        try:
            import stripe
            stripe.api_key = stripe_key

            frontend_url = os.getenv(
                "FRONTEND_URL",
                "https://ai-trading-platform-gamma.vercel.app"
            )

            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": stripe_price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=f"{frontend_url}/pricing?success=true&plan={data.plan}",
                cancel_url=f"{frontend_url}/pricing?cancelled=true",
                metadata={
                    "user_id": current_user.id,
                    "plan": data.plan
                }
            )
            return {"checkout_url": session.url, "plan": data.plan}
        except Exception as e:
            pass

    # Demo mode — upgrade directly without payment
    current_user.subscription_plan = data.plan
    current_user.max_trade_amount = plan["max_trade_amount"]
    if data.plan != "free":
        current_user.subscription_expires = datetime.utcnow() + timedelta(days=30)
    await db.commit()

    return {
        "checkout_url": "",
        "plan": data.plan,
        "message": f"Upgraded to {plan['name']} (demo mode)"
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    if not stripe_key:
        raise HTTPException(status_code=400, detail="Stripe not configured")

    try:
        import stripe
        stripe.api_key = stripe_key

        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session["metadata"].get("user_id")
            plan = session["metadata"].get("plan")

            if user_id and plan:
                result = await db.execute(
                    select(User).where(User.id == user_id)
                )
                user = result.scalar_one_or_none()
                if user:
                    user.subscription_plan = plan
                    user.max_trade_amount = PLANS[plan]["max_trade_amount"]
                    user.subscription_expires = datetime.utcnow() + timedelta(days=30)
                    await db.commit()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"status": "ok"}


@router.get("/current")
async def get_current_plan(current_user: User = Depends(get_current_user)):
    plan_id = current_user.subscription_plan
    plan = PLANS.get(plan_id, PLANS["free"])
    return {
        "plan": plan_id,
        "name": plan["name"],
        "price": plan["price"],
        "features": plan["features"],
        "expires": current_user.subscription_expires
    }
