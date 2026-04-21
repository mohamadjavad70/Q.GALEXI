// ─── Agent Market UI — Faz C: Agent-to-Agent Interaction ────────────────────
// بازار داخلی: کاربر می‌تواند پیشنهاد بگذارد و از سایر agentها خرید کند
import { useEffect, useState, useCallback } from 'react';

type OfferType = 'knowledge' | 'resource' | 'skill' | 'token';

interface MarketOffer {
  id: string;
  sellerAgentId: string;
  sellerPlanetId: string;
  offerType: OfferType;
  item: string;
  priceQ: number;
  quantity: number;
  status: 'open' | 'fulfilled' | 'cancelled';
  createdAt: number;
}

interface MarketStats {
  openOffers: number;
  totalTrades: number;
  volumeQ: number;
}

const API_BASE = import.meta.env.VITE_Q_API_URL ?? 'http://localhost:3001';

const TYPE_ICON: Record<OfferType, string> = {
  knowledge: '📚',
  resource: '⚙️',
  skill: '🎯',
  token: '🪙',
};

interface AgentMarketProps {
  planetId: string;
  agentId: string;
  onTrade?: (offer: MarketOffer) => void;
}

export function AgentMarket({ planetId, agentId, onTrade }: AgentMarketProps) {
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState<{
    offerType: OfferType; item: string; priceQ: number; quantity: number;
  }>({ offerType: 'knowledge', item: '', priceQ: 5, quantity: 1 });

  const loadData = useCallback(async () => {
    try {
      const [offRes, stRes] = await Promise.all([
        fetch(`${API_BASE}/api/market/offers?status=open`),
        fetch(`${API_BASE}/api/market/stats`),
      ]);
      if (offRes.ok) setOffers((await offRes.json()) as MarketOffer[]);
      if (stRes.ok)  setStats((await stRes.json()) as MarketStats);
      setLoading(false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleBuy = async (offer: MarketOffer) => {
    try {
      const res = await fetch(`${API_BASE}/api/market/offers/${offer.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerAgentId: agentId, buyerPlanetId: planetId }),
      });
      if (res.ok) {
        onTrade?.(offer);
        void loadData();
      }
    } catch { /* silent */ }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item.trim()) return;
    setPosting(true);
    try {
      await fetch(`${API_BASE}/api/market/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerAgentId: agentId, sellerPlanetId: planetId,
          offerType: form.offerType, item: form.item,
          priceQ: form.priceQ, quantity: form.quantity,
        }),
      });
      setForm({ offerType: 'knowledge', item: '', priceQ: 5, quantity: 1 });
      void loadData();
    } catch { /* silent */ } finally { setPosting(false); }
  };

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-4 border border-green-500/30 text-white">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="text-green-400">🏪</span>
        Agent Market
        {stats && (
          <span className="text-xs text-gray-400 font-normal mr-2">
            {stats.openOffers} پیشنهاد باز — {stats.volumeQ.toFixed(0)} Q حجم
          </span>
        )}
      </h3>

      {/* Post new offer */}
      <form onSubmit={(e) => void handlePost(e)} className="mb-4 bg-gray-800/40 rounded p-3 space-y-2">
        <p className="text-xs text-gray-400">ارسال پیشنهاد جدید</p>
        <div className="flex gap-2">
          <select
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white flex-shrink-0"
            value={form.offerType}
            onChange={e => setForm(f => ({ ...f, offerType: e.target.value as OfferType }))}
          >
            {(Object.keys(TYPE_ICON) as OfferType[]).map(t => (
              <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="نام کالا / مهارت / دانش..."
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white flex-1"
            value={form.item}
            onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-400">قیمت Q:</label>
          <input
            type="number" min={1} max={10000}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white w-20"
            value={form.priceQ}
            onChange={e => setForm(f => ({ ...f, priceQ: Number(e.target.value) }))}
          />
          <label className="text-xs text-gray-400 mr-2">تعداد:</label>
          <input
            type="number" min={1} max={1000}
            className="bg-gray-700 text-sm rounded px-2 py-1 text-white w-16"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
          />
          <button
            type="submit"
            disabled={posting || !form.item.trim()}
            className="mr-auto bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded px-3 py-1 transition-colors"
          >
            {posting ? '...' : '+ ارسال'}
          </button>
        </div>
      </form>

      {/* Offers list */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-gray-500 text-sm text-center py-2 animate-pulse">بارگذاری بازار...</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">هنوز پیشنهادی وجود ندارد</p>
        ) : (
          offers.map(offer => (
            <div
              key={offer.id}
              className="flex items-center justify-between bg-gray-800/40 rounded p-2 text-sm border border-gray-700/20"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span>{TYPE_ICON[offer.offerType] ?? '📦'}</span>
                <span className="text-white truncate">{offer.item}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">×{offer.quantity}</span>
                {offer.sellerPlanetId !== planetId && (
                  <span className="text-blue-400 text-xs flex-shrink-0">🌐</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-yellow-400 font-bold">{offer.priceQ} Q</span>
                {offer.sellerAgentId !== agentId ? (
                  <button
                    onClick={() => void handleBuy(offer)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs rounded px-2 py-1 transition-colors"
                  >
                    خرید
                  </button>
                ) : (
                  <span className="text-gray-500 text-xs">شما</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
