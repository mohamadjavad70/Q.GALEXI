import { useNavigate } from "react-router-dom";
import { getStarRegistry } from "@/data/starRegistry";

interface ConstellationRingProps {
  currentSlug: string;
}

export default function ConstellationRing({ currentSlug }: ConstellationRingProps) {
  const navigate = useNavigate();
  const others = getStarRegistry().filter((s) => s.slug !== currentSlug);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex gap-3 bg-card/80 backdrop-blur-md rounded-full px-5 py-2.5 border border-border">
      {others.map((star) => (
        <button
          key={star.slug}
          onClick={() => navigate(`/star/${star.slug}`)}
          className="w-7 h-7 rounded-full transition-all duration-200 hover:scale-125 hover:shadow-lg"
          style={{ backgroundColor: star.chakraColor, boxShadow: `0 0 8px ${star.chakraColor}40` }}
          title={`${star.displayNameFa} — ${star.displayNameEn}`}
        />
      ))}
    </div>
  );
}
