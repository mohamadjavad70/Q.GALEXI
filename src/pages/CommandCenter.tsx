import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, Shield, Save, RotateCcw, Activity, FileText,
  Globe2, Radio, Coins, Hammer, Link2, Lock, AlertTriangle,
  Eye, EyeOff, Cpu, Smartphone, Monitor, Mic, ChevronDown, ChevronUp,
} from "lucide-react";
import { getStarRegistry, saveStarRegistry, defaultStarRegistry } from "@/data/starRegistry";
import type { StarConfig } from "@/data/starRegistry";
import { getContentBlocks, saveContentBlocks, defaultContentBlocks } from "@/data/contentBlocks";
import type { ContentBlocks } from "@/data/contentBlocks";
import { getConnectors, saveConnectors, defaultConnectors, type Connector, type PermissionLevel } from "@/data/integrations";
import { getEconomy, saveEconomy, defaultEconomy, type EconomyState, type StarCoin } from "@/data/economy";
import { getLedger, logAction } from "@/lib/geneticHash";
import type { LedgerEntry } from "@/lib/geneticHash";
import { isOwnerUnlocked, unlockOwner, verifyPassphrase } from "@/lib/ownerGate";
import { safeGetJSON, safeSetJSON } from "@/lib/safeParse";
import { ForgeSpecInputSchema } from "@/lib/validation";
import LanguagePicker from "@/components/LanguagePicker";

/* ── Glass card helper ── */
const G = "bg-card/60 backdrop-blur-xl border border-border/20 rounded-lg";

/* ── Permission labels ── */
const permLabels: Record<PermissionLevel, { fa: string; en: string; color: string }> = {
  revoked: { fa: "لغو شده", en: "Revoked", color: "text-destructive" },
  read: { fa: "فقط خواندن", en: "Read Only", color: "text-amber-400" },
  readwrite: { fa: "خواندن و نوشتن", en: "Read+Write", color: "text-emerald-400" },
  auto: { fa: "اتوماتیک (HITL)", en: "Auto (HITL)", color: "text-primary" },
};
const permCycle: PermissionLevel[] = ["revoked", "read", "readwrite", "auto"];

/* ── Category icons ── */
const catIcons: Record<string, React.ReactNode> = {
  social: <Globe2 className="w-3.5 h-3.5 text-primary" />,
  ai: <Cpu className="w-3.5 h-3.5 text-accent" />,
  device: <Mic className="w-3.5 h-3.5 text-emerald-400" />,
  tool: <Monitor className="w-3.5 h-3.5 text-muted-foreground" />,
};
const catLabels: Record<string, string> = {
  social: "شبکه‌های اجتماعی",
  ai: "هوش مصنوعی",
  device: "دستگاه‌ها",
  tool: "ابزارها",
};

/* ── Grouped Ledger ── */
interface GroupedEntry { action: string; starSlug: string; hash: string; count: number; timestamp: number; }
function groupLedger(entries: LedgerEntry[]): GroupedEntry[] {
  const groups: GroupedEntry[] = [];
  const seen = new Map<string, number>();
  for (const e of entries.slice(-30).reverse()) {
    const key = `${e.action}|${e.starSlug}`;
    const idx = seen.get(key);
    if (idx !== undefined) groups[idx].count++;
    else { seen.set(key, groups.length); groups.push({ ...e, count: 1 }); }
  }
  return groups;
}

/* ── Forge Types ── */
interface PlanetSpec {
  id: string;
  name: string;
  ring: "outer" | "inner";
  chakraColor: string;
  provider: string;
  prompt: string;
  createdAt: number;
}

function getForgeSpecs(): PlanetSpec[] {
  return safeGetJSON<PlanetSpec[]>("qmetaram-forge", []);
}
function saveForgeSpecs(specs: PlanetSpec[]) {
  safeSetJSON("qmetaram-forge", specs);
}

/* ════════════════════════════════════════════════════════════
   COMMAND CENTER — Main Component
   ════════════════════════════════════════════════════════════ */
