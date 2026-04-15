import { useParams, Navigate } from "react-router-dom";
import { getStarBySlug } from "@/data/starRegistry";
import StarWorldTemplate from "@/components/StarWorldTemplate";

export default function StarWorld() {
  const { slug } = useParams<{ slug: string }>();
  const star = slug ? getStarBySlug(slug) : undefined;

  if (!star) return <Navigate to="/" replace />;

  return <StarWorldTemplate star={star} />;
}
