import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Shield } from "lucide-react";
import { verifyPassphrase, unlockOwner, isOwnerUnlocked } from "@/lib/ownerGate";
import { logAction } from "@/lib/geneticHash";

interface SunGateModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export default function SunGateModal({ open, onClose, onNavigate }: SunGateModalProps) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const ownerUnlocked = isOwnerUnlocked();

  const handleEnterCommand = useCallback(async () => {
    if (ownerUnlocked) {
      logAction("enter_command", "sun");
      onNavigate("/command-center");
      onClose();
      return;
    }
    const valid = await verifyPassphrase(pass);
    if (valid) {
      unlockOwner();
      setError(false);
      logAction("owner_unlocked", "sun");
      onNavigate("/command-center");
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }, [pass, ownerUnlocked, onNavigate, onClose]);

  const handleQuietRoom = useCallback(() => {
    logAction("enter_qcore", "sun");
    onNavigate("/q");
    onClose();
  }, [onNavigate, onClose]);

  const handleCommandRoom = useCallback(() => {
    logAction("enter_command_room", "sun");
    onNavigate("/command");
    onClose();
  }, [onNavigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={error ? { scale: 1, x: [0, -8, 8, -6, 6, 0], opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card/90 backdrop-blur-xl border border-border/30 rounded-2xl p-6 max-w-xs w-full space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Shield className="w-8 h-8 mx-auto text-primary" />
            <h2 className="text-foreground font-bold text-base">Q Core — فرماندهی خصوصی</h2>
            <p className="text-muted-foreground text-xs">Private Command Gateway</p>

            {/* Public options */}
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleQuietRoom}>
                🌿 اتاق آرام (Q)
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleCommandRoom}>
                📡 اتاق فرمان (عمومی)
              </Button>
            </div>

            {/* Owner section — no hints */}
            <div className="border-t border-border/20 pt-3 space-y-2">
              <p className="text-muted-foreground/50 text-[10px] flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> دسترسی فرمانده
              </p>
              {ownerUnlocked ? (
                <Button size="sm" className="w-full text-xs" onClick={handleEnterCommand}>
                  ورود به فرماندهی ✦
                </Button>
              ) : (
                <>
                  <Input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEnterCommand()}
                    placeholder="Sign in..."
                    className="text-xs h-8 bg-input/40 border-border/20 text-foreground text-center"
                    dir="ltr"
                  />
                  {error && (
                    <p className="text-destructive text-[10px]">دسترسی رد شد</p>
                  )}
                  <Button size="sm" className="w-full text-xs" onClick={handleEnterCommand}>
                    ورود به فرماندهی
                  </Button>
                </>
              )}
            </div>

            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onClose}>
              انصراف
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
