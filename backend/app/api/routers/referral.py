from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, select, desc
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import secrets

from app.core.database import get_db, Base
from app.api.routers.auth import get_current_user
from app.models.models import User


def generate_uuid():
    return str(uuid.uuid4())


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=generate_uuid)
    referrer_id = Column(String, ForeignKey("users.id"), nullable=False)
    referred_id = Column(String, ForeignKey("users.id"), nullable=True)
    code = Column(String(20), unique=True, nullable=False)
    is_used = Column(Boolean, default=False)
    reward_given = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)


router = APIRouter(prefix="/referral", tags=["Referral"])


class ReferralResponse(BaseModel):
    code: str
    referral_link: str
    total_referrals: int
    successful_referrals: int


class ReferralHistory(BaseModel):
    code: str
    is_used: bool
    created_at: datetime
    used_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/my-code", response_model=ReferralResponse)
async def get_referral_code(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get or create referral code
    result = await db.execute(
        select(Referral).where(
            Referral.referrer_id == current_user.id,
            Referral.is_used == False
        ).limit(1)
    )
    referral = result.scalar_one_or_none()

    if not referral:
        code = secrets.token_urlsafe(8).upper()[:10]
        referral = Referral(
            referrer_id=current_user.id,
            code=code,
        )
        db.add(referral)
        await db.commit()
        await db.refresh(referral)

    # Count stats
    all_result = await db.execute(
        select(Referral).where(Referral.referrer_id == current_user.id)
    )
    all_referrals = all_result.scalars().all()
    total = len(all_referrals)
    successful = sum(1 for r in all_referrals if r.is_used)

    return ReferralResponse(
        code=referral.code,
        referral_link=f"https://ai-trading-platform-gamma.vercel.app/register?ref={referral.code}",
        total_referrals=total,
        successful_referrals=successful,
    )


@router.post("/apply/{code}")
async def apply_referral_code(
    code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Referral).where(
            Referral.code == code.upper(),
            Referral.is_used == False
        )
    )
    referral = result.scalar_one_or_none()

    if not referral:
        raise HTTPException(status_code=404, detail="Invalid or already used referral code")

    if referral.referrer_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")

    # Apply reward — upgrade both to basic
    referral.is_used = True
    referral.referred_id = current_user.id
    referral.used_at = datetime.utcnow()
    referral.reward_given = True

    # Upgrade referred user to basic
    if current_user.subscription_plan == "free":
        current_user.subscription_plan = "basic"

    # Upgrade referrer to basic too
    referrer_result = await db.execute(
        select(User).where(User.id == referral.referrer_id)
    )
    referrer = referrer_result.scalar_one_or_none()
    if referrer and referrer.subscription_plan == "free":
        referrer.subscription_plan = "basic"

    await db.commit()
    return {
        "message": "Referral code applied! Both you and the referrer have been upgraded to Basic plan!",
        "reward": "basic_plan"
    }


@router.get("/history", response_model=List[ReferralHistory])
async def get_referral_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Referral)
        .where(Referral.referrer_id == current_user.id)
        .order_by(desc(Referral.created_at))
    )
    return result.scalars().all()
