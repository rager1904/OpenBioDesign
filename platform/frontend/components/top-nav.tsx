"use client";

import { Bell, Command, Menu, Moon, PanelRightClose, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPageTitle } from "@/lib/navigation";
import type { PageKey } from "@/lib/types";
import { useAppStore } from "@/store/use-app-store";

export function TopNav({ page }: { page: PageKey }) {
  const setCommandOpen = useAppStore((state) => state.setCommandOpen);
  const rightPanelOpen = useAppStore((state) => state.rightPanelOpen);
  const setRightPanelOpen = useAppStore((state) => state.setRightPanelOpen);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-slate-950/40 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-white">{getPageTitle(page)}</h1>
          <p className="hidden text-xs text-muted-foreground sm:block">Explainable, reproducible AI drug discovery workspace</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden w-72 items-center justify-between rounded-md border bg-slate-950/70 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-cyan-300/50 md:flex"
        >
          <span className="flex items-center gap-2"><Search className="size-4" /> Search everywhere</span>
          <span className="flex items-center gap-1 text-xs"><Command className="size-3" />K</span>
        </button>
        <Button size="icon" variant="ghost" aria-label="Open command palette" onClick={() => setCommandOpen(true)}>
          <Search />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Notifications">
          <Bell />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Theme switcher">
          <Moon />
        </Button>
        <Button size="icon" variant={rightPanelOpen ? "secondary" : "ghost"} aria-label="Toggle AI panel" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
          <PanelRightClose />
        </Button>
        <div className="hidden size-9 items-center justify-center rounded-md bg-emerald-300 text-sm font-bold text-slate-950 sm:flex">RA</div>
      </div>
    </header>
  );
}
