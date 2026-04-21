"""
Q Sovereign Analysis Server — FastAPI
اجرا: pip install fastapi uvicorn ; python api/snapshot.py
دسترسی: http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json, os
from datetime import datetime
from pathlib import Path

app = FastAPI(
    title="Q Sovereign Analysis Server",
    description="آنالیز آفلاین اکوسیستم Q NETWORK — local-only",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# مسیر فایل‌های داده
BASE_DIR   = Path(__file__).parent.parent
CIVS_FILE  = BASE_DIR / "data" / "civilizations.json"
TOKEN_FILE = BASE_DIR / "data" / "token_ledger.json"


def _load(path: Path) -> any:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/", summary="وضعیت سرور")
def root():
    return {
        "server": "Q Sovereign Analysis Server",
        "status": "online",
        "mode": "local-analysis",
        "time": datetime.now().isoformat(),
    }


@app.get("/snapshot", summary="Snapshot کامل جهان")
def snapshot():
    civs     = _load(CIVS_FILE) or []
    balances = _load(TOKEN_FILE) or {}

    return {
        "timestamp": datetime.now().isoformat(),
        "state": "frozen_analysis",
        "summary": {
            "planets":       len(civs),
            "total_q_tokens": sum(c.get("qTokens", 0) for c in civs),
            "total_agents":  sum(len(c.get("agents", [])) for c in civs),
            "wallets":       len(balances),
            "wallet_total_q": sum(balances.values()) if balances else 0,
        },
        "civilizations": [
            {
                "id":      c.get("id"),
                "qTokens": c.get("qTokens", 0),
                "tick":    c.get("tick", 0),
                "agents":  len(c.get("agents", [])),
                "lastLog": (c.get("log") or [None])[-1],
            }
            for c in civs
        ],
    }


@app.get("/planets", summary="لیست همه سیاره‌ها")
def get_planets():
    civs = _load(CIVS_FILE) or []
    return civs


@app.get("/planets/{planet_id}", summary="جزئیات یک سیاره")
def get_planet(planet_id: str):
    civs = _load(CIVS_FILE) or []
    planet = next((c for c in civs if c.get("id") == planet_id), None)
    if not planet:
        raise HTTPException(status_code=404, detail=f"سیاره {planet_id} پیدا نشد")
    return planet


@app.get("/tokens", summary="موجودی توکن‌ها")
def get_tokens():
    balances = _load(TOKEN_FILE) or {}
    sorted_b = sorted(balances.items(), key=lambda x: -x[1])
    return [{"rank": i + 1, "userId": uid, "balance": bal} for i, (uid, bal) in enumerate(sorted_b)]


@app.get("/analyze", summary="تحلیل آماری کل شبکه")
def analyze():
    civs     = _load(CIVS_FILE) or []
    balances = _load(TOKEN_FILE) or {}
    
    if not civs:
        return {"message": "هیچ داده‌ای یافت نشد"}

    top_planet = max(civs, key=lambda c: c.get("qTokens", 0), default=None)
    
    return {
        "timestamp": datetime.now().isoformat(),
        "network": {
            "planets":       len(civs),
            "total_ticks":   sum(c.get("tick", 0) for c in civs),
            "total_agents":  sum(len(c.get("agents", [])) for c in civs),
            "total_q_produced": sum(c.get("qTokens", 0) for c in civs),
        },
        "economy": {
            "wallets": len(balances),
            "total_in_wallets": sum(balances.values()) if balances else 0,
            "top_holder": max(balances, key=balances.get) if balances else None,
        },
        "top_planet": {
            "id": top_planet.get("id") if top_planet else None,
            "qTokens": top_planet.get("qTokens", 0) if top_planet else 0,
        },
    }


if __name__ == "__main__":
    import uvicorn
    print("Q Sovereign Analysis Server — http://127.0.0.1:8000")
    print("مستندات: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
