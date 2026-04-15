import { motion } from "framer-motion";

interface GolGolabProps {
  onClick: () => void;
}

export default function GolGolab({ onClick }: GolGolabProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl shadow-lg border-2 border-accent/50"
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      title="گل‌گلاب — دستیار کهکشانی"
    >
      🌸
    </motion.button>
  );
}
