"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AiScientistPanel } from "@/components/ai-scientist-panel";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { PageContent } from "@/components/page-content";
import { getResearchSnapshot } from "@/lib/api";
import type { PageKey } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

export function WorkspaceShell({ page }: { page: PageKey }) {
  const rightPanelOpen = useAppStore((state) => state.rightPanelOpen);
  const { data, isLoading, error } = useQuery({ queryKey: ["research-snapshot"], queryFn: getResearchSnapshot });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activePage={page} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav page={page} />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="p-4 lg:p-6">
              <PageContent page={page} snapshot={data} isLoading={isLoading} error={error instanceof Error ? error.message : null} />
            </motion.div>
          </main>
          {rightPanelOpen ? <AiScientistPanel /> : null}
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
