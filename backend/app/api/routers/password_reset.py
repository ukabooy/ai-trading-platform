from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import secrets

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.models import User
from app.core.cache import cache_set, cache_get, cache_delete

router = APIRouter(prefix="/password", tags=["Password Reset"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If that email exists, a reset code has been sent."}

    reset_code = str(secrets.randbelow(900000) + 100000)
    await cache_set(f"reset:{data.email}", reset_code, expire=900)

    # Send real email if configured
    email_sent = False
    try:
        from app.services.email_service import send_password_reset_email
        email_sent = await send_password_reset_email(data.email, reset_code)
    except Exception:
        pass

    response = {
        "message": "Reset code generated successfully.",
        "note": "In production this would be sent to your email."
    }

    if not email_sent:
        response["reset_code"] = reset_code

    return response


@router.post("/reset")
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        email, code = data.token.split(":")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    stored_code = await cache_get(f"reset:{email}")
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    await cache_delete(f"reset:{email}")

    return {"message": "Password reset successfully! You can now login."}
