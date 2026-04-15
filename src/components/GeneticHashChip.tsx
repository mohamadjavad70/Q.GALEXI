import { Badge } from "@/components/ui/badge";

export default function GeneticHashChip({ hash }: { hash: string }) {
  if (!hash) return null;
  return (
    <Badge variant="outline" className="font-mono text-xs gap-1 text-muted-foreground border-border">
      🧬 {hash}
    </Badge>
  );
}
