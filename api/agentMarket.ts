// ─── Agent Market — Faz C: Agent-to-Agent Interaction ────────────────────────
// بازار داخلی: agent ها می‌توانند با یکدیگر تجارت کنند
import { randomUUID } from 'crypto';

export type OfferType = 'knowledge' | 'resource' | 'skill' | 'token';

export interface MarketOffer {
  id: string;
  sellerAgentId: string;
  sellerPlanetId: string;
  offerType: OfferType;
  item: string;            // نام کالا/مهارت/دانش
  priceQ: number;          // قیمت به Q token
  quantity: number;
  status: 'open' | 'fulfilled' | 'cancelled';
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

const offers = new Map<string, MarketOffer>();
const trades: MarketTrade[] = [];

// ─── Post offer ───────────────────────────────────────────────────────────────
export function postOffer(
  sellerAgentId: string,
  sellerPlanetId: string,
  offerType: OfferType,
  item: string,
  priceQ: number,
  quantity: number,
): MarketOffer {
  // validation
  if (!item.trim()) throw new Error('نام کالا الزامی است');
  if (priceQ < 1 || priceQ > 10_000) throw new Error('قیمت باید بین ۱ و ۱۰۰۰۰ باشد');
  if (quantity < 1 || quantity > 1_000) throw new Error('مقدار باید بین ۱ و ۱۰۰۰ باشد');

  const offer: MarketOffer = {
    id: randomUUID(),
    sellerAgentId, sellerPlanetId, offerType,
    item: item.trim().slice(0, 100), priceQ, quantity,
    status: 'open', createdAt: Date.now(),
  };
  offers.set(offer.id, offer);
  return offer;
}

// ─── List offers ──────────────────────────────────────────────────────────────
export function listOffers(filters?: {
  planetId?: string;
  offerType?: string;
  status?: string;
  agentId?: string;
}): MarketOffer[] {
  const statusFilter = filters?.status ?? 'open';
  let result = Array.from(offers.values()).filter(o => o.status === statusFilter);
  if (filters?.planetId)  result = result.filter(o => o.sellerPlanetId === filters.planetId);
  if (filters?.offerType) result = result.filter(o => o.offerType === filters.offerType);
  if (filters?.agentId)   result = result.filter(o => o.sellerAgentId === filters.agentId);
  return result.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
}

// ─── Fulfill offer (buy) ──────────────────────────────────────────────────────
export function fulfillOffer(
  offerId: string,
  buyerAgentId: string,
  buyerPlanetId: string,
): { success: boolean; trade?: MarketTrade; error?: string } {
  const offer = offers.get(offerId);
  if (!offer) return { success: false, error: 'پیشنهاد پیدا نشد' };
  if (offer.status !== 'open') return { success: false, error: 'پیشنهاد دیگر فعال نیست' };
  if (offer.sellerAgentId === buyerAgentId) return { success: false, error: 'نمی‌توانید از خودتان خرید کنید' };

  offer.status = 'fulfilled';
  const trade: MarketTrade = {
    id: randomUUID(),
    offerId, buyerAgentId, buyerPlanetId,
    sellerAgentId: offer.sellerAgentId,
    priceQ: offer.priceQ, quantity: offer.quantity,
    timestamp: Date.now(),
  };
  trades.push(trade);
  if (trades.length > 1_000) trades.shift();
  return { success: true, trade };
}

// ─── Cancel offer ─────────────────────────────────────────────────────────────
export function cancelOffer(
  offerId: string,
  agentId: string,
): { success: boolean; error?: string } {
  const offer = offers.get(offerId);
  if (!offer) return { success: false, error: 'پیدا نشد' };
  if (offer.sellerAgentId !== agentId) return { success: false, error: 'فقط فروشنده می‌تواند لغو کند' };
  if (offer.status !== 'open') return { success: false, error: 'پیشنهاد دیگر قابل لغو نیست' };
  offer.status = 'cancelled';
  return { success: true };
}

// ─── Trade history ────────────────────────────────────────────────────────────
export function getTradeHistory(agentId?: string, limit = 20): MarketTrade[] {
  let result = trades;
  if (agentId) {
    result = trades.filter(
      t => t.buyerAgentId === agentId || t.sellerAgentId === agentId,
    );
  }
  return result.slice(-limit).reverse();
}

// ─── Market stats ─────────────────────────────────────────────────────────────
export function getMarketStats(): { openOffers: number; totalTrades: number; volumeQ: number } {
  const open = Array.from(offers.values()).filter(o => o.status === 'open').length;
  const volumeQ = trades.reduce((sum, t) => sum + t.priceQ * t.quantity, 0);
  return { openOffers: open, totalTrades: trades.length, volumeQ };
}