export default function CommandCenter() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isOwnerUnlocked);
  const [pass, setPass] = useState("");

  // Data
  const [registry, setRegistry] = useState<StarConfig[]>([]);
  const [content, setContent] = useState<ContentBlocks>(defaultContentBlocks);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [economy, setEconomy] = useState<EconomyState>(defaultEconomy);
  const [logs, setLogs] = useState<LedgerEntry[]>([]);
  const [forgeSpecs, setForgeSpecs] = useState<PlanetSpec[]>([]);
  const [saved, setSaved] = useState(false);

  // Forge form
  const [forgeName, setForgeName] = useState("");
  const [forgeRing, setForgeRing] = useState<"outer" | "inner">("outer");
  const [forgeColor, setForgeColor] = useState("#00d4ff");
  const [forgeProvider, setForgeProvider] = useState("openai");
  const [forgePrompt, setForgePrompt] = useState("");

  useEffect(() => {
    if (authed) {
      setRegistry(getStarRegistry());
      setContent(getContentBlocks());
      setConnectors(getConnectors());
      setEconomy(getEconomy());
      setLogs(getLedger());
      setForgeSpecs(getForgeSpecs());
    }
  }, [authed]);

  /* ── Auth Gate ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
        <Card className={`${G} w-80`}>
          <CardHeader>
            <CardTitle className="text-foreground text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
              مرکز فرماندهی
              <p className="text-xs text-muted-foreground mt-1">Command Center</p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const valid = await verifyPassphrase(pass);
                  if (valid) { unlockOwner(); setAuthed(true); }
                }
              }}
              placeholder="ورود..."
              className="bg-input text-foreground"
              dir="ltr"
            />
            <Button className="w-full" onClick={async () => {
              const valid = await verifyPassphrase(pass);
              if (valid) { unlockOwner(); setAuthed(true); }
            }}>
              ورود
            </Button>
            <p className="text-xs text-muted-foreground/40 text-center">
              نیاز به احراز هویت سرور — Admin requires server auth
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Handlers ── */
  const updateStar = (idx: number, field: keyof StarConfig, value: string | boolean | string[]) => {
    setRegistry((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
    setSaved(false);
  };

  const updateHomeContent = (field: keyof ContentBlocks["home"], value: string) => {
    setContent((prev) => ({ ...prev, home: { ...prev.home, [field]: value } }));
    setSaved(false);
  };

  const updateStarContent = (slug: string, field: "introFa" | "introEn", value: string) => {
    setContent((prev) => ({
      ...prev,
      stars: { ...prev.stars, [slug]: { ...prev.stars[slug], [field]: value } },
    }));
    setSaved(false);
  };

  const cyclePermission = (id: string) => {
    setConnectors((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const idx = permCycle.indexOf(c.permission);
      return { ...c, permission: permCycle[(idx + 1) % permCycle.length] };
    }));
    setSaved(false);
  };

  const updateCoin = (idx: number, field: keyof StarCoin, value: string | number) => {
    setEconomy((prev) => {
      const coins = [...prev.coins];
      coins[idx] = { ...coins[idx], [field]: value };
      return { ...prev, coins };
    });
    setSaved(false);
  };

  const addForgeSpec = () => {
    const parsed = ForgeSpecInputSchema.safeParse({
      name: forgeName, ring: forgeRing, chakraColor: forgeColor,
      provider: forgeProvider, prompt: forgePrompt,
    });
    if (!parsed.success) return;
    const spec: PlanetSpec = {
      id: `forge-${Date.now()}`,
      name: parsed.data.name!,
      ring: parsed.data.ring!,
      chakraColor: parsed.data.chakraColor!,
      provider: parsed.data.provider!,
      prompt: parsed.data.prompt!,
      createdAt: Date.now(),
    };
    const next = [...forgeSpecs, spec];
    setForgeSpecs(next);
    saveForgeSpecs(next);
    logAction("forge_planet", parsed.data.name);
    setForgeName("");
    setForgePrompt("");
  };

  const publish = () => {
    saveStarRegistry(registry);
    saveContentBlocks(content);
    saveConnectors(connectors);
    saveEconomy(economy);
    logAction("command_publish", "system");
    setSaved(true);
  };

  const rollback = () => {
    setRegistry(defaultStarRegistry);
    setContent(defaultContentBlocks);
    setConnectors(defaultConnectors);
    setEconomy(defaultEconomy);
    saveStarRegistry(defaultStarRegistry);
    saveContentBlocks(defaultContentBlocks);
    saveConnectors(defaultConnectors);
    saveEconomy(defaultEconomy);
    setSaved(true);
  };

  const groupedLogs = groupLedger(logs);
  const connectorsByCategory = ["social", "ai", "device", "tool"].map((cat) => ({
    category: cat,
    items: connectors.filter((c) => c.category === cat),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background p-4 md:p-6"
      dir="rtl"
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-foreground">
            <ArrowRight className="w-4 h-4" /> کهکشان
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2 justify-center">
              <Shield className="w-4 h-4 text-primary" />
              مرکز فرماندهی
            </h1>
            <p className="text-[10px] text-muted-foreground">Command Center — Owner Only</p>
          </div>
          <div className="flex gap-2 items-center">
            <LanguagePicker compact />
            <Button size="sm" onClick={publish} className="gap-1 text-xs">
              <Save className="w-3 h-3" /> ذخیره
            </Button>
            <Button size="sm" variant="outline" onClick={rollback} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" /> بازگشت
            </Button>
          </div>
        </div>

        {saved && <Badge variant="default" className="text-xs">✅ ذخیره شد</Badge>}

        {/* ── Tabs ── */}
        <Tabs defaultValue="ops" dir="rtl">
          <TabsList className="bg-secondary/50 flex flex-wrap gap-0.5 h-auto p-1">
            <TabsTrigger value="ops" className="text-xs gap-1"><Activity className="w-3 h-3" /> وضعیت</TabsTrigger>
            <TabsTrigger value="stars" className="text-xs gap-1"><Radio className="w-3 h-3" /> ستاره‌ها</TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs gap-1"><Link2 className="w-3 h-3" /> اتصالات</TabsTrigger>
            <TabsTrigger value="economy" className="text-xs gap-1"><Coins className="w-3 h-3" /> اقتصاد</TabsTrigger>
            <TabsTrigger value="forge" className="text-xs gap-1"><Hammer className="w-3 h-3" /> ساخت</TabsTrigger>
            <TabsTrigger value="content" className="text-xs gap-1"><FileText className="w-3 h-3" /> محتوا</TabsTrigger>
          </TabsList>

          {/* ══════════ TAB 1: OPS ══════════ */}
          <TabsContent value="ops" className="space-y-3 mt-4">
            {/* Galaxy Status */}
            <Card className={G}>
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" /> وضعیت کهکشان
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[8px]">● آنلاین</Badge>
                  <Badge variant="outline" className="text-[8px]">دمو</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>ستاره‌های فعال: {registry.filter((s) => s.enabledTools.length > 0).length} / {registry.length}</p>
                <p>کل فعالیت‌ها: {logs.length} عمل</p>
                <p>اتصالات فعال: {connectors.filter((c) => c.permission !== "revoked").length} / {connectors.length}</p>
              </CardContent>
            </Card>

            {/* Recent Signals (grouped) */}
            <Card className={G}>
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> سیگنال‌ها — Genetic Ledger
                </CardTitle>
              </CardHeader>
              <CardContent>
                {groupedLogs.length === 0 ? (
                  <p className="text-muted-foreground text-xs">هنوز سیگنالی ثبت نشده</p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {groupedLogs.map((g, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] p-1.5 bg-secondary/20 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{g.action}</span>
                          {g.count > 1 && <span className="text-primary/50">×{g.count}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{g.starSlug}</span>
                          <Badge variant="outline" className="font-mono text-[8px] px-1 border-border/20">
                            🧬 {g.hash.slice(0, 6)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB 2: STARS ══════════ */}
          <TabsContent value="stars" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">رجیستری ستارگان ({registry.length} نود)</p>
            {registry.map((star, i) => (
              <Card key={star.slug} className={G}>
                <CardContent className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">نام فارسی</label>
                    <Input value={star.displayNameFa} onChange={(e) => updateStar(i, "displayNameFa", e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="rtl" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Name EN</label>
                    <Input value={star.displayNameEn} onChange={(e) => updateStar(i, "displayNameEn", e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">مأموریت</label>
                    <Input value={star.missionFa} onChange={(e) => updateStar(i, "missionFa", e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="rtl" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Mission EN</label>
                    <Input value={star.missionEn} onChange={(e) => updateStar(i, "missionEn", e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="ltr" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">چاکرا</label>
                      <div className="flex items-center gap-1">
                        <input type="color" value={star.chakraColor} onChange={(e) => updateStar(i, "chakraColor", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer" />
                        <span className="text-[8px] text-muted-foreground font-mono">{star.chakraColor}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">صدا</label>
                    <Button size="sm" variant={star.ambientSound ? "default" : "outline"} className="w-full text-[10px] h-6"
                      onClick={() => updateStar(i, "ambientSound", !star.ambientSound)}>
                      {star.ambientSound ? "فعال" : "غیرفعال"}
                    </Button>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">پازل</label>
                    <Button size="sm" variant={star.puzzleMode ? "default" : "outline"} className="w-full text-[10px] h-6"
                      onClick={() => updateStar(i, "puzzleMode", !star.puzzleMode)}>
                      {star.puzzleMode ? "فعال" : "غیرفعال"}
                    </Button>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">ابزارها</label>
                    <Input value={star.enabledTools.join(", ")}
                      onChange={(e) => updateStar(i, "enabledTools", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                      className="bg-input/30 text-foreground text-[10px] h-6 font-mono" dir="ltr" placeholder="tool1, tool2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ══════════ TAB 3: INTEGRATIONS ══════════ */}
          <TabsContent value="integrations" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-lg border border-accent/20">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <p className="text-xs text-accent">حالت اتوماتیک = HITL — هر عمل نیاز به تأیید فرمانده دارد</p>
            </div>

            {connectorsByCategory.map(({ category, items }) => (
              <Card key={category} className={G}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm flex items-center gap-2">
                    {catIcons[category]} {catLabels[category]}
                    <span className="text-[10px] text-muted-foreground">{items.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {items.map((conn) => {
                    const perm = permLabels[conn.permission];
                    return (
                      <div key={conn.id} className="flex items-center justify-between p-2 bg-secondary/15 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{conn.icon}</span>
                          <div>
                            <span className="text-foreground text-xs font-medium">{conn.nameFa}</span>
                            <span className="text-muted-foreground text-[10px] mr-1">{conn.nameEn}</span>
                          </div>
                          {conn.placeholder && (
                            <Badge variant="outline" className="text-[7px] border-border/20 text-muted-foreground/40">
                              نیاز به سرور
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => cyclePermission(conn.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${perm.color} border-current/20 hover:opacity-80`}
                        >
                          {perm.fa}
                        </button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ══════════ TAB 4: ECONOMY ══════════ */}
          <TabsContent value="economy" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Coins className="w-4 h-4 text-primary" />
              <p className="text-xs text-primary">بازار داخلی اعتبارات — OFF-CHAIN Demo</p>
            </div>

            {/* Revenue Widgets */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "اشتراک‌ها", key: "subscriptions" as const, icon: "📊" },
                { label: "VIP", key: "vip" as const, icon: "👑" },
                { label: "ابزار", key: "toolUnlocks" as const, icon: "🔓" },
              ].map(({ label, key, icon }) => (
                <Card key={key} className={`${G} text-center p-3`}>
                  <span className="text-lg">{icon}</span>
                  <p className="text-foreground font-bold text-sm">{economy.revenueDemo[key]}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </Card>
              ))}
            </div>

            {/* VIP Counter */}
            <Card className={G}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-foreground text-xs">👑 VIP ماهانه (Top 1000)</span>
                <Input type="number" value={economy.vipCount} className="w-20 bg-input/30 text-foreground text-xs h-6 text-center"
                  onChange={(e) => { setEconomy((p) => ({ ...p, vipCount: Number(e.target.value) })); setSaved(false); }} />
              </CardContent>
            </Card>

            {/* Coins Table */}
            <Card className={G}>
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm">سکه‌ها — 11 Star Coins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/10">
                        <th className="text-right p-1">تیکر</th>
                        <th className="text-right p-1">نام</th>
                        <th className="text-center p-1">قیمت</th>
                        <th className="text-center p-1">عرضه</th>
                        <th className="text-right p-1">کاربرد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {economy.coins.map((coin, i) => (
                        <tr key={coin.ticker} className="border-b border-border/5 hover:bg-secondary/10">
                          <td className="p-1 font-mono text-primary">{coin.ticker}</td>
                          <td className="p-1 text-foreground">{coin.nameFa}</td>
                          <td className="p-1 text-center">
                            <Input type="number" value={coin.price} className="w-14 bg-input/20 text-foreground text-[10px] h-5 text-center inline-block"
                              onChange={(e) => updateCoin(i, "price", Number(e.target.value))} />
                          </td>
                          <td className="p-1 text-center">
                            <Input type="number" value={coin.supply} className="w-16 bg-input/20 text-foreground text-[10px] h-5 text-center inline-block"
                              onChange={(e) => updateCoin(i, "supply", Number(e.target.value))} />
                          </td>
                          <td className="p-1 text-muted-foreground">{coin.utilities}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB 5: FORGE ══════════ */}
          <TabsContent value="forge" className="space-y-4 mt-4">
            <Card className={G}>
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-accent" /> ساخت سیاره جدید — Planet Forge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">نام سیاره</label>
                    <Input value={forgeName} onChange={(e) => setForgeName(e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="rtl" placeholder="نام..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">حلقه</label>
                    <div className="flex gap-1">
                      <Button size="sm" variant={forgeRing === "outer" ? "default" : "outline"} className="flex-1 text-[10px] h-7"
                        onClick={() => setForgeRing("outer")}>بیرونی</Button>
                      <Button size="sm" variant={forgeRing === "inner" ? "default" : "outline"} className="flex-1 text-[10px] h-7"
                        onClick={() => setForgeRing("inner")}>درونی</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">رنگ چاکرا</label>
                    <div className="flex items-center gap-1">
                      <input type="color" value={forgeColor} onChange={(e) => setForgeColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer" />
                      <span className="text-[8px] text-muted-foreground font-mono">{forgeColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">AI Provider</label>
                    <Input value={forgeProvider} onChange={(e) => setForgeProvider(e.target.value)}
                      className="bg-input/30 text-foreground text-xs h-7" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">پرامپت ساخت</label>
                  <Textarea value={forgePrompt} onChange={(e) => setForgePrompt(e.target.value)}
                    className="bg-input/30 text-foreground text-xs min-h-[60px]" dir="rtl" placeholder="توصیف سیاره..." />
                </div>
                <Button onClick={addForgeSpec} className="w-full text-xs gap-1">
                  <Hammer className="w-3 h-3" /> ساخت سیاره
                </Button>
              </CardContent>
            </Card>

            {/* Existing forge specs */}
            {forgeSpecs.length > 0 && (
              <Card className={G}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground text-sm">سیارات ساخته‌شده ({forgeSpecs.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {forgeSpecs.map((spec) => (
                    <div key={spec.id} className="flex items-center justify-between p-2 bg-secondary/15 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: spec.chakraColor }} />
                        <span className="text-foreground font-medium">{spec.name}</span>
                        <Badge variant="outline" className="text-[8px]">{spec.ring}</Badge>
                        <Badge variant="outline" className="text-[8px]">{spec.provider}</Badge>
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(spec.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════ TAB 6: CONTENT ══════════ */}
          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Home Page */}
            <Card className={G}>
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> صفحه اصلی — Home
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">عنوان انگلیسی</label>
                  <Input value={content.home.titleEn} onChange={(e) => updateHomeContent("titleEn", e.target.value)}
                    className="bg-input/30 text-foreground text-xs h-7" dir="ltr" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">زیرعنوان فارسی</label>
                  <Input value={content.home.subtitleFa} onChange={(e) => updateHomeContent("subtitleFa", e.target.value)}
                    className="bg-input/30 text-foreground text-xs h-7" dir="rtl" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">زیرعنوان انگلیسی</label>
                  <Input value={content.home.subtitleEn} onChange={(e) => updateHomeContent("subtitleEn", e.target.value)}
                    className="bg-input/30 text-foreground text-xs h-7" dir="ltr" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">متن دعوت (CTA)</label>
                  <Input value={content.home.cta} onChange={(e) => updateHomeContent("cta", e.target.value)}
                    className="bg-input/30 text-foreground text-xs h-7" dir="rtl" />
                </div>
              </CardContent>
            </Card>

            {/* Star Intros */}
            {Object.entries(content.stars).map(([slug, intro]) => {
              const star = registry.find((s) => s.slug === slug);
              return (
                <Card key={slug} className={G}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: star?.chakraColor || "#888" }} />
                      {star?.displayNameFa || slug} — {star?.displayNameEn || slug}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">معرفی فارسی</label>
                      <Textarea value={intro.introFa} onChange={(e) => updateStarContent(slug, "introFa", e.target.value)}
                        className="bg-input/30 text-foreground text-xs min-h-[50px]" dir="rtl" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">English Intro</label>
                      <Textarea value={intro.introEn} onChange={(e) => updateStarContent(slug, "introEn", e.target.value)}
                        className="bg-input/30 text-foreground text-xs min-h-[50px]" dir="ltr" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
}
