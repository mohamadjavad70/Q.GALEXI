import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, GitFork, BookOpen, X } from "lucide-react";
import type { PlanetSeed } from "@/components/solarsystem/UserPlanetOrb";
import { addPlanetSeed, supportSeed, forkSeed, addRecord, getPlanetSeeds } from "@/lib/planetSeeds";
import { logAction } from "@/lib/geneticHash";
import { PlanetSeedInputSchema, PlanetRecordInputSchema } from "@/lib/validation";

/**
 * PlanetSeedPanel — UI to create, view, support, and fork planet seeds.
 */

const categories = ["علم", "هنر", "فلسفه", "فناوری", "اجتماعی"];
const defaultColors = ["#00d4ff", "#00ff41", "#ff6b9d", "#ffd700", "#ff8c00", "#8888aa", "#aa44ff"];

interface PlanetSeedPanelProps {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  selectedSeed: PlanetSeed | null;
  onRequestGate: () => void;
  gateCleared: boolean;
}

export default function PlanetSeedPanel({
  open, onClose, onRefresh, selectedSeed, onRequestGate, gateCleared,
}: PlanetSeedPanelProps) {
  const [mode, setMode] = useState<"list" | "create" | "detail" | "record">("list");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [color, setColor] = useState(defaultColors[0]);
  const [recTitle, setRecTitle] = useState("");
  const [recDesc, setRecDesc] = useState("");
  const [recPrompt, setRecPrompt] = useState("");

  const seeds = getPlanetSeeds();
  const viewing = selectedSeed || (mode === "detail" ? seeds[0] : null);

  const handleCreate = async () => {
    if (!gateCleared) { onRequestGate(); return; }
    const parsed = PlanetSeedInputSchema.safeParse({ name, prompt, category, chakraColor: color });
    if (!parsed.success) return;
    addPlanetSeed({ name: parsed.data.name, prompt: parsed.data.prompt, category: parsed.data.category, chakraColor: parsed.data.chakraColor });
    await logAction("create-planet", parsed.data.name);
    setName(""); setPrompt("");
    setMode("list");
    onRefresh();
  };

  const handleSupport = async (seed: PlanetSeed) => {
    supportSeed(seed.id);
    await logAction("support-planet", seed.name);
    onRefresh();
  };

  const handleFork = async (seed: PlanetSeed) => {
    if (!gateCleared) { onRequestGate(); return; }
    forkSeed(seed.id);
    await logAction("fork-planet", seed.name);
    onRefresh();
  };

  const handlePublishRecord = async (seed: PlanetSeed) => {
    const parsed = PlanetRecordInputSchema.safeParse({ title: recTitle, description: recDesc, promptSnippet: recPrompt });
    if (!parsed.success) return;
    addRecord(seed.id, { title: parsed.data.title, description: parsed.data.description, promptSnippet: parsed.data.promptSnippet });
    await logAction("publish-record", seed.name);
    setRecTitle(""); setRecDesc(""); setRecPrompt("");
    setMode("detail");
    onRefresh();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute bottom-20 right-4 z-30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Card className="w-72 bg-card/95 backdrop-blur-md border-border max-h-[60vh] overflow-hidden flex flex-col">
            <CardContent className="p-3 space-y-2 overflow-y-auto flex-1" dir="rtl">
              <div className="flex items-center justify-between">
                <p className="text-foreground text-sm font-bold">سیاره‌های کاربران</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              {mode === "list" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => setMode("create")}
                  >
                    <Plus className="w-3 h-3" /> ساخت سیاره جدید
                  </Button>

                  {seeds.length === 0 && (
                    <p className="text-muted-foreground text-xs text-center py-2">هنوز سیاره‌ای ساخته نشده</p>
                  )}

                  {seeds.map((s) => (
                    <div
                      key={s.id}
                      className="p-2 bg-secondary/30 rounded-lg space-y-1 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => { setMode("detail"); }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.chakraColor }} />
                        <span className="text-foreground text-xs font-medium">{s.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">{s.category}</Badge>
                      </div>
                      <div className="flex gap-3 text-[9px] text-muted-foreground">
                        <span>❤️ {s.supports}</span>
                        <span>🔀 {s.forks}</span>
                        <span>📄 {s.records.length}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={(e) => { e.stopPropagation(); handleSupport(s); }}>
                          <Heart className="w-2.5 h-2.5 ml-0.5" /> حمایت
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={(e) => { e.stopPropagation(); handleFork(s); }}>
                          <GitFork className="w-2.5 h-2.5 ml-0.5" /> فورک
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={(e) => { e.stopPropagation(); setMode("record"); }}>
                          <BookOpen className="w-2.5 h-2.5 ml-0.5" /> انتشار
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {mode === "create" && (
                <div className="space-y-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام سیاره" className="text-xs bg-input text-foreground" dir="rtl" maxLength={40} />
                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="پرامپت / ایده" className="text-xs bg-input text-foreground h-16 resize-none" dir="rtl" maxLength={200} />
                  <div className="flex gap-1 flex-wrap">
                    {categories.map((c) => (
                      <Badge
                        key={c}
                        variant={category === c ? "default" : "outline"}
                        className="cursor-pointer text-[9px]"
                        onClick={() => setCategory(c)}
                      >{c}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {defaultColors.map((c) => (
                      <button
                        key={c}
                        className={`w-5 h-5 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs" onClick={handleCreate}>ساخت</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setMode("list")}>بازگشت</Button>
                  </div>
                </div>
              )}

              {mode === "record" && viewing && (
                <div className="space-y-2">
                  <p className="text-xs text-foreground font-medium">انتشار رکورد برای: {viewing.name}</p>
                  <Input value={recTitle} onChange={(e) => setRecTitle(e.target.value)} placeholder="عنوان" className="text-xs bg-input text-foreground" dir="rtl" maxLength={60} />
                  <Textarea value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder="توضیحات" className="text-xs bg-input text-foreground h-14 resize-none" dir="rtl" maxLength={200} />
                  <Input value={recPrompt} onChange={(e) => setRecPrompt(e.target.value)} placeholder="قطعه پرامپت" className="text-xs bg-input text-foreground" dir="rtl" maxLength={100} />
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs" onClick={() => handlePublishRecord(viewing)}>انتشار</Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setMode("list")}>بازگشت</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
