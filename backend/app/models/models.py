from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"


class TradeStatus(str, enum.Enum):
    PENDING = "pending"
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class TradeDirection(str, enum.Enum):
    LONG = "long"
    SHORT = "short"


class SignalAction(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    subscription_plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    auto_trade_enabled = Column(Boolean, default=False)
    max_trade_amount = Column(Float, default=100.0)
    risk_level = Column(Integer, default=3)
    binance_api_key = Column(String(500))
    binance_secret_key = Column(String(500))
    binance_testnet = Column(Boolean, default=True)
    totp_secret = Column(String(32))
    totp_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    trades = relationship("Trade", back_populates="user", lazy="dynamic")
    signals = relationship("Signal", back_populates="user", lazy="dynamic")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    signal_id = Column(String, ForeignKey("signals.id"), nullable=True)
    symbol = Column(String(20), nullable=False, index=True)
    direction = Column(Enum(TradeDirection), nullable=False)
    status = Column(Enum(TradeStatus), default=TradeStatus.PENDING)
    entry_price = Column(Float)
    exit_price = Column(Float)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    current_price = Column(Float)
    quantity = Column(Float, nullable=False)
    total_value = Column(Float)
    pnl = Column(Float, default=0.0)
    pnl_percent = Column(Float, default=0.0)
    fees = Column(Float, default=0.0)
    is_paper_trade = Column(Boolean, default=True)
    exchange_order_id = Column(String(100))
    notes = Column(Text)
    opened_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="trades")
    signal = relationship("Signal", back_populates="trades")


class Signal(Base):
    __tablename__ = "signals"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    symbol = Column(String(20), nullable=False)
    action = Column(Enum(SignalAction), nullable=False)
    timeframe = Column(String(10), default="1h")
    entry_price = Column(Float)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    current_price = Column(Float)
    confidence = Column(Float)
    reasoning = Column(Text)
    indicators = Column(JSON, default=dict)
    ai_provider = Column(String(50))
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    executed_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="signals")
    trades = relationship("Trade", back_populates="signal")
