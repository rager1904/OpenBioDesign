"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Download,
  Ruler,
  Atom,
  Layers,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DiseaseSelector, type DiseaseTarget } from "@/components/disease-selector";

const PRESET_STRUCTURES = [
  { label: "Human Insulin", id: "4INS", source: "pdb" as const, desc: "Hormone" },
  { label: "EGFR Kinase", id: "1M17", source: "pdb" as const, desc: "Receptor" },
  { label: "GFP", id: "1EMA", source: "pdb" as const, desc: "Fluorescent" },
  { label: "Hemoglobin", id: "1A3N", source: "pdb" as const, desc: "Oxygen transport" },
  { label: "Insulin (AF)", id: "AF-P01308-F1", source: "alphafold" as const, desc: "AlphaFold" },
  { label: "EGFR (AF)", id: "AF-P00533-F1", source: "alphafold" as const, desc: "AlphaFold" },
];

type StyleOption =
  | "cartoon"
  | "surface"
  | "stick"
  | "sphere"
  | "line"
  | "cartoon+surface"
  | "sphere+stick"
  | "putty";

type ColorOption = "spectrum" | "ss" | "chain" | "residue" | "element" | "hydrophobicity" | "bfactor";

const COLOR_SCHEMES: Record<ColorOption, { label: string; icon: string }> = {
  spectrum: { label: "Rainbow", icon: "🌈" },
  ss: { label: "Sec. Structure", icon: "🔬" },
  chain: { label: "By Chain", icon: "🧬" },
  residue: { label: "By Residue", icon: "⚗️" },
  element: { label: "By Element", icon: "⚛️" },
  hydrophobicity: { label: "Hydrophobicity", icon: "💧" },
  bfactor: { label: "B-factor", icon: "📊" },
};

