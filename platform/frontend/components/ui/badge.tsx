import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "cyan" | "emerald" | "blue" | "red" | "slate";
  className?: string;
};

export function Badge({ children, tone = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        tone === "cyan" && "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
        tone === "emerald" && "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
        tone === "blue" && "border-blue-300/30 bg-blue-400/10 text-blue-100",
        tone === "red" && "border-red-300/30 bg-red-400/10 text-red-100",
        tone === "slate" && "border-slate-500/30 bg-slate-800/60 text-slate-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
