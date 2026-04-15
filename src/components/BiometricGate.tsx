import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Camera, Mic, MapPin, Lock, Unlock, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyPassphrase, unlockOwner, isOwnerUnlocked } from "@/lib/ownerGate";
import { logAction } from "@/lib/geneticHash";

interface BiometricGateProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

type ScanPhase = "idle" | "scanning" | "granted" | "denied";

export default function BiometricGate({ open, onClose, onNavigate }: BiometricGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [showPassInput, setShowPassInput] = useState(false);
  const [permissions, setPermissions] = useState({ camera: false, mic: false, location: false });

  const ownerUnlocked = isOwnerUnlocked();

  // Auto-grant if owner already unlocked
  useEffect(() => {
    if (open && ownerUnlocked) {
      setPhase("scanning");
      startCamera();
      const t = setTimeout(() => {
        setPhase("granted");
        logAction("biometric_auto_pass", "sun");
      }, 1800);
      return () => clearTimeout(t);
    }
    if (open && !ownerUnlocked) {
      setPhase("idle");
    }
  }, [open, ownerUnlocked, startCamera]);

  // Cleanup camera on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setPhase("idle");
      setPass("");
      setError(false);
      setShowPassInput(false);
    }
  }, [open, stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissions(p => ({ ...p, camera: true, mic: true }));
    } catch {
      setPermissions(p => ({ ...p, camera: false, mic: false }));
    }
    // Location
    try {
      navigator.geolocation.getCurrentPosition(
        () => setPermissions(p => ({ ...p, location: true })),
        () => setPermissions(p => ({ ...p, location: false }))
      );
    } catch {
      setPermissions((p) => ({ ...p, location: false }));
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleScan = useCallback(async () => {
    setPhase("scanning");
    await startCamera();
    // After scan, check if all permissions granted → commander identified
    setTimeout(() => {
      // Re-check permissions state via ref workaround
      setPermissions(current => {
        if (current.camera && current.mic && current.location) {
          unlockOwner();
          setPhase("granted");
          logAction("biometric_granted_permissions", "sun");
        } else {
          setPhase("denied");
          logAction("biometric_denied", "sun");
        }
        return current;
      });
    }, 2500);
  }, [startCamera]);

  const handlePassSubmit = useCallback(async () => {
    const valid = await verifyPassphrase(pass);
    if (valid) {
      unlockOwner();
      setError(false);
      setPhase("granted");
      logAction("owner_unlocked_biometric", "sun");
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }, [pass]);

  const handleEnterCommand = useCallback(() => {
    stopCamera();
    onNavigate("/command-center");
    onClose();
  }, [onNavigate, onClose, stopCamera]);

  const handleQuietRoom = useCallback(() => {
    stopCamera();
    logAction("enter_qcore", "sun");
    onNavigate("/q");
    onClose();
  }, [onNavigate, onClose, stopCamera]);

  const handleCommandRoom = useCallback(() => {
    stopCamera();
    logAction("enter_command_room", "sun");
    onNavigate("/command");
    onClose();
  }, [onNavigate, onClose, stopCamera]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="bg-card/95 backdrop-blur-2xl border border-border/30 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scan line animation */}
            {phase === "scanning" && (
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_15px_hsl(var(--primary))]"
                initial={{ top: 0 }}
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Camera feed */}
            <div className="relative mx-auto w-28 h-28 rounded-full overflow-hidden border-2 border-border/40">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {phase === "idle" && !ownerUnlocked && (
                <div className="absolute inset-0 bg-card/80 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              {phase === "scanning" && (
                <div className="absolute inset-0 border-4 border-primary/50 rounded-full animate-pulse" />
              )}
              {phase === "granted" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary/20 flex items-center justify-center"
                >
                  <Unlock className="w-8 h-8 text-primary" />
                </motion.div>
              )}
              {phase === "denied" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-destructive/20 flex items-center justify-center"
                >
                  <Lock className="w-8 h-8 text-destructive" />
                </motion.div>
              )}
            </div>

            {/* Status */}
            <div>
              {phase === "idle" && (
                <>
                  <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
                  <h2 className="text-foreground font-bold text-sm">دروازه خورشید</h2>
                  <p className="text-muted-foreground text-[10px]">Sun Gate — Biometric Verification</p>
                </>
              )}
              {phase === "scanning" && (
                <>
                  <Scan className="w-6 h-6 mx-auto text-primary animate-pulse mb-2" />
                  <p className="text-primary text-xs">در حال اسکن...</p>
                  <p className="text-muted-foreground text-[10px]">Scanning biometrics</p>
                </>
              )}
              {phase === "granted" && (
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <p className="text-primary text-sm font-bold">✦ فرمانده شناسایی شد</p>
                  <p className="text-muted-foreground text-[10px]">Commander identified</p>
                </motion.div>
              )}
              {phase === "denied" && (
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <p className="text-destructive text-sm font-bold">دسترسی غیرمجاز</p>
                  <p className="text-muted-foreground text-[10px]">Unauthorized — System locked</p>
                </motion.div>
              )}
            </div>

            {/* Permission indicators */}
            <div className="flex justify-center gap-3 text-[10px]">
              <span className={permissions.camera ? "text-primary" : "text-muted-foreground/30"}>
                <Camera className="w-3 h-3 inline mr-0.5" /> Camera
              </span>
              <span className={permissions.mic ? "text-primary" : "text-muted-foreground/30"}>
                <Mic className="w-3 h-3 inline mr-0.5" /> Mic
              </span>
              <span className={permissions.location ? "text-primary" : "text-muted-foreground/30"}>
                <MapPin className="w-3 h-3 inline mr-0.5" /> Location
              </span>
            </div>

            {/* Actions based on phase */}
            {phase === "idle" && !ownerUnlocked && (
              <div className="space-y-2">
                <Button size="sm" className="w-full text-xs" onClick={handleScan}>
                  <Scan className="w-3.5 h-3.5 mr-1.5" />
                  شروع اسکن
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[10px] text-muted-foreground/50"
                  onClick={() => setShowPassInput(!showPassInput)}
                >
                  ورود دستی
                </Button>
                {showPassInput && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2">
                    <Input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePassSubmit()}
                      placeholder="..."
                      className="text-xs h-7 bg-input/40 border-border/20 text-foreground text-center"
                      dir="ltr"
                    />
                    {error && <p className="text-destructive text-[10px]">رد شد</p>}
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={handlePassSubmit}>
                      تأیید
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {phase === "granted" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <Button size="sm" className="w-full text-xs" onClick={handleEnterCommand}>
                  ورود به فرماندهی ✦
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleQuietRoom}>
                  🌿 اتاق آرام (Q)
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleCommandRoom}>
                  📡 اتاق فرمان
                </Button>
              </motion.div>
            )}

            {phase === "denied" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-xs">🔒 سیستم قفل شد</p>
                  <p className="text-muted-foreground text-[10px] mt-1">
                    فقط فرمانده مجاز به ورود است
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleQuietRoom}>
                  🌿 اتاق آرام (Q)
                </Button>
              </motion.div>
            )}

            {/* Close */}
            {phase !== "denied" && (
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground" onClick={onClose}>
                انصراف
              </Button>
            )}
            {phase === "denied" && (
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground" onClick={onClose}>
                بازگشت
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
