"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { navigationItems } from "@/lib/navigation";
import { useAppStore } from "@/store/use-app-store";

export function CommandPalette() {
  const open = useAppStore((state) => state.commandOpen);
  const setOpen = useAppStore((state) => state.setCommandOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 backdrop-blur" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-20 max-w-xl rounded-lg border bg-slate-950 shadow-lab" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 text-cyan-200" />
          <input className="flex-1 bg-transparent text-sm outline-none" autoFocus placeholder="Search projects, targets, reports, commands..." />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-white"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
