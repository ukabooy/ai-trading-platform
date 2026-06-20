from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["Market Data"])

ID_MAP = {
    "bitcoin": "BTCUSDT",
    "ethereum": "ETHUSDT",
    "binance-coin": "BNBUSDT",
    "solana": "SOLUSDT",
    "cardano": "ADAUSDT",
    "xrp": "XRPUSDT",
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
            ids = ",".join(ID_MAP.keys())
            logger.info(f"Fetching CoinCap with ids={ids}")
            resp = await client.get(
                "https://api.coincap.io/v2/assets",
                params={"ids": ids}
            )
            logger.info(f"CoinCap response status: {resp.status_code}")
            logger.info(f"CoinCap response body: {resp.text[:500]}")
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                found = {}
                for item in data:
                    symbol = ID_MAP.get(item["id"])
                    if symbol:
                        found[symbol] = Ticker(
                            symbol=symbol,
                            price=float(item.get("priceUsd", mock.get(symbol, 0))),
                            change_percent_24h=float(item.get("changePercent24Hr", 0) or 0)
                        )
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
