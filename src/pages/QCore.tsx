import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Hammer, BarChart3, FolderKanban, Shield, Link2, AlertTriangle } from "lucide-react";
import SunCoreChat from "@/components/SunCoreChat";
import GolGolab from "@/components/GolGolab";

const integrations = [
  { name: "Google", icon: "🔍", connected: false },
  { name: "YouTube", icon: "▶️", connected: false },
  { name: "GitHub", icon: "🐙", connected: false },
  { name: "Instagram", icon: "📷", connected: false },
];

export default function QCore() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background p-6 md:p-12"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 text-foreground">
            <ArrowRight className="w-4 h-4" />
            کهکشان
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Q Core</h1>
            <p className="text-xs text-muted-foreground">اتاق آرام — Quiet Room</p>
          </div>
          <div className="w-20" />
        </div>

        {/* Chat */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="سوالت رو بنویس..."
                className="bg-input text-foreground"
                dir="rtl"
              />
              <Button onClick={() => setChatOpen(true)}>گفتگو</Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Board */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2 text-foreground">
            <Hammer className="w-6 h-6 text-primary" />
            ساخت
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 text-foreground">
            <BarChart3 className="w-6 h-6 text-primary" />
            تحلیل
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2 text-foreground">
            <FolderKanban className="w-6 h-6 text-primary" />
            سازماندهی
          </Button>
        </div>

        {/* Permissions Panel */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground text-base">
              <Shield className="w-5 h-5 text-primary" />
              مجوزها و اتصالات
              <span className="text-xs text-muted-foreground">Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integ) => (
              <div key={integ.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{integ.icon}</span>
                  <span className="text-foreground font-medium">{integ.name}</span>
                  <Badge variant={connected[integ.name] ? "default" : "outline"} className="text-xs">
                    {connected[integ.name] ? "متصل" : "قطع"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {connected[integ.name] ? (
                    <Button size="sm" variant="destructive" onClick={() => setConnected((p) => ({ ...p, [integ.name]: false }))}>
                      قطع اتصال
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setConfirmModal(integ.name)}>
                      <Link2 className="w-3 h-3 ml-1" /> اتصال
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground">🔒 حداقل دسترسی — فقط خواندن</p>

            {/* Bank access block */}
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">دسترسی بانکی پشتیبانی نمی‌شود. در آینده از ادغام‌های مالی فقط-خواندنی استفاده کنید.</p>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setConfirmModal(null)}>
            <Card className="w-80" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-foreground font-bold">تأیید اتصال به {confirmModal}</p>
                <p className="text-sm text-muted-foreground">فقط دسترسی خواندن داده می‌شود.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setConnected((p) => ({ ...p, [confirmModal]: true })); setConfirmModal(null); }}>
                    تأیید
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmModal(null)}>انصراف</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <GolGolab onClick={() => setChatOpen(true)} />
      <SunCoreChat open={chatOpen} onOpenChange={setChatOpen} />
    </motion.div>
  );
}
