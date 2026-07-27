import {
  Activity,
  Bot,
  BrainCircuit,
  FlaskConical,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Library,
  Microscope,
  Network,
  Orbit,
  Settings,
  TestTubeDiagonal,
} from "lucide-react";
import type { NavigationItem, PageKey } from "@/lib/types";

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { key: "projects", label: "Research Projects", href: "/projects", icon: FlaskConical },
  { key: "target-discovery", label: "Target Discovery", href: "/target-discovery", icon: BrainCircuit },
  { key: "protein-analysis", label: "Protein Analysis", href: "/protein-analysis", icon: Microscope },
  { key: "structure-prediction", label: "Structure Prediction", href: "/structure-prediction", icon: Orbit },
  { key: "binder-generation", label: "Binder Generation", href: "/binder-generation", icon: GitBranch },
  { key: "molecule-design", label: "Molecule Design", href: "/molecule-design", icon: TestTubeDiagonal },
  { key: "docking-validation", label: "Docking & Validation", href: "/docking-validation", icon: Activity },
  { key: "ai-scientist", label: "AI Scientist", href: "/ai-scientist", icon: Bot },
  { key: "knowledge-base", label: "Knowledge Base", href: "/knowledge-base", icon: Network },
  { key: "experiments", label: "Experiments", href: "/experiments", icon: Gauge },
  { key: "reports", label: "Reports", href: "/reports", icon: Library },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

const aliases: Record<string, PageKey> = {
  "": "dashboard",
  dashboard: "dashboard",
  projects: "projects",
  "research-projects": "projects",
  "target-discovery": "target-discovery",
  "protein-analysis": "protein-analysis",
  "structure-prediction": "structure-prediction",
  "binder-generation": "binder-generation",
  "molecule-design": "molecule-design",
  "docking-validation": "docking-validation",
  "ai-scientist": "ai-scientist",
  "knowledge-base": "knowledge-base",
  experiments: "experiments",
  reports: "reports",
  settings: "settings",
};

export function getPageBySlug(slug: string): PageKey {
  return aliases[slug] ?? "dashboard";
}

export function getPageTitle(page: PageKey) {
  return navigationItems.find((item) => item.key === page)?.label ?? "Dashboard";
}
