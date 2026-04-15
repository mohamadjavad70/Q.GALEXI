/**
 * QMETARAM Internal Economy (OFF-CHAIN Demo)
 * ───────────────────────────────────────────
 * 11 star coins with demo pricing. No real crypto.
 * Managed via Command Center → Economy tab.
 */

import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";

export interface StarCoin {
  starSlug: string;
  ticker: string;
  nameFa: string;
  nameEn: string;
  price: number;       // demo credits
  supply: number;
  utilities: string;   // what it unlocks
}

export interface EconomyState {
  coins: StarCoin[];
  vipCount: number;         // top 1000 monthly
  revenueDemo: {
    subscriptions: number;
    vip: number;
    toolUnlocks: number;
  };
}

export const defaultEconomy: EconomyState = {
  coins: [
    { starSlug: "tesla", ticker: "TSL", nameFa: "تسلاکوین", nameEn: "TeslaCoin", price: 120, supply: 10000, utilities: "Blueprint tool access" },
    { starSlug: "matrix", ticker: "MTX", nameFa: "ماتریکس‌کوین", nameEn: "MatrixCoin", price: 95, supply: 15000, utilities: "Decode reality tools" },
    { starSlug: "molana", ticker: "MLN", nameFa: "مولاناکوین", nameEn: "MolanaCoin", price: 80, supply: 12000, utilities: "Emotion lens premium" },
    { starSlug: "davinci", ticker: "DVC", nameFa: "داوینچی‌کوین", nameEn: "DaVinciCoin", price: 150, supply: 7000, utilities: "Puzzle VIP levels" },
    { starSlug: "beethoven", ticker: "BTH", nameFa: "بتهوون‌کوین", nameEn: "BeethovenCoin", price: 110, supply: 9000, utilities: "Melody export HD" },
    { starSlug: "nebula", ticker: "NBL", nameFa: "سحابی‌کوین", nameEn: "NebulaCoin", price: 45, supply: 20000, utilities: "Coming soon" },
    { starSlug: "aurora", ticker: "AUR", nameFa: "شفق‌کوین", nameEn: "AuroraCoin", price: 50, supply: 18000, utilities: "Coming soon" },
    { starSlug: "star8", ticker: "S8X", nameFa: "ستاره‌۸", nameEn: "Star8", price: 30, supply: 25000, utilities: "Reserved" },
    { starSlug: "star9", ticker: "S9X", nameFa: "ستاره‌۹", nameEn: "Star9", price: 30, supply: 25000, utilities: "Reserved" },
    { starSlug: "star10", ticker: "S10", nameFa: "ستاره‌۱۰", nameEn: "Star10", price: 30, supply: 25000, utilities: "Reserved" },
    { starSlug: "star11", ticker: "S11", nameFa: "ستاره‌۱۱", nameEn: "Star11", price: 30, supply: 25000, utilities: "Reserved" },
  ],
  vipCount: 0,
  revenueDemo: {
    subscriptions: 0,
    vip: 0,
    toolUnlocks: 0,
  },
};

const STORAGE_KEY = "qmetaram-economy";

export function getEconomy(): EconomyState {
  return safeGetJSON(STORAGE_KEY, defaultEconomy);
}

export function saveEconomy(state: EconomyState) {
  safeSetJSON(STORAGE_KEY, state);
}
