from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import httpx
import asyncio

router = APIRouter(prefix="/market", tags=["Market Data"])

SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT"]


class Ticker(BaseModel):
    symbol: str
    price: float
    change_percent_24h: float


async def fetch_binance_all() -> dict:
    """Fetch all tickers in ONE request - faster and more reliable"""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get("https://api.binance.com/api/v3/ticker/24hr")
            if resp.status_code == 200:
                data = resp.json()
                return {item["symbol"]: item for item in data if item["symbol"] in SYMBOLS}
    except Exception:
        pass
    return {}


async def fetch_coingecko() -> dict:
    """Backup source if Binance fails"""
    id_map = {
        "BTCUSDT": "bitcoin", "ETHUSDT": "ethereum", "BNBUSDT": "binancecoin",
        "SOLUSDT": "solana", "ADAUSDT": "cardano", "XRPUSDT": "ripple"
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            ids = ",".join(id_map.values())
            resp = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": ids, "vs_currencies": "usd", "include_24hr_change": "true"}
            )
            if resp.status_code == 200:
                data = resp.json()
                result = {}
                for symbol, cg_id in id_map.items():
                    if cg_id in data:
                        result[symbol] = {
                            "lastPrice": data[cg_id]["usd"],
                            "priceChangePercent": data[cg_id].get("usd_24h_change", 0)
                        }
                return result
    except Exception:
        pass
    return {}


@router.get("/tickers", response_model=List[Ticker])
async def get_tickers():
    binance_data = await fetch_binance_all()

    if not binance_data or len(binance_data) < len(SYMBOLS):
        cg_data = await fetch_coingecko()
        for symbol, item in cg_data.items():
            if symbol not in binance_data:
                binance_data[symbol] = item

    results = []
    mock = {"BTCUSDT": 67500, "ETHUSDT": 3800, "BNBUSDT": 420, "SOLUSDT": 180, "ADAUSDT": 0.65, "XRPUSDT": 0.72}

    for symbol in SYMBOLS:
        if symbol in binance_data:
            item = binance_data[symbol]
            results.append(Ticker(
                symbol=symbol,
                price=float(item.get("lastPrice", mock[symbol])),
                change_percent_24h=float(item.get("priceChangePercent", 0))
            ))
        else:
            results.append(Ticker(symbol=symbol, price=mock[symbol], change_percent_24h=0))

    return results
