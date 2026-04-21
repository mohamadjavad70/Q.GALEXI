// ─── Memory Intelligence — Memory → Insight → Action ─────────────────────────
// تبدیل حافظه خام به تصمیم هوشمند
import { GlobalMemoryMesh, MemoryNode } from './GlobalMemoryMesh.js';
import { evaluateAndApply, EconomyState } from './governanceEngine.js';

export type InsightType = 'trend' | 'risk' | 'opportunity' | 'action';

export interface Insight {
  type: InsightType;
  message: string;
  score: number;          // 0–1
  suggestedAction?: string;
  affectedPlanetId?: string;
  timestamp: number;
}

// ─── تحلیل حافظه جهانی ────────────────────────────────────────────────────────
export function analyzeMemory(memory: GlobalMemoryMesh): Insight[] {
  const nodes = memory.toJSON();
  const total = nodes.length;
  const insights: Insight[] = [];
  const now = Date.now();

  if (total === 0) {
    insights.push({
      type: 'opportunity',
      message: 'حافظه جهانی خالی است — فعالیت اولیه پیشنهاد می‌شود',
      score: 1,
      suggestedAction: 'boost_reward',
      timestamp: now,
    });
    return insights;
  }

  // ─── ۱. تشخیص روند منفی ──────────────────────────────────────────────────
  const negativeNodes = nodes.filter(m =>
    m.emotion === 'negative' || m.emotion === 'fearful' || m.emotion === 'aggressive',
  );
  const negativeRatio = negativeNodes.length / total;
  if (negativeRatio > 0.4) {
    insights.push({
      type: 'risk',
      message: `روند احساسی منفی بالا: ${(negativeRatio * 100).toFixed(0)}% خاطرات منفی`,
      score: negativeRatio,
      suggestedAction: 'check_agents',
      timestamp: now,
    });
  }

  // ─── ۲. فعال‌ترین سیاره ──────────────────────────────────────────────────
  const planetCount: Record<string, number> = {};
  for (const m of nodes) {
    if (m.planetId) planetCount[m.planetId] = (planetCount[m.planetId] ?? 0) + 1;
  }
  const sortedPlanets = Object.entries(planetCount).sort((a, b) => b[1] - a[1]);
  if (sortedPlanets.length > 0) {
    const [topId, topCount] = sortedPlanets[0];
    insights.push({
      type: 'trend',
      message: `فعال‌ترین سیاره: ${topId} با ${topCount} خاطره`,
      score: Math.min(1, topCount / 100),
      affectedPlanetId: topId,
      timestamp: now,
    });
  }

  // ─── ۳. سیاره کم‌فعال (opportunity) ─────────────────────────────────────
  if (sortedPlanets.length > 1) {
    const [weakId, weakCount] = sortedPlanets[sortedPlanets.length - 1];
    if (weakCount < 5) {
      insights.push({
        type: 'opportunity',
        message: `سیاره ${weakId} با تنها ${weakCount} خاطره ضعیف است — افزایش reward پیشنهاد می‌شود`,
        score: 1 - weakCount / 20,
        suggestedAction: 'boost_reward',
        affectedPlanetId: weakId,
        timestamp: now,
      });
    }
  }

  // ─── ۴. فعالیت کلی پایین ─────────────────────────────────────────────────
  const recentCutoff = now - 60 * 60_000; // ۱ ساعت
  const recentCount  = nodes.filter(m => m.timestamp > recentCutoff).length;
  if (recentCount < 3) {
    insights.push({
      type: 'opportunity',
      message: 'فعالیت پایین در ۱ ساعت گذشته — ضریب پاداش افزایش پیدا کند',
      score: Math.max(0.6, 1 - recentCount / 10),
      suggestedAction: 'boost_reward',
      timestamp: now,
    });
  }

  // ─── ۵. حجم داده بالا ────────────────────────────────────────────────────
  if (total > 5_000) {
    insights.push({
      type: 'risk',
      message: `حافظه بزرگ (${total} گره) — نیاز به pruning یا archive`,
      score: Math.min(1, total / 10_000),
      suggestedAction: 'prune_memory',
      timestamp: now,
    });
  }

  // ─── ۶. Auto-trigger governance اگر action لازم است ─────────────────────
  const boostOpportunities = insights.filter(i => i.suggestedAction === 'boost_reward');
  const hasRisk = insights.some(i => i.type === 'risk' && i.score > 0.5);

  if (boostOpportunities.length >= 2 && !hasRisk) {
    const state: EconomyState = {
      inflation: 0,
      activityLevel: 0.2,  // کم — باعث boost می‌شود
      abuseRate: 0,
      totalSupply: total,
      totalBurned: 0,
    };
    const actions = evaluateAndApply(state);
    if (actions.length > 0) {
      insights.push({
        type: 'action',
        message: `Governance خودکار اعمال شد: ${actions.map(a => a.type).join(', ')}`,
        score: 0.8,
        timestamp: now,
      });
    }
  }

  return insights;
}

// ─── خلاصه وضعیت سلامت اکوسیستم ─────────────────────────────────────────────
export function getEcosystemHealth(
  memory: GlobalMemoryMesh,
): { score: number; label: string; summary: string } {
  const nodes = memory.toJSON();
  if (nodes.length === 0) return { score: 0.5, label: 'نامشخص', summary: 'داده کافی وجود ندارد' };

  const recent = nodes.filter(m => m.timestamp > Date.now() - 24 * 3_600_000);
  const posRatio = recent.filter(m =>
    m.emotion === 'positive' || m.emotion === 'excited' || m.emotion === 'curious',
  ).length / Math.max(1, recent.length);

  const avgImportance = recent.reduce((s, m) => s + m.importance, 0) / Math.max(1, recent.length);
  const activityScore = Math.min(1, recent.length / 100);
  const score = posRatio * 0.4 + (avgImportance / 100) * 0.3 + activityScore * 0.3;

  const label = score > 0.7 ? 'پر رونق' : score > 0.4 ? 'متعادل' : 'نیاز به توجه';
  const summary = `${recent.length} خاطره در ۲۴ ساعت — ${(posRatio * 100).toFixed(0)}% مثبت`;
  return { score: Math.round(score * 100) / 100, label, summary };
}
