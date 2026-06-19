from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.api.routers.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    auto_trade_enabled: Optional[bool] = None
    max_trade_amount: Optional[float] = None
    risk_level: Optional[int] = None


class SettingsResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    auto_trade_enabled: bool
    max_trade_amount: float
    risk_level: int

    class Config:
        from_attributes = True


@router.get("/profile", response_model=SettingsResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=SettingsResponse)
async def update_profile(
    data: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user
