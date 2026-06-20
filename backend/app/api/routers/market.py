from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import httpx

router = APIRouter(prefix="/market", tags=["Market Data"])

SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "ADA", "XRP"]


class Ticker(BaseModel):
    symbol: str
    price: float
    change_percent_24h: float


@router.get("/tickers", response_model=List[Ticker])
async def get_tickers():
    mock = {"BTC": 67500, "ETH": 3800, "BNB": 420, "SOL": 180, "ADA": 0.65, "XRP": 0.72}
    results = []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            syms = ",".join(SYMBOLS)
            resp = await client.get(
                "https://min-api.cryptocompare.com/data/pricemultifull",
                params={"fsyms": syms, "tsyms": "USD"}
            )
            if resp.status_code == 200:
                data = resp.json().get("RAW", {})
                for symbol in SYMBOLS:
                    if symbol in data and "USD" in data[symbol]:
                        d = data[symbol]["USD"]
                        results.append(Ticker(
                            symbol=f"{symbol}USDT",
                            price=float(d.get("PRICE", mock[symbol])),
                            change_percent_24h=float(d.get("CHANGEPCT24HOUR", 0))
                        ))
    except Exception:
        pass

    if not results:
        results = [Ticker(symbol=f"{s}USDT", price=p, change_percent_24h=0) for s, p in mock.items()]

    return results
