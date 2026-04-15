import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Zap } from "lucide-react";

/**
 * MobileFlightControls — On-screen D-pad + vertical + boost for mobile.
 * Writes to shared keysRef (same ref as SpaceshipControls keyboard handler).
 */

interface MobileFlightControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  visible: boolean;
}

function FlightButton({
  keyName,
  keysRef,
  children,
  className = "",
}: {
  keyName: string;
  keysRef: React.MutableRefObject<Set<string>>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`w-11 h-11 flex items-center justify-center bg-card/25 backdrop-blur-md rounded-xl border border-border/15 text-foreground/70 active:bg-primary/20 active:text-foreground select-none touch-none transition-colors ${className}`}
      onPointerDown={() => keysRef.current.add(keyName)}
      onPointerUp={() => keysRef.current.delete(keyName)}
      onPointerLeave={() => keysRef.current.delete(keyName)}
      onPointerCancel={() => keysRef.current.delete(keyName)}
    >
      {children}
    </button>
  );
}

export default function MobileFlightControls({ keysRef, visible }: MobileFlightControlsProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-28 left-4 z-30 pointer-events-auto md:hidden space-y-2" dir="ltr">
      {/* D-pad */}
      <div className="flex flex-col items-center gap-1">
        <FlightButton keyName="w" keysRef={keysRef}>
          <ChevronUp className="w-5 h-5" />
        </FlightButton>
        <div className="flex gap-1">
          <FlightButton keyName="a" keysRef={keysRef}>
            <ChevronLeft className="w-5 h-5" />
          </FlightButton>
          <FlightButton keyName="s" keysRef={keysRef}>
            <ChevronDown className="w-5 h-5" />
          </FlightButton>
          <FlightButton keyName="d" keysRef={keysRef}>
            <ChevronRight className="w-5 h-5" />
          </FlightButton>
        </div>
      </div>

      {/* Vertical + Boost */}
      <div className="flex gap-1 justify-center">
        <FlightButton keyName="q" keysRef={keysRef} className="w-10 h-10">
          <ArrowDown className="w-4 h-4" />
        </FlightButton>
        <FlightButton keyName="e" keysRef={keysRef} className="w-10 h-10">
          <ArrowUp className="w-4 h-4" />
        </FlightButton>
        <FlightButton keyName="shift" keysRef={keysRef} className="w-10 h-10">
          <Zap className="w-4 h-4" />
        </FlightButton>
      </div>
    </div>
  );
}
