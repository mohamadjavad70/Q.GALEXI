import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StarConfig } from "@/data/starRegistry";
import { getStarIntro } from "@/data/contentBlocks";
import ConstellationRing from "./ConstellationRing";
import GolGolab from "./GolGolab";
import SunCoreChat from "./SunCoreChat";
import { MatrixRain } from "./stars/MatrixTool";

const TeslaTool = lazy(() => import("./stars/TeslaTool"));
const MatrixTool = lazy(() => import("./stars/MatrixTool"));
const MolanaTool = lazy(() => import("./stars/MolanaTool"));
const DavinciPuzzle = lazy(() => import("./stars/DavinciPuzzle"));
const BeethovenTool = lazy(() => import("./stars/BeethovenTool"));

function StarVisual({ bgStyle }: { bgStyle: string }) {
  switch (bgStyle) {
    case "tesla":
      return (
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-2 border-star-tesla/50 animate-pulse-glow" style={{ boxShadow: "0 0 60px hsl(var(--star-tesla) / 0.3)" }} />
            <div className="absolute inset-0 flex items-center justify-center text-6xl">⚡</div>
          </div>
        </div>
      );
    case "matrix":
      return <MatrixRain />;
    case "molana":
      return (
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="text-8xl animate-pulse-glow">❤️</div>
            <div className="absolute -top-8 -right-8 text-5xl animate-float">🧠</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-star-molana/0 via-star-molana to-star-molana/0 animate-pulse" />
          </div>
        </div>
      );
    case "davinci":
      return (
        <div className="flex items-center justify-center h-full gap-8">
          <div className="text-center space-y-2 opacity-60">
            <div className="text-6xl">🎨</div>
            <p className="text-xs text-muted-foreground">Gallery</p>
          </div>
          <div className="w-px h-24 bg-star-davinci/30" />
          <div className="text-center space-y-2 opacity-60">
            <div className="text-6xl">⚙️</div>
            <p className="text-xs text-muted-foreground">Inventions</p>
          </div>
        </div>
      );
    case "beethoven":
      return (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-4 text-center">
            {["🎵", "🎶", "🎵"].map((n, i) => (
              <div key={i} className="text-4xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>{n}</div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl text-muted-foreground">به‌زودی... ✨</p>
        </div>
      );
  }
}

function StarToolPanel({ bgStyle }: { bgStyle: string }) {
  const fallback = <div className="h-40 flex items-center justify-center text-muted-foreground">در حال بارگذاری...</div>;
  switch (bgStyle) {
    case "tesla": return <Suspense fallback={fallback}><TeslaTool /></Suspense>;
    case "matrix": return <Suspense fallback={fallback}><MatrixTool /></Suspense>;
    case "molana": return <Suspense fallback={fallback}><MolanaTool /></Suspense>;
    case "davinci": return <Suspense fallback={fallback}><DavinciPuzzle /></Suspense>;
    case "beethoven": return <Suspense fallback={fallback}><BeethovenTool /></Suspense>;
    default: return null;
  }
}

interface StarWorldTemplateProps {
  star: StarConfig;
}

export default function StarWorldTemplate({ star }: StarWorldTemplateProps) {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const intro = getStarIntro(star.slug);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className={`min-h-screen bg-star-${star.bgStyle} relative`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 relative z-20">
        <Button variant="ghost" onClick={() => navigate("/")} className="text-foreground gap-2">
          <ArrowRight className="w-4 h-4" />
          کهکشان
        </Button>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground" style={{ textShadow: `0 0 20px ${star.chakraColor}40` }}>
            {star.displayNameFa}
          </h1>
          <p className="text-xs text-muted-foreground">{star.displayNameEn} — {star.missionEn}</p>
          {intro.introFa && (
            <p className="text-sm text-foreground/70 mt-1">{intro.introFa}</p>
          )}
        </div>
        <div className="w-20" />
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] relative z-10">
        {/* Visual panel */}
        <div className="flex-1 relative min-h-[300px]">
          <StarVisual bgStyle={star.bgStyle} />
        </div>

        {/* Tool panel */}
        <div className="w-full lg:w-[400px] p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <StarToolPanel bgStyle={star.bgStyle} />
        </div>
      </div>

      <ConstellationRing currentSlug={star.slug} />
      <GolGolab onClick={() => setChatOpen(true)} />
      <SunCoreChat open={chatOpen} onOpenChange={setChatOpen} />
    </motion.div>
  );
}
