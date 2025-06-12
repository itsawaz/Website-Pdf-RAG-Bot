"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Globe, Database, TrendingUp, Trash2, RefreshCw, Brain, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { KnowledgeManager } from "./KnowledgeManager";

interface KnowledgeStats {
  total_chunks: number;
  sources: Record<string, number>;
}

interface SidebarProps {
  stats: KnowledgeStats | null;
  onRefreshStats: () => void;
  onClearKnowledgeBase: () => void;
  onDeleteBySource: (sourceType: string) => void;
  loading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  onRefreshStats,
  onClearKnowledgeBase,
  onDeleteBySource,
  loading = false,
}) => {
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false);

  const getSourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "website":
        return <Globe className="w-4 h-4" />;    default:
        return <Database className="w-4 h-4" />;
    }
  };
  return (
    <div className="w-80 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col h-full">
      <AnimatePresence mode="wait">
        {showKnowledgeManager ? (
          <motion.div
            key="knowledge-manager"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}          >
            <KnowledgeManager
              onKnowledgeDeleted={onRefreshStats}
              onClose={() => setShowKnowledgeManager(false)}
              onClearKnowledgeBase={onClearKnowledgeBase}
              onDeleteBySource={onDeleteBySource}
              stats={stats}
            />
          </motion.div>) : (
          <motion.div
            key="main-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Knowledge Base
              </h2>
              
              <div className="space-y-2 mb-4">
                <button
                  onClick={onRefreshStats}
                  disabled={loading}
                  className={cn(
                    "w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    {loading ? "Loading..." : "Refresh Stats"}
                  </div>
                </button>                <button
                  onClick={() => setShowKnowledgeManager(true)}
                  disabled={!stats || stats.total_chunks === 0}
                  className={cn(
                    "w-full px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center gap-2",
                    (!stats || stats.total_chunks === 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Brain className="w-4 h-4" />
                  Manage Knowledge
                </button>              </div>

              {stats ? (
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Chunks</span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {stats.total_chunks.toLocaleString()}
                    </div>
                  </motion.div>

                  {Object.entries(stats.sources).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Sources</h3>
                      {Object.entries(stats.sources).map(([type, count], index) => (
                        <motion.div
                          key={type}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {getSourceIcon(type)}
                            <span className="text-sm capitalize">{type}</span>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {count.toLocaleString()}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No knowledge base loaded</p>
                  <p className="text-xs">Upload PDFs or add websites to get started</p>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>Drag & drop PDF files</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span>Click globe icon to add websites</span>
                </div>                <div className="flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  <span>Manage individual knowledge pieces</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
