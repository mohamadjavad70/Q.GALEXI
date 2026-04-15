import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Activity, Radio, Trophy, Globe2 } from "lucide-react";
import { getStarRegistry } from "@/data/starRegistry";
import { getLedger } from "@/lib/geneticHash";
import GolGolab from "@/components/GolGolab";
import SunCoreChat from "@/components/SunCoreChat";
import LanguagePicker from "@/components/LanguagePicker";

export default function Command() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const stars = getStarRegistry();
  const ledger = getLedger();
  const lastEntry = ledger.length > 0 ? ledger[ledger.length - 1] : null;

  // Derive rankings from ledger action counts per star
  const actionCounts: Record<string, number> = {};
  ledger.forEach((e) => {
    actionCounts[e.starSlug] = (actionCounts[e.starSlug] || 0) + 1;
  });
  const rankings = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const glassCard = "bg-card/40 backdrop-blur-xl border-border/20";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background p-6 md:p-12"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-foreground">
            <ArrowRight className="w-4 h-4" />
            کهکشان
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">📡 اتاق فرمان</h1>
            <p className="text-xs text-muted-foreground">Command Room — Public</p>
          </div>
          <LanguagePicker compact />
        </div>

        {/* Galaxy Status */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-primary" />
              وضعیت کهکشان
              <span className="text-[10px] text-muted-foreground">Galaxy Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">● آنلاین</Badge>
            <Badge variant="outline" className="text-xs">دمو</Badge>
            {lastEntry && (
              <span className="text-muted-foreground text-[10px]">
                آخرین فعالیت: {new Date(lastEntry.timestamp).toLocaleTimeString("fa-IR")}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Planet Status Board */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              وضعیت سیارات
              <span className="text-[10px] text-muted-foreground">Planet Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stars.map((star) => (
              <div key={star.slug} className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: star.chakraColor }} />
                  <span className="text-foreground text-sm font-medium">{star.displayNameFa}</span>
                  <span className="text-muted-foreground text-[10px]">{star.displayNameEn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[10px]">{star.missionFa}</span>
                  <Badge variant={star.enabledTools.length > 0 ? "default" : "outline"} className="text-[8px] px-1.5">
                    {star.enabledTools.length > 0 ? "فعال" : "به‌زودی"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Rankings */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              رتبه‌بندی
              <span className="text-[10px] text-muted-foreground">Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankings.length === 0 ? (
              <p className="text-muted-foreground text-xs">هنوز داده‌ای ثبت نشده</p>
            ) : (
              <div className="space-y-1.5">
                {rankings.map(([slug, count], i) => {
                  const star = stars.find((s) => s.slug === slug);
                  return (
                    <div key={slug} className="flex items-center gap-2 text-sm">
                      <span className="text-accent font-bold text-xs w-4">#{i + 1}</span>
                      {star && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: star.chakraColor }} />}
                      <span className="text-foreground">{star?.displayNameFa || slug}</span>
                      <span className="text-muted-foreground text-[10px] mr-auto">{count} عمل</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className={glassCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              فعالیت اخیر
              <span className="text-[10px] text-muted-foreground">Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-muted-foreground text-xs">هنوز فعالیتی ثبت نشده</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {[...ledger].reverse().slice(0, 15).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] p-1.5 bg-secondary/15 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[8px] px-1 text-muted-foreground border-border/20">
                        🧬 {entry.hash.slice(0, 6)}
                      </Badge>
                      <span className="text-foreground">{entry.action}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{entry.starSlug}</span>
                      <span>{new Date(entry.timestamp).toLocaleTimeString("fa-IR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GolGolab onClick={() => setChatOpen(true)} />
      <SunCoreChat open={chatOpen} onOpenChange={setChatOpen} />
    </motion.div>
  );
}
