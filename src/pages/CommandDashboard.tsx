/**
 * Command Dashboard — مرکز مانیتورینگ و چت شورا
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmpireDashboard from "@/components/EmpireDashboard";
import CouncilChat from "@/components/CouncilChat";

export default function CommandDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "council">("dashboard");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground"
      dir="rtl"
    >
      {/* Header */}
      <div className="border-b border-border/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold tracking-widest text-primary uppercase">
            Empire Command Dashboard
          </h1>
        </div>

        <div className="flex gap-1">
          {(["dashboard", "council"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/50 hover:text-foreground"
              }`}
            >
              {tab === "dashboard" ? "📊 داشبورد" : "👑 شورا"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {activeTab === "dashboard" ? (
          <EmpireDashboard />
        ) : (
          <div className="h-[calc(100vh-100px)]">
            <CouncilChat />
          </div>
        )}
      </div>
    </motion.div>
  );
}
