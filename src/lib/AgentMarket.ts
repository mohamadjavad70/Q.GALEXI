// ─── AgentMarket Client Bridge — Frontend API wrapper ────────────────────────
// پل کلاینت برای تمام عملیات بازار agent — هماهنگ با api/agentMarket.ts

export type OfferType = 'knowledge' | 'resource' | 'skill' | 'token';
export type OfferStatus = 'open' | 'fulfilled' | 'cancelled';

export interface MarketOffer {
  id: string;
  sellerAgentId: string;
  sellerPlanetId: string;
  offerType: OfferType;
  item: string;
  priceQ: number;
  quantity: number;
  status: OfferStatus;
  createdAt: number;
}

export interface MarketTrade {
  id: string;
  offerId: string;
  buyerAgentId: string;
  buyerPlanetId: string;
  sellerAgentId: string;
  priceQ: number;
  quantity: number;
  timestamp: number;
}

export interface MarketStats {
  openOffers: number;
  totalTrades: number;
  volumeQ: number;
}

const API_BASE = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_Q_API_URL
) ? import.meta.env.VITE_Q_API_URL : 'http://localhost:3001/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export async function listMarketOffers(filters?: {
  planetId?: string;
  offerType?: OfferType;
  agentId?: string;
  status?: OfferStatus;
}): Promise<MarketOffer[]> {
  const params = new URLSearchParams();
  if (filters?.planetId)  params.set('planetId',  filters.planetId);
  if (filters?.offerType) params.set('offerType', filters.offerType);
  if (filters?.agentId)   params.set('agentId',   filters.agentId);
  if (filters?.status)    params.set('status',     filters.status);
  const qs = params.toString();
  return apiFetch<MarketOffer[]>(`/market/offers${qs ? `?${qs}` : ''}`);
}

export async function postMarketOffer(
  sellerAgentId: string,
  sellerPlanetId: string,
  offerType: OfferType,
  item: string,
  priceQ: number,
  quantity: number,
): Promise<MarketOffer> {
  return apiFetch<MarketOffer>('/market/offers', {
    method: 'POST',
    body: JSON.stringify({ sellerAgentId, sellerPlanetId, offerType, item, priceQ, quantity }),
  });
}

export async function buyMarketOffer(
  offerId: string,
  buyerAgentId: string,
  buyerPlanetId: string,
): Promise<{ success: boolean; trade?: MarketTrade }> {
  return apiFetch<{ success: boolean; trade?: MarketTrade }>(
    `/market/offers/${encodeURIComponent(offerId)}/fulfill`,
    {
      method: 'POST',
      body: JSON.stringify({ buyerAgentId, buyerPlanetId }),
    },
  );
}

export async function cancelMarketOffer(
  offerId: string,
  agentId: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/market/offers/${encodeURIComponent(offerId)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ agentId }),
    },
  );
}

export async function getMarketTrades(agentId?: string, limit = 20): Promise<MarketTrade[]> {
  const params = new URLSearchParams();
  if (agentId) params.set('agentId', agentId);
  params.set('limit', String(limit));
  return apiFetch<MarketTrade[]>(`/market/trades?${params.toString()}`);
}

export async function getMarketStats(): Promise<MarketStats> {
  return apiFetch<MarketStats>('/market/stats');
}

// ─── Memory Insight bridge ────────────────────────────────────────────────────
export interface Insight {
  type: 'trend' | 'risk' | 'opportunity' | 'action';
  message: string;
  score: number;
  suggestedAction?: string;
  affectedPlanetId?: string;
  timestamp: number;
}

export interface EcosystemHealth {
  score: number;
  label: string;
  summary: string;
}

export async function getMemoryInsights(): Promise<Insight[]> {
  return apiFetch<Insight[]>('/memory/insights');
}

export async function getEcosystemHealth(): Promise<EcosystemHealth> {
  return apiFetch<EcosystemHealth>('/memory/health');
}
