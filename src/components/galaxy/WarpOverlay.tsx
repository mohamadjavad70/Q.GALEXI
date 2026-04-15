import { motion, AnimatePresence } from "framer-motion";

/**
 * WarpOverlay — Full-screen cinematic warp transition with radial flash,
 * vignette, and streak lines.
 */

interface WarpOverlayProps {
  active: boolean;
  chakraColor: string;
  onComplete?: () => void;
}

export default function WarpOverlay({ active, chakraColor, onComplete }: WarpOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onAnimationComplete={() => {
            // Give the overlay time to show before navigating
          }}
        >
          {/* Radial flash */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${chakraColor}40 0%, transparent 60%)`,
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            onAnimationComplete={onComplete}
          />

          {/* Vignette */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at 50% 50%, transparent 20%, hsl(230 30% 4% / 0.9) 80%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 1] }}
            transition={{ duration: 0.8 }}
          />

          {/* Streak lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const delay = i * 0.03;
            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  width: "200vw",
                  height: "1.5px",
                  background: `linear-gradient(90deg, transparent 0%, ${chakraColor}80 30%, ${chakraColor} 50%, transparent 100%)`,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "0% 50%",
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1.2], opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.7, delay, ease: "easeOut" }}
              />
            );
          })}

          {/* Center flash dot */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: chakraColor,
              boxShadow: `0 0 40px 20px ${chakraColor}`,
            }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: [1, 30], opacity: [1, 0] }}
            transition={{ duration: 0.8, ease: "easeIn" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
