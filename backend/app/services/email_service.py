import httpx
import logging
import os

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@yourdomain.com")
APP_NAME = "AI Trading Platform"


async def send_email(to: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY:
        logger.info(f"Email not configured. Would send to {to}: {subject}")
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": f"{APP_NAME} <{FROM_EMAIL}>",
                    "to": [to],
                    "subject": subject,
                    "html": html
                }
            )
            if resp.status_code == 200:
                logger.info(f"Email sent to {to}")
                return True
            else:
                logger.error(f"Email failed: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Email error: {repr(e)}")
        return False


async def send_welcome_email(to: str, username: str) -> bool:
    html = f"""
    <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
        <h1 style="color: #6366f1;">Welcome to AI Trading Platform! 🚀</h1>
        <p>Hi <strong>{username}</strong>,</p>
        <p>Your account is set up and ready. Here's what you can do:</p>
        <ul>
            <li>⚡ Generate AI trading signals</li>
            <li>📈 Track live crypto prices</li>
            <li>💼 Paper trade with no risk</li>
            <li>🔔 Set price alerts</li>
        </ul>
        <a href="https://ai-trading-platform-gamma.vercel.app" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
            Start Trading
        </a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            AI Trading Platform — Trade smarter with AI
        </p>
    </div>
    """
    return await send_email(to, f"Welcome to {APP_NAME}! 🚀", html)


async def send_alert_triggered_email(to: str, username: str, symbol: str, direction: str, price: float) -> bool:
    html = f"""
    <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
        <h1 style="color: #f59e0b;">🔔 Price Alert Triggered!</h1>
        <p>Hi <strong>{username}</strong>,</p>
        <p>Your price alert has been triggered:</p>
        <div style="background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #f1f5f9;">{symbol}</p>
            <p style="color: #94a3b8;">Price went <strong>{direction}</strong> ${price:,.2f}</p>
        </div>
        <a href="https://ai-trading-platform-gamma.vercel.app/signals" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Generate Signal Now
        </a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            AI Trading Platform — You set this alert. <a href="https://ai-trading-platform-gamma.vercel.app/alerts" style="color: #6366f1;">Manage alerts</a>
        </p>
    </div>
    """
    return await send_email(to, f"🔔 {symbol} Alert Triggered!", html)


async def send_password_reset_email(to: str, reset_code: str) -> bool:
    html = f"""
    <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
        <h1 style="color: #6366f1;">🔑 Password Reset</h1>
        <p>You requested a password reset for your AI Trading Platform account.</p>
        <p>Your reset code is:</p>
        <div style="background: #1a1a24; border: 2px solid #6366f1; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; margin: 0;">{reset_code}</p>
        </div>
        <p style="color: #94a3b8;">This code expires in 15 minutes.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            If you didn't request this, ignore this email.
        </p>
    </div>
    """
    return await send_email(to, "🔑 Your Password Reset Code", html)


async def send_signal_email(to: str, username: str, symbol: str, action: str, price: float, confidence: float) -> bool:
    color = "#10b981" if action == "buy" else "#ef4444" if action == "sell" else "#f59e0b"
    html = f"""
    <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f1f5f9; padding: 40px; border-radius: 16px;">
        <h1 style="color: {color};">⚡ New AI Signal: {action.upper()}</h1>
        <p>Hi <strong>{username}</strong>, a new trading signal has been generated:</p>
        <div style="background: #1a1a24; border: 1px solid #2a2a3a; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold;">{symbol}</p>
            <p style="font-size: 20px; color: {color}; font-weight: bold;">{action.upper()}</p>
            <p style="color: #94a3b8;">Entry Price: <strong>${price:,.2f}</strong></p>
            <p style="color: #94a3b8;">Confidence: <strong>{confidence:.0f}%</strong></p>
        </div>
        <a href="https://ai-trading-platform-gamma.vercel.app/signals"
           style="display: inline-block; background: {color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            View Signal
        </a>
    </div>
    """
    return await send_email(to, f"⚡ New {action.upper()} Signal for {symbol}", html)
