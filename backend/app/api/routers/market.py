from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["Market Data"])

KRAKEN_MAP = {
    "XXBTZUSD": "BTCUSDT",
    "XETHZUSD": "ETHUSDT",
    "SOLUSD": "SOLUSDT",
    "ADAUSD": "ADAUSDT",
    "XXRPZUSD": "XRPUSDT",
}


class Ticker(BaseModel):
    symbol: str
    price: float
    change_percent_24h: float


@router.get("/tickers", response_model=List[Ticker])
async def get_tickers():
    mock = {"BTCUSDT": 67500, "ETHUSDT": 3800, "BNBUSDT": 420, "SOLUSDT": 180, "ADAUSDT": 0.65, "XRPUSDT": 0.72}
    results = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            pairs = "BTCUSD,ETHUSD,SOLUSD,ADAUSD,XRPUSD"
            logger.info(f"Fetching Kraken with pairs={pairs}")
            resp = await client.get(
                "https://api.kraken.com/0/public/Ticker",
                params={"pair": pairs}
            )
            logger.info(f"Kraken response status: {resp.status_code}")
            logger.info(f"Kraken response body: {resp.text[:800]}")
            if resp.status_code == 200:
                data = resp.json().get("result", {})
                found = {}
                for key, val in data.items():
                    symbol = KRAKEN_MAP.get(key)
                    if symbol:
                        last_price = float(val["c"][0])
                        open_price = float(val["o"])
                        change_pct = ((last_price - open_price) / open_price * 100) if open_price else 0
                        found[symbol] = Ticker(symbol=symbol, price=last_price, change_percent_24h=change_pct)
                for symbol in mock.keys():
                    if symbol in found:
                        results.append(found[symbol])
                    else:
                        results.append(Ticker(symbol=symbol, price=mock[symbol], change_percent_24h=0))
    except Exception as e:
        logger.error(f"Market fetch failed: {repr(e)}")

    if not results:
        results = [Ticker(symbol=s, price=p, change_percent_24h=0) for s, p in mock.items()]

    return results
@router.get("/candles/{symbol}")
async def get_candles(symbol: str, timeframe: str = "1h", limit: int = 50):
    pair = symbol.upper().replace("USDT", "USD")
    interval_map = {
        "15m": 15, "1h": 60, "4h": 240, "1d": 1440
    }
    interval = interval_map.get(timeframe, 60)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.kraken.com/0/public/OHLC",
                params={"pair": pair, "interval": interval}
            )
            if resp.status_code == 200:
                data = resp.json().get("result", {})
                candles = []
                for key, val in data.items():
                    if key == "last":
                        continue
                    for c in val[-limit:]:
                        candles.append({
                            "timestamp": c[0],
                            "open": float(c[1]),
                            "high": float(c[2]),
                            "low": float(c[3]),
                            "close": float(c[4]),
                            "volume": float(c[6])
                        })
                return candles
    except Exception as e:
        logger.error(f"Candles fetch failed: {repr(e)}")
    return []


@router.get("/ticker/{symbol}")
async def get_ticker(symbol: str):
    pair = symbol.upper().replace("USDT", "USD")
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
                    open_p = float(val["o"])
                    change = ((price - open_p) / open_p * 100) if open_p else 0
                    return {
                        "symbol": symbol.upper(),
                        "price": price,
                        "change_percent_24h": round(change, 2)
                    }
    except Exception as e:
        logger.error(f"Ticker fetch failed: {repr(e)}")
    return {"symbol": symbol.upper(), "price": 0, "change_percent_24h": 0}
