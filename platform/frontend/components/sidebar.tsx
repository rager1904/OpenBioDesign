"use client";

import Link from "next/link";
import { Dna } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import type { PageKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar({ activePage }: { activePage: PageKey }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-slate-950/70 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
          <Dna className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">OpenBioDesign</p>
          <p className="text-xs text-muted-foreground">AI discovery lab</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navigationItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-white",
              activePage === item.key && "bg-cyan-300/12 text-cyan-50 ring-1 ring-cyan-300/20",
            )}
          >
            <item.icon className="size-4" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
