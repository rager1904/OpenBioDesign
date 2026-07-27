"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Atom, Download, Layers, ZoomIn, ZoomOut, RotateCcw, Eye, Maximize2, Minimize2 } from "lucide-react";
import { DiseaseSelector, type DiseaseTarget } from "@/components/disease-selector";

type BindingSite = {
  residues: number[];
  description: string;
  confidence: number;
  method: string;
};

type Candidate = {
  candidate_id: string;
  sequence: string;
  binding_score: number;
  stability_score: number;
  novelty_score: number;
  risk_flags: string[];
};

type Interaction = {
  targetResidue: string;
  targetPosition: number;
  binderResidue: string;
  binderPosition: number;
  type: "hydrogen_bond" | "hydrophobic" | "salt_bridge" | "pi_stacking" | "van_der_waals";
  distance: number;
  energy: number;
};

export function generateInteractions(bindingSite: BindingSite, candidate: Candidate): Interaction[] {
  const types: Interaction["type"][] = ["hydrogen_bond", "hydrophobic", "salt_bridge", "pi_stacking", "van_der_waals"];
  const targetResidues = ["ASP", "GLU", "LYS", "ARG", "HIS", "ASN", "GLN", "SER", "THR", "TYR", "PHE", "TRP", "ALA", "VAL", "LEU", "ILE"];
  const binderResidues = ["ALA", "ARG", "ASN", "ASP", "CYS", "GLN", "GLU", "GLY", "HIS", "ILE", "LEU", "LYS", "MET", "PHE", "PRO", "SER", "THR", "TRP", "TYR", "VAL"];
  const interactions: Interaction[] = [];

  bindingSite.residues.forEach((pos, i) => {
    const type = types[i % types.length];
    const targetRes = targetResidues[i % targetResidues.length];
    const binderRes = binderResidues[(i + 3) % binderResidues.length];
    interactions.push({
      targetResidue: `${targetRes}${pos}`,
      targetPosition: pos,
      binderResidue: `${binderRes}${i + 1}`,
      binderPosition: i + 1,
      type,
      distance: 1.8 + Math.random() * 2.5,
      energy: -1.5 - Math.random() * 3,
    });
  });

  const nearbyResidues = [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
  nearbyResidues.forEach((pos, i) => {
    if (!bindingSite.residues.includes(pos)) {
      const type = types[(i + 2) % types.length];
      const targetRes = targetResidues[(i + 5) % targetResidues.length];
      const binderRes = binderResidues[(i + 7) % binderResidues.length];
      interactions.push({
        targetResidue: `${targetRes}${pos}`,
        targetPosition: pos,
        binderResidue: `${binderRes}${i + 9}`,
        binderPosition: i + 9,
        type,
        distance: 2.5 + Math.random() * 3.5,
        energy: -0.5 - Math.random() * 1.5,
      });
    }
  });

  return interactions.sort((a, b) => a.energy - b.energy);
}

const interactionColors: Record<string, string> = {
  hydrogen_bond: "#22d3ee",
  hydrophobic: "#34d399",
  salt_bridge: "#f59e0b",
  pi_stacking: "#a78bfa",
  van_der_waals: "#94a3b8",
};

const interactionLabels: Record<string, string> = {
  hydrogen_bond: "H-bond",
  hydrophobic: "Hydrophobic",
  salt_bridge: "Salt bridge",
  pi_stacking: "π-stacking",
  van_der_waals: "vdW",
};

export function DockingViewer3D({
  pdbId,
  bindingSite,
  candidate,
}: {
  pdbId: string;
  bindingSite?: BindingSite;
  candidate?: Candidate;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<"binding_site" | "surface" | "interactions" | "hydrophobic" | "cartoon_only">("binding_site");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseTarget | null>(null);
  const [activePdbId, setActivePdbId] = useState(pdbId);

  const bindingSiteKey = bindingSite ? bindingSite.residues.join(",") : "";

  const loadStructure = useCallback(async () => {
    if (!containerRef.current) return;
    setLoading(true);
    setLoadError(null);
    try {
      const $3DmolModule = await import("3dmol");
      const $3Dmol = $3DmolModule.default || $3DmolModule;
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: "rgba(2, 6, 18, 0)",
        antialias: true,
      });
      viewerRef.current = viewer;

      let pdbData: string | null = null;
      try {
        const proxyBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080/api/v1";
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const proxyRes = await fetch(`${proxyBase}/structures/pdb/${activePdbId}`, { signal: controller.signal });
        clearTimeout(timer);
        if (proxyRes.ok) pdbData = await proxyRes.text();
      } catch {
        // proxy unavailable, try direct
      }
      if (!pdbData) {
        const directRes = await fetch(`https://files.rcsb.org/view/${activePdbId}.pdb`);
        if (!directRes.ok) throw new Error(`PDB fetch failed: ${directRes.status}`);
        pdbData = await directRes.text();
      }
      viewer.addModel(pdbData, "pdb");

      viewer.setStyle({}, { cartoon: { color: "#475569", opacity: 0.5, tubes: true } });

      if (bindingSite && bindingSite.residues.length > 0) {
        const sel = { resi: bindingSite.residues };
        viewer.setStyle(sel, { cartoon: { color: "#22d3ee", opacity: 1, tubes: true } });
        viewer.addStyle(sel, { stick: { color: "#22d3ee", radius: 0.18 } });
      }

      viewer.zoomTo();
      viewer.zoom(0.85);
      viewer.render();
    } catch (err) {
      console.error("Failed to load PDB structure:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load structure");
    } finally {
      setLoading(false);
    }
  }, [activePdbId, bindingSiteKey]);

  const applyHighlight = useCallback(
    async (mode: string) => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      setHighlightMode(mode as any);

      viewer.removeAllSurfaces();
      viewer.removeAllLabels();
      viewer.setStyle({}, { cartoon: { color: "#475569", opacity: 0.45, tubes: true } });

      if (bindingSite?.residues.length) {
        if (mode === "binding_site") {
          viewer.setStyle(
            { resi: bindingSite.residues },
            { cartoon: { color: "#22d3ee", opacity: 1, tubes: true }, stick: { color: "#22d3ee", radius: 0.18 } }
          );
          bindingSite.residues.forEach((r) => {
            const atoms = viewer.getModel().selectedAtoms({ resi: r, atom: "CA" });
            if (atoms.length > 0) {
              viewer.addLabel(`${atoms[0].resn}${r}`, {
                position: { x: atoms[0].x, y: atoms[0].y, z: atoms[0].z },
                fontColor: "#67e8f9",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                backgroundOpacity: 0.85,
                borderColor: "rgba(34, 211, 238, 0.5)",
                borderWidth: 1,
                fontSize: 10,
                showBackground: true,
              });
            }
          });
        } else if (mode === "surface") {
          viewer.setStyle({ resi: bindingSite.residues }, { cartoon: { color: "#34d399", opacity: 0.8 } });
          const $3DmolMod = await import("3dmol");
          const $3Dmol = $3DmolMod.default || $3DmolMod;
          viewer.addSurface($3Dmol.SurfaceType.VDW, {
            opacity: 0.4,
            color: "#22d3ee",
          }, { resi: bindingSite.residues });
        } else if (mode === "interactions") {
          const nearby = bindingSite.residues.flatMap((r) => [r - 2, r - 1, r, r + 1, r + 2]);
          const unique = [...new Set(nearby)];
          viewer.setStyle(
            { resi: bindingSite.residues },
            { cartoon: { color: "#22d3ee", opacity: 1, tubes: true }, stick: { color: "#22d3ee", radius: 0.22 } }
          );
          viewer.setStyle(
            { resi: unique.filter((r) => !bindingSite.residues.includes(r)) },
            { cartoon: { color: "#f59e0b", opacity: 0.8, tubes: true }, stick: { color: "#f59e0b", radius: 0.12 } }
          );
          bindingSite.residues.forEach((r) => {
            const atoms = viewer.getModel().selectedAtoms({ resi: r, atom: "CA" });
            if (atoms.length > 0) {
              viewer.addLabel(`${atoms[0].resn}${r}`, {
                position: { x: atoms[0].x, y: atoms[0].y, z: atoms[0].z },
                fontColor: "#22d3ee",
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                backgroundOpacity: 0.9,
                fontSize: 10,
                showBackground: true,
              });
            }
          });
        } else if (mode === "hydrophobic") {
          viewer.setStyle({}, { cartoon: { color: "#475569", opacity: 0.4, tubes: true } });
          const $3DmolMod = await import("3dmol");
          const $3Dmol = $3DmolMod.default || $3DmolMod;
          viewer.addSurface($3Dmol.SurfaceType.VDW, {
            opacity: 0.5,
            map: { prop: "partialCharge", scheme: new $3Dmol.Gradient.RWB(-0.6, 0.6) },
          });
        } else if (mode === "cartoon_only") {
          viewer.setStyle({}, { cartoon: { color: "spectrum", opacity: 0.92, tubes: true } });
        }
      }
      viewer.render();
    },
    [bindingSite]
  );

  const captureImage = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      const uri = viewer.pngURI();
      setCapturedImage(uri);
    } catch {
      // silently fail
    }
  }, []);

  const downloadImage = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      const uri = viewer.pngURI();
      const link = document.createElement("a");
      link.href = uri;
      link.download = `docking-pose-${activePdbId}-${Date.now()}.png`;
      link.click();
    } catch {
      // silently fail
    }
  }, [activePdbId]);

  const toggleSpin = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !isSpinning;
    setIsSpinning(next);
    if (next) viewer.spin("y", 1);
    else viewer.spin(false);
  }, [isSpinning]);

  const toggleLabels = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const next = !showLabels;
    setShowLabels(next);
    if (!next) {
      viewer.removeAllLabels();
      viewer.render();
    }
  }, [showLabels]);

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
    loadStructure();
    return () => {
      viewerRef.current?.clear();
      viewerRef.current = null;
    };
  }, [loadStructure]);

  const handleDiseaseSelect = useCallback(
    (disease: DiseaseTarget) => {
      setSelectedDisease(disease);
      setActivePdbId(disease.pdbId);
    },
    []
  );

  return (
    <Card className="overflow-hidden border-cyan-500/10 shadow-lg shadow-cyan-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Atom className="size-4 text-cyan-400" />
              {selectedDisease ? `${selectedDisease.name} Docking` : "Docking Pose Viewer"}
            </CardTitle>
            <CardDescription>
              {selectedDisease
                ? `${selectedDisease.targetProtein} on ${selectedDisease.pdbId}`
                : `3D binding site visualization on ${activePdbId}`}
            </CardDescription>
          </div>
          {bindingSite && (
            <div className="flex flex-col items-end gap-1">
              <Badge tone="cyan">{bindingSite.residues.length} binding residues</Badge>
              <Badge tone="emerald">{(bindingSite.confidence * 100).toFixed(0)}% confidence</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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

        <div className="flex flex-wrap items-center gap-1">
          {(["binding_site", "surface", "interactions", "hydrophobic", "cartoon_only"] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={highlightMode === mode ? "primary" : "secondary"}
              onClick={() => applyHighlight(mode)}
              className="text-[11px] px-2.5"
            >
              {mode === "binding_site"
                ? "Binding Site"
                : mode === "surface"
                  ? "Surface"
                  : mode === "interactions"
                    ? "Interactions"
                    : mode === "hydrophobic"
                      ? "Electrostatic"
                      : "Cartoon"}
            </Button>
          ))}
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="secondary" onClick={captureImage} className="text-[11px]">
              <Eye className="size-3" /> Snapshot
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadImage} className="text-[11px]">
              <Download className="size-3" /> PNG
            </Button>
          </div>
        </div>

        <div
          ref={wrapperRef}
          className={`relative overflow-hidden rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950 ${
            isFullscreen ? "h-screen" : "h-[28rem]"
          }`}
        >
          <div className="lab-grid-vignette absolute inset-0" />

          <div ref={containerRef} className="absolute inset-0 z-[1]" />

          {loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="relative size-10">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
                  <div className="absolute inset-1 animate-spin rounded-full border-2 border-emerald-400/20 border-b-emerald-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                  <Atom className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-cyan-400" />
                </div>
                <p className="text-xs text-slate-400">Loading docking pose...</p>
              </div>
            </div>
          )}

          {loadError && !loading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 rounded-lg border border-red-500/30 bg-slate-950/95 p-4 text-center backdrop-blur-sm">
                <div className="text-sm text-red-400">{loadError}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                  onClick={() => { setLoadError(null); loadStructure(); }}
                >
                  Retry
                </Button>
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
            <Button size="icon" variant="ghost" aria-label="Reset view" onClick={() => { viewerRef.current?.zoomTo(); viewerRef.current?.zoom(0.85); viewerRef.current?.render(); }} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
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
          </div>

          <div className="absolute bottom-3 right-3 z-10 flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Fullscreen" onClick={toggleFullscreen} className="bg-slate-900/60 backdrop-blur-sm hover:bg-slate-800/80">
              {isFullscreen ? <Minimize2 className="size-4" /> : <Layers className="size-4" />}
            </Button>
          </div>

          <div className="pointer-events-none absolute inset-0 z-[2] rounded-xl" style={{
            boxShadow: "inset 0 0 60px rgba(2, 6, 18, 0.4), inset 0 0 120px rgba(2, 6, 18, 0.2)"
          }} />
        </div>

        {bindingSite && (
          <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Binding Site Details</p>
                <p className="mt-1 text-xs text-muted-foreground">{bindingSite.description}</p>
              </div>
              <Badge tone="cyan" className="text-[10px]">{bindingSite.method}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {bindingSite.residues.map((r) => (
                <span key={r} className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-white">2D Docking Snapshot</p>
              <a
                href={capturedImage}
                download={`docking-pose-${pdbId}-${Date.now()}.png`}
                className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300 transition hover:bg-cyan-500/20"
              >
                <Download className="size-3" /> Download
              </a>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-slate-700/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt={`2D docking pose of ${pdbId}`}
                className="w-full"
              />
              <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "inset 0 0 30px rgba(2, 6, 18, 0.3)" }} />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Captured at {new Date().toLocaleTimeString()} · {highlightMode.replace("_", " ")} view
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InteractionDiagram({
  interactions,
  candidate,
}: {
  interactions: Interaction[];
  candidate?: Candidate;
}) {
  const grouped = interactions.reduce(
    (acc, int) => {
      acc[int.type] = acc[int.type] || [];
      acc[int.type].push(int);
      return acc;
    },
    {} as Record<string, Interaction[]>
  );

  const totalEnergy = interactions.reduce((sum, i) => sum + i.energy, 0);
  const hBonds = grouped["hydrogen_bond"]?.length ?? 0;
  const hydrophobic = grouped["hydrophobic"]?.length ?? 0;
  const saltBridges = grouped["salt_bridge"]?.length ?? 0;

  return (
    <Card className="border-cyan-500/10 shadow-lg shadow-cyan-950/20">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="size-4 text-cyan-400" />
            Interaction Map
          </CardTitle>
          <CardDescription>Residue-level contacts between binder and target</CardDescription>
        </div>
        <Badge tone="emerald">{interactions.length} contacts</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Energy" value={`${totalEnergy.toFixed(1)} kcal/mol`} tone="cyan" />
          <StatCard label="H-Bonds" value={String(hBonds)} tone="blue" />
          <StatCard label="Hydrophobic" value={String(hydrophobic)} tone="emerald" />
          <StatCard label="Salt Bridges" value={String(saltBridges)} tone="white" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(interactionColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 rounded-md border border-slate-700/30 bg-slate-900/50 px-2 py-1 text-xs">
              <span className="size-2 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }} />
              <span className="text-muted-foreground">{interactionLabels[type]} ({grouped[type]?.length ?? 0})</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-700/20">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b border-slate-700/30 bg-slate-900/50">
                <th className="px-3 py-2.5 font-medium">Target</th>
                <th className="px-3 py-2.5 font-medium">Binder</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Distance</th>
                <th className="px-3 py-2.5 font-medium">Energy</th>
              </tr>
            </thead>
            <tbody>
              {interactions.map((int, i) => (
                <tr key={i} className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30">
                  <td className="px-3 py-2 font-medium text-white">{int.targetResidue}</td>
                  <td className="px-3 py-2 text-slate-300">{int.binderResidue}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: interactionColors[int.type], boxShadow: `0 0 4px ${interactionColors[int.type]}60` }} />
                      {interactionLabels[int.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">{int.distance.toFixed(1)} A</td>
                  <td className={`px-3 py-2 font-mono ${int.energy < -2 ? "text-cyan-100" : "text-muted-foreground"}`}>{int.energy.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
            <p className="mb-2 text-xs font-medium text-slate-400">Binding Energy</p>
            <Progress value={Math.min(100, Math.abs(totalEnergy) * 5)} />
            <p className="mt-2 text-sm font-semibold text-cyan-100">{totalEnergy.toFixed(1)} kcal/mol</p>
          </div>
          {candidate && (
            <>
              <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
                <p className="mb-2 text-xs font-medium text-slate-400">Binding Score</p>
                <Progress value={candidate.binding_score * 100} />
                <p className="mt-2 text-sm font-semibold text-cyan-100">{(candidate.binding_score * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-4">
                <p className="mb-2 text-xs font-medium text-slate-400">Stability</p>
                <Progress value={candidate.stability_score * 100} />
                <p className="mt-2 text-sm font-semibold text-cyan-100">{(candidate.stability_score * 100).toFixed(1)}%</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "cyan" | "emerald" | "blue" | "white" }) {
  const colorMap = {
    cyan: "text-cyan-100",
    emerald: "text-emerald-300",
    blue: "text-blue-300",
    white: "text-white",
  };
  const glowMap = {
    cyan: "shadow-cyan-400/10",
    emerald: "shadow-emerald-400/10",
    blue: "shadow-blue-400/10",
    white: "",
  };
  return (
    <div className={`rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-3 shadow-lg ${glowMap[tone]}`}>
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${colorMap[tone]}`}>{value}</p>
    </div>
  );
}
