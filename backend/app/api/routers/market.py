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
