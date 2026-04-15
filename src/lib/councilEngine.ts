/**
 * Council Consensus Engine (شورای ۱۲ نفره)
 * ──────────────────────────────────────────
 * Simulates 12-member council deliberation.
 * When Lovable Cloud is enabled, connects to real AI.
 */

export interface CouncilMember {
  id: string;
  name: string;
  nameFa: string;
  role: string;
  icon: string;
}

export interface CouncilVote {
  member: CouncilMember;
  status: "APPROVED" | "REVIEWING" | "CONCERN";
  contribution: string;
}

export interface ConsensusResult {
  votes: CouncilVote[];
  finalResponse: string;
  confidence: number;
  timestamp: number;
}

export const COUNCIL_MEMBERS: CouncilMember[] = [
  { id: "architect",    name: "Architect",     nameFa: "معمار",       role: "System Design",      icon: "🏗️" },
  { id: "sentinel",     name: "Sentinel",      nameFa: "نگهبان",      role: "Security",           icon: "🛡️" },
  { id: "visionary",    name: "Visionary",     nameFa: "آینده‌نگر",    role: "Strategy",           icon: "🔮" },
  { id: "analyst",      name: "Analyst",       nameFa: "تحلیلگر",     role: "Data Analysis",      icon: "📊" },
  { id: "defender",     name: "Defender",      nameFa: "مدافع",       role: "Risk Management",    icon: "⚔️" },
  { id: "localist",     name: "Localist",      nameFa: "بومی‌ساز",    role: "Localization",       icon: "🌍" },
  { id: "cryptographer",name: "Cryptographer", nameFa: "رمزنگار",     role: "Encryption",         icon: "🔐" },
  { id: "automator",    name: "Automator",     nameFa: "اتوماتور",    role: "Automation",         icon: "⚙️" },
  { id: "orchestrator", name: "Orchestrator",  nameFa: "هماهنگ‌کننده", role: "Integration",        icon: "🎯" },
  { id: "critic",       name: "Critic",        nameFa: "ناقد",        role: "Quality Assurance",  icon: "🧪" },
  { id: "guardian",     name: "Guardian",      nameFa: "محافظ",       role: "Ethics & Safety",    icon: "👁️" },
  { id: "sovereign",    name: "Sovereign",     nameFa: "حاکم",        role: "Final Authority",    icon: "👑" },
];

/**
 * Process command through 12-member council consensus.
 * Currently offline simulation. Will connect to Lovable AI when Cloud is enabled.
 */
export async function processCouncilCommand(input: string): Promise<ConsensusResult> {
  // Simulate deliberation delay
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

  const keywords = input.toLowerCase();
  
  const votes: CouncilVote[] = COUNCIL_MEMBERS.map(member => {
    let contribution: string;
    let status: "APPROVED" | "REVIEWING" | "CONCERN" = "APPROVED";

    switch (member.id) {
      case "sentinel":
        contribution = keywords.includes("امنیت") || keywords.includes("security")
          ? "لایه‌های امنیتی بررسی شد. پروتکل Zero-Trust فعال."
          : "اسکن امنیتی انجام شد. تهدیدی شناسایی نشد.";
        break;
      case "architect":
        contribution = "ساختار سیستم با درخواست سازگار است. معماری تایید شد.";
        break;
      case "visionary":
        contribution = "این حرکت با چشم‌انداز بلندمدت امپراتوری هم‌راستاست.";
        break;
      case "analyst":
        contribution = `تحلیل داده‌ها نشان می‌دهد این عملیات ${Math.floor(70 + Math.random() * 25)}% احتمال موفقیت دارد.`;
        break;
      case "critic":
        if (keywords.includes("خطر") || keywords.includes("risk")) {
          status = "CONCERN";
          contribution = "هشدار: ریسک‌های احتمالی شناسایی شد. بررسی بیشتر لازم است.";
        } else {
          contribution = "کیفیت مورد تایید است. استانداردها رعایت شده.";
        }
        break;
      case "sovereign":
        contribution = "با اجماع شورا، دستور اجرا صادر می‌شود.";
        break;
      default:
        contribution = `تحلیل ${member.nameFa} در حوزه ${member.role} اعمال شد.`;
    }

    return { member, status, contribution };
  });

  const concerns = votes.filter(v => v.status === "CONCERN").length;
  const confidence = Math.max(60, 100 - concerns * 15);

  const finalResponse = `فرمانده، شورای ۱۲ نفره با ${concerns === 0 ? "اجماع کامل" : `${12 - concerns} رأی موافق`} دستور «${input.slice(0, 50)}${input.length > 50 ? "..." : ""}» را بررسی کرد.\n\nنتیجه: عملیات در هسته مرکزی تحلیل شد. ${concerns > 0 ? "⚠️ نگرانی‌هایی وجود دارد." : "✅ تمام بخش‌ها سبز هستند."}\n\nامنیت: ${confidence}% | پایداری: ${concerns === 0 ? "سبز" : "زرد"} | رمز چرخشی: فعال`;

  return {
    votes,
    finalResponse,
    confidence,
    timestamp: Date.now(),
  };
}