export function MolecularViewer({ pdbId, pdbContent, label }: { pdbId?: string; pdbContent?: string; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<StyleOption>("cartoon");
  const [activeColor, setActiveColor] = useState<ColorOption>("spectrum");
  const [currentPdb, setCurrentPdb] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [modelInfo, setModelInfo] = useState<{ atoms: number; chains: string[]; residues: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<any[]>([]);
  const [showSurfaceOverlay, setShowSurfaceOverlay] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseTarget | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeColorRef = useRef<ColorOption>("spectrum");
  activeColorRef.current = activeColor;

  useEffect(() => {
    setMounted(true);
  }, []);

  const getCartoonStyle = useCallback(async (colorOpt: ColorOption): Promise<Record<string, any>> => {
    switch (colorOpt) {
      case "spectrum":
        return { color: "spectrum", opacity: 0.92, tubes: true };
      case "ss":
        return { color: "ss", opacity: 0.92, tubes: true };
      case "chain":
        return { color: "chain", opacity: 0.92, tubes: true };
      case "residue":
        return { colorscheme: "Jmol", opacity: 0.92, tubes: true };
      case "element":
        return { colorscheme: "Rasmol", opacity: 0.92, tubes: true };
      case "hydrophobicity": {
        const $3DmolMod = await import("3dmol");
        const $3D = $3DmolMod.default || $3DmolMod;
        return { color: { prop: "partialCharge", gradient: new $3D.Gradient.RWB(-0.5, 0.5) }, opacity: 0.92, tubes: true };
      }
      case "bfactor": {
        const $3DmolMod = await import("3dmol");
        const $3D = $3DmolMod.default || $3DmolMod;
        return { color: { prop: "b", gradient: new $3D.Gradient.RWB(0, 100) }, opacity: 0.92, tubes: true };
      }
      default:
        return { color: "spectrum", opacity: 0.92, tubes: true };
    }
  }, []);

  const loadStructure = useCallback(
    async (id: string, source: "pdb" | "alphafold" = "pdb") => {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        if (!containerRef.current || containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) {
          throw new Error("Viewer container is not ready — please wait for layout to finish");
        }

        const $3DmolMod = await import("3dmol");
        const $3Dmol = $3DmolMod.default || $3DmolMod;

        let viewer = viewerRef.current;
        if (viewer) {
          try {
            viewer.clear();
            viewer.removeAllLabels();
            viewer.removeAllSurfaces();
            viewer.render();
          } catch {
            viewerRef.current = null;
            viewer = null;
          }
        }
        if (!viewer) {
          viewer = $3Dmol.createViewer(containerRef.current, {
            backgroundColor: "rgba(2, 6, 18, 0)",
            antialias: true,
            disableFog: false,
          });
          viewerRef.current = viewer;
          try { viewer.render(); } catch {
            viewerRef.current = null;
            throw new Error("WEBGL_UNAVAILABLE");
          }
        }

        let pdbData: string | null = null;
        const proxyBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api/v1";

        if (source === "pdb") {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const proxyRes = await fetch(`${proxyBase}/structures/pdb/${id}`, { signal: controller.signal });
            clearTimeout(timer);
            if (proxyRes.ok) pdbData = await proxyRes.text();
          } catch { /* proxy unavailable, fall through to direct */ }
          if (!pdbData) {
            try {
              const res = await fetch(`https://files.rcsb.org/view/${id}.pdb`);
              if (!res.ok) throw new Error(`PDB ${id} not found on RCSB (HTTP ${res.status})`);
              pdbData = await res.text();
            } catch (fetchErr: any) {
              if (fetchErr.message?.includes("not found")) throw fetchErr;
              throw new Error(`Could not fetch PDB ${id}: backend proxy unavailable and direct fetch failed (${fetchErr.message || "network error"})`);
            }
          }
        } else {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const proxyRes = await fetch(`${proxyBase}/structures/alphafold/${id}`, { signal: controller.signal });
            clearTimeout(timer);
            if (proxyRes.ok) pdbData = await proxyRes.text();
          } catch { /* proxy unavailable, fall through to direct */ }
          if (!pdbData) {
            try {
              const res = await fetch(`https://alphafold.ebi.ac.uk/api/pdb/${id}`);
              if (!res.ok) throw new Error(`AlphaFold ${id} not found (HTTP ${res.status})`);
              pdbData = await res.text();
            } catch (fetchErr: any) {
              if (fetchErr.message?.includes("not found")) throw fetchErr;
              throw new Error(`Could not fetch AlphaFold ${id}: backend proxy unavailable and direct fetch failed (${fetchErr.message || "network error"})`);
            }
          }
        }

        viewer.addModel(pdbData, "pdb");

        const cartoonStyle = await getCartoonStyle(activeColorRef.current);
        viewer.setStyle({}, { cartoon: cartoonStyle });
        viewer.zoomTo();
        viewer.zoom(0.9);
        viewer.render();
        setCurrentPdb(id);

        const model = viewer.getModel();
        const atoms = model.selectedAtoms({});
        const chains = [...new Set(atoms.map((a: any) => a.chain).filter(Boolean))] as string[];
        const residues = new Set(atoms.map((a: any) => `${a.chain}:${a.resi}`)).size;
        setModelInfo({ atoms: atoms.length, chains, residues });

        setMeasurePoints([]);
      } catch (err: any) {
        const msg = err?.message || String(err);
        const isWebGL =
          msg === "WEBGL_UNAVAILABLE" ||
          msg.includes("WebGL") || msg.includes("webgl") || msg.includes("getContext") ||
          msg.includes("clearDepth") || msg.includes("GL") ||
          msg.includes("GPU") || msg.includes("gpu") ||
          msg.includes("not supported") || msg.includes("not available");
        if (isWebGL) {
          viewerRef.current = null;
          setError(
            "WebGL is not available. Enable hardware acceleration:\n" +
            "Chrome: Settings > System > \"Use hardware acceleration\"\n" +
            "Edge: Settings > System and performance > \"Use hardware acceleration\"\n" +
            "Firefox: about:config > webgl.force-enabled = true\n" +
            "After toggling, restart the browser."
          );
        } else {
          setError(msg || "Failed to load structure");
        }
      } finally {
        setLoading(false);
      }
    },
    [getCartoonStyle]
  );

  const applyStyle = useCallback(
    async (style: StyleOption, colorOverride?: ColorOption) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      setActiveStyle(style);
      setMeasurePoints([]);

      const cartoonProps = await getCartoonStyle(colorOverride ?? activeColorRef.current);

      viewer.removeAllSurfaces();

      switch (style) {
        case "cartoon":
          viewer.setStyle({}, { cartoon: cartoonProps });
          break;
        case "surface": {
          viewer.setStyle({}, { cartoon: { ...cartoonProps, opacity: 0.3 } });
          const $3DmolMod2 = await import("3dmol");
          const $3Dmol2 = $3DmolMod2.default || $3DmolMod2;
          viewer.addSurface($3Dmol2.SurfaceType.VDW, {
            opacity: 0.65,
            color: "white",
          });
          break;
        }
        case "stick":
          viewer.setStyle({}, { stick: { colorscheme: "Jmol", radius: 0.18 } });
          break;
        case "sphere":
          viewer.setStyle({}, { sphere: { colorscheme: "Jmol", scale: 0.35 } });
          break;
        case "line":
          viewer.setStyle({}, { line: { colorscheme: "Jmol" } });
          break;
        case "cartoon+surface": {
          viewer.setStyle({}, { cartoon: { ...cartoonProps, opacity: 0.75 } });
          const $3DmolMod3 = await import("3dmol");
          const $3Dmol3 = $3DmolMod3.default || $3DmolMod3;
          viewer.addSurface($3Dmol3.SurfaceType.SAS, {
            opacity: 0.25,
            color: "#22d3ee",
          });
          break;
        }
        case "sphere+stick":
          viewer.setStyle({}, {
            sphere: { colorscheme: "Jmol", scale: 0.22 },
            stick: { colorscheme: "Jmol", radius: 0.14 },
          });
          break;
        case "putty":
          viewer.setStyle({}, { cartoon: { ...cartoonProps, style: "putty", opacity: 0.85 } });
          break;
      }
      viewer.render();
    },
    [getCartoonStyle]
  );

  const changeColor = useCallback(
    async (colorOpt: ColorOption) => {
      setActiveColor(colorOpt);
      await applyStyle(activeStyle, colorOpt);
    },
    [activeStyle, applyStyle]
  );

  const toggleLabels = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !showLabels;
    setShowLabels(next);
    viewer.removeAllLabels();
    if (next) {
      const atoms = viewer.getModel().selectedAtoms({ atom: "CA" });
      atoms.forEach((a: any) => {
        viewer.addLabel(`${a.resn}${a.resi}`, {
          position: { x: a.x, y: a.y, z: a.z },
          fontColor: "#e2e8f0",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backgroundOpacity: 0.85,
          borderColor: "rgba(34, 211, 238, 0.4)",
          borderWidth: 1,
          fontSize: 10,
          showBackground: true,
          alignment: "center",
        });
      });
    }
    viewer.render();
  }, [showLabels]);

  const toggleSpin = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !isSpinning;
    setIsSpinning(next);
    if (next) {
      viewer.spin("y", 1);
    } else {
      viewer.spin(false);
    }
  }, [isSpinning]);

  const captureImage = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      const uri = viewer.pngURI();
      const link = document.createElement("a");
      link.href = uri;
      link.download = `structure-${currentPdb}-${Date.now()}.png`;
      link.click();
    } catch {
      // silently fail
    }
  }, [currentPdb]);

  const handleMeasureClick = useCallback(
    (event: any) => {
      if (!measureMode || !viewerRef.current) return;
      const viewer = viewerRef.current;
      const picked = viewer.pick(event);
      if (picked && picked.atom1) {
        const newPoints = [...measurePoints, picked.atom1];
        setMeasurePoints(newPoints);

        viewer.addLabel(`${picked.atom1.resn}${picked.atom1.resi} ${picked.atom1.atom}`, {
          position: { x: picked.atom1.x, y: picked.atom1.y, z: picked.atom1.z },
          fontColor: "#fbbf24",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          backgroundOpacity: 0.9,
          borderColor: "#fbbf24",
          borderWidth: 1,
          fontSize: 11,
          showBackground: true,
        });

        if (newPoints.length === 2) {
          const dx = newPoints[0].x - newPoints[1].x;
          const dy = newPoints[0].y - newPoints[1].y;
          const dz = newPoints[0].z - newPoints[1].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);

          viewer.addLabel(`${dist} A`, {
            position: {
              x: (newPoints[0].x + newPoints[1].x) / 2,
              y: (newPoints[0].y + newPoints[1].y) / 2,
              z: (newPoints[0].z + newPoints[1].z) / 2,
            },
            fontColor: "#22d3ee",
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            backgroundOpacity: 0.9,
            borderColor: "#22d3ee",
            borderWidth: 1,
            fontSize: 13,
            showBackground: true,
            alignment: "center",
          });

          viewer.addCylinder({
            start: { x: newPoints[0].x, y: newPoints[0].y, z: newPoints[0].z },
            end: { x: newPoints[1].x, y: newPoints[1].y, z: newPoints[1].z },
            radius: 0.08,
            color: "#22d3ee",
            opacity: 0.8,
            fromCap: 2,
            toCap: 2,
          });

          setMeasurePoints([]);
        }
        viewer.render();
      }
    },
    [measureMode, measurePoints]
  );

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (measureMode && containerRef.current) {
      containerRef.current.addEventListener("click", handleMeasureClick);
      return () => containerRef.current?.removeEventListener("click", handleMeasureClick);
    }
  }, [measureMode, handleMeasureClick]);

  useEffect(() => {
    if (pdbId) {
      loadStructure(pdbId, "pdb");
    }
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.clear();
          viewerRef.current.removeAllLabels();
          viewerRef.current.removeAllSurfaces();
        } catch { /* ignore cleanup errors */ }
        viewerRef.current = null;
      }
    };
  }, [pdbId, loadStructure]);

  // Load PDB content directly when provided (for ESMFold predictions)
  useEffect(() => {
    if (pdbContent && containerRef.current) {
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const $3DmolMod = await import("3dmol");
          const $3Dmol = $3DmolMod.default || $3DmolMod;

          let viewer = viewerRef.current;
          if (viewer) {
            try {
              viewer.clear();
              viewer.render();
            } catch {
              viewerRef.current = null;
              viewer = null;
            }
          }
          if (!viewer) {
            viewer = $3Dmol.createViewer(containerRef.current, {
              backgroundColor: "rgba(2, 6, 18, 0)",
              antialias: true,
            });
            viewerRef.current = viewer;
          }

          viewer.addModel(pdbContent, "pdb");
          const cartoonStyle = await getCartoonStyle(activeColorRef.current);
          viewer.setStyle({}, { cartoon: cartoonStyle });
          viewer.zoomTo();
          viewer.zoom(0.9);
          viewer.render();

          const model = viewer.getModel();
          const atoms = model.selectedAtoms({});
          const chains = [...new Set(atoms.map((a: any) => a.chain).filter(Boolean))] as string[];
          const residues = new Set(atoms.map((a: any) => `${a.chain}:${a.resi}`)).size;
          setModelInfo({ atoms: atoms.length, chains, residues });
          setCurrentPdb("esmfold-prediction");
        } catch (err: any) {
          setError("Failed to render structure: " + (err.message || "unknown error"));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [pdbContent, getCartoonStyle]);

  const handleSearch = () => {
    const val = searchInput.trim();
    if (!val) return;
    if (/^AF-/.test(val) || /^[OPQ][0-9][A-Z0-9]{3}[0-9]$/.test(val)) {
      loadStructure(val, "alphafold");
    } else {
      loadStructure(val.toUpperCase(), "pdb");
    }
  };

  const handleDiseaseSelect = useCallback(
    (disease: DiseaseTarget) => {
      setSelectedDisease(disease);
      loadStructure(disease.pdbId, "pdb");
    },
    [loadStructure]
  );

  return (
    <Card className="overflow-hidden border-cyan-500/10 shadow-lg shadow-cyan-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Atom className="size-4 text-cyan-400" />
              {selectedDisease ? `${selectedDisease.name} Target` : "3D Structure Viewer"}
            </CardTitle>
            <CardDescription>
              {selectedDisease
                ? `${selectedDisease.targetProtein} — ${selectedDisease.pathogen}`
                : label ?? "Real PDB / AlphaFold molecular visualization"}
            </CardDescription>
          </div>
          {modelInfo && (
            <div className="flex flex-col items-end gap-1">
              <Badge tone="cyan">
                {modelInfo.atoms.toLocaleString()} atoms
              </Badge>
              <Badge tone="emerald">
                {modelInfo.chains.length} chain{modelInfo.chains.length !== 1 ? "s" : ""} · {modelInfo.residues} residues
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!mounted ? (
          <div className="flex h-[28rem] flex-col items-center justify-center gap-3 rounded-xl border border-slate-700/30 bg-slate-950">
            <Atom className="size-8 text-slate-600 animate-pulse" />
            <p className="text-xs text-slate-500">Initializing 3D viewer...</p>
          </div>
        ) : (<>
        <DiseaseSelector onSelect={handleDiseaseSelect} selectedDiseaseId={selectedDisease?.id} />

        {selectedDisease && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/30 bg-gradient-to-r from-slate-900/80 to-slate-950/80 px-3 py-2">
            <Badge tone={selectedDisease.pathogenType === "viral" ? "red" : selectedDisease.pathogenType === "bacterial" ? "blue" : selectedDisease.pathogenType === "parasitic" ? "slate" : "emerald"}>
              {selectedDisease.pathogenType}
            </Badge>
            <span className="text-xs text-slate-400">{selectedDisease.targetProtein}</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-[10px] text-cyan-300/80">PDB: {selectedDisease.pdbId}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">{selectedDisease.drugRelevance}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {PRESET_STRUCTURES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadStructure(preset.id, preset.source)}
              className={`group relative rounded-lg border px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 ${
                currentPdb === preset.id
                  ? "border-cyan-400/60 bg-cyan-400/10 shadow-sm shadow-cyan-400/20"
                  : "border-slate-700/50 bg-slate-900/50 hover:border-cyan-300/40 hover:bg-slate-800/50"
              }`}
            >
              <span>{preset.label}</span>
              <span className="ml-1.5 text-[10px] text-muted-foreground">{preset.id}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="PDB ID (e.g. 1M17) or AlphaFold ID (e.g. AF-P00533-F1)"
            className="flex-1 rounded-md border border-slate-700/50 bg-slate-900/70 px-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
          />
          <Button size="sm" variant="secondary" onClick={handleSearch}>
            <Search className="size-3" /> Load
          </Button>
        </div>

        <div
          ref={wrapperRef}
          className={`relative overflow-hidden rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950 ${
            isFullscreen ? "h-screen" : "h-[28rem]"
          }`}
        >
          <div className="lab-grid-vignette absolute inset-0" />

          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1">
            {(["cartoon", "surface", "stick", "sphere", "line", "cartoon+surface", "sphere+stick", "putty"] as StyleOption[]).map(
              (s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={activeStyle === s ? "primary" : "secondary"}
                  onClick={() => applyStyle(s)}
                  className="text-[10px] px-2 py-1 h-auto backdrop-blur-sm"
                >
                  {s}
                </Button>
              )
            )}
          </div>

          <div className="absolute right-3 top-3 z-10 flex gap-1">
            <div className="flex gap-0.5 rounded-lg border border-slate-700/30 bg-slate-900/80 p-0.5 backdrop-blur-sm">
              {(Object.entries(COLOR_SCHEMES) as [ColorOption, { label: string; icon: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => changeColor(key)}
                  title={val.label}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] transition-all ${
                    activeColor === key
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={containerRef} className="absolute inset-0 z-[1]" />

          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="relative size-10">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
                  <div className="absolute inset-1 animate-spin rounded-full border-2 border-emerald-400/20 border-b-emerald-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                  <Atom className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-cyan-400" />
                </div>
                <p className="text-xs text-slate-400">Loading molecular structure...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute bottom-3 left-3 right-3 z-20 rounded-lg border border-red-500/30 bg-slate-950/95 p-3 backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-red-400">Failed to load structure</p>
                  <p className="mt-0.5 whitespace-pre-line text-[11px] leading-relaxed text-red-400/70">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 z-10 flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Zoom in" onClick={() => viewerRef.current?.zoomIn(1.2)} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              <ZoomIn className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Zoom out" onClick={() => viewerRef.current?.zoomOut(1.2)} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              <ZoomOut className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Reset view" onClick={() => { viewerRef.current?.zoomTo(); viewerRef.current?.zoom(0.9); viewerRef.current?.render(); }} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              <RotateCcw className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle spin"
              onClick={toggleSpin}
              className={`bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80 ${isSpinning ? "text-cyan-400" : ""}`}
            >
              <Maximize2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle labels"
              onClick={toggleLabels}
              className={`bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80 ${showLabels ? "text-cyan-400" : ""}`}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Measure distance"
              onClick={() => { const next = !measureMode; setMeasureMode(next); setMeasurePoints([]); if (viewerRef.current) { viewerRef.current.removeAllLabels(); if (!next && currentPdb) { applyStyle(activeStyle); } viewerRef.current.render(); } }}
              className={`bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80 ${measureMode ? "text-amber-400" : ""}`}
            >
              <Ruler className="size-4" />
            </Button>
          </div>

          <div className="absolute bottom-3 right-3 z-10 flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Capture image" onClick={captureImage} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              <Download className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Fullscreen" onClick={toggleFullscreen} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              {isFullscreen ? <Minimize2 className="size-4" /> : <Layers className="size-4" />}
            </Button>
          </div>

          {measureMode && (
            <div className="absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-lg border border-amber-500/30 bg-slate-950/95 px-3 py-1.5 text-[11px] text-amber-300 backdrop-blur-sm">
              <Ruler className="mr-1 inline size-3" />
              Click two atoms to measure distance ({measurePoints.length}/2)
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl" style={{
            boxShadow: "inset 0 0 80px rgba(2, 6, 18, 0.25), inset 0 0 160px rgba(2, 6, 18, 0.1)"
          }} />
        </div>
        </>)}
      </CardContent>
    </Card>
  );
}
