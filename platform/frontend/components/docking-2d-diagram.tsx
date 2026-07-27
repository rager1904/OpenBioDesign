"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Interaction2D = {
  targetResidue: string;
  targetPosition: number;
  binderResidue: string;
  binderPosition: number;
  type: "hydrogen_bond" | "hydrophobic" | "salt_bridge" | "pi_stacking" | "van_der_waals";
  distance: number;
  energy: number;
};

type Atom = { x: number; y: number; z: number; resseq: number; resname: string; chain: string; ss: string };
type ProjectedAtom = Atom & { px: number; py: number };
type LigandAtom = { x: number; y: number; z: number; name: string; resname: string };

const TYPE_CONFIG: Record<string, { color: string; dash?: string; label: string }> = {
  hydrogen_bond: { color: "#22d3ee", dash: "6,3", label: "H-bond" },
  hydrophobic: { color: "#34d399", label: "Hydrophobic" },
  salt_bridge: { color: "#f59e0b", dash: "4,2", label: "Salt bridge" },
  pi_stacking: { color: "#a78bfa", dash: "8,4", label: "π-stacking" },
  van_der_waals: { color: "#64748b", dash: "2,2", label: "vdW" },
};

const SS_COLORS: Record<string, string> = { H: "#ef4444", E: "#3b82f6", C: "#94a3b8" };

const RESIDUE_COLORS: Record<string, string> = {
  ASP: "#ef4444", GLU: "#ef4444", ARG: "#3b82f6", LYS: "#3b82f6",
  HIS: "#a78bfa", ASN: "#f59e0b", GLN: "#f59e0b", SER: "#22d3ee",
  THR: "#22d3ee", TYR: "#f472b6", PHE: "#34d399", TRP: "#34d399",
  ALA: "#94a3b8", VAL: "#94a3b8", LEU: "#94a3b8", ILE: "#94a3b8",
  CYS: "#fbbf24", MET: "#94a3b8", PRO: "#94a3b8", GLY: "#94a3b8",
};

function residueColor(name: string): string {
  return RESIDUE_COLORS[name.toUpperCase().substring(0, 3)] || "#94a3b8";
}

const KNOWN_LIGANDS = new Set([
  "HOH", "SO4", "PO4", "GOL", "EDO", "ACT", "DMS", "MES", "TRS", "CL",
  "NA", "MG", "CA", "ZN", "MN", "FE", "CU", "CO", "NI", "SCN", "FMT",
  "IPA", "EPE", "BME", "OXY", "MOH", "EOF", "NO3", "K",
]);

function dist3(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function centroid(atoms: { x: number; y: number; z: number }[]): { x: number; y: number; z: number } {
  const n = atoms.length;
  return { x: atoms.reduce((s, a) => s + a.x, 0) / n, y: atoms.reduce((s, a) => s + a.y, 0) / n, z: atoms.reduce((s, a) => s + a.z, 0) / n };
}

function parsePDB(text: string): { caAtoms: Atom[]; ligandAtoms: LigandAtom[] } {
  const caAtoms: Atom[] = [];
  const ligandAtoms: LigandAtom[] = [];
  const lines = text.split("\n");
  const ssMap: Record<number, string> = {};

  for (const line of lines) {
    if (line.startsWith("HELIX")) {
      const s = parseInt(line.substring(21, 25).trim());
      const e = parseInt(line.substring(33, 37).trim());
      for (let i = s; i <= e; i++) ssMap[i] = "H";
    } else if (line.startsWith("SHEET")) {
      const s = parseInt(line.substring(22, 26).trim());
      const e = parseInt(line.substring(33, 37).trim());
      for (let i = s; i <= e; i++) ssMap[i] = "E";
    }
  }

  for (const line of lines) {
    if (line.startsWith("ATOM") && line.substring(12, 16).trim() === "CA") {
      const chain = line.substring(21, 22).trim() || "A";
      const resseq = parseInt(line.substring(22, 26).trim());
      caAtoms.push({
        x: parseFloat(line.substring(30, 38)), y: parseFloat(line.substring(38, 46)), z: parseFloat(line.substring(46, 54)),
        resseq, resname: line.substring(17, 20).trim(), chain, ss: ssMap[resseq] || "C",
      });
    } else if (line.startsWith("HETATM")) {
      const resname = line.substring(17, 20).trim();
      if (!KNOWN_LIGANDS.has(resname)) {
        ligandAtoms.push({
          x: parseFloat(line.substring(30, 38)), y: parseFloat(line.substring(38, 46)), z: parseFloat(line.substring(46, 54)),
          name: line.substring(12, 16).trim(), resname,
        });
      }
    }
  }
  return { caAtoms, ligandAtoms };
}

function pcaProject(atoms: { x: number; y: number; z: number }[]): {
  projected: { x: number; y: number }[];
  scale: number; offsetX: number; offsetY: number;
  minX: number; minY: number; rangeX: number; rangeY: number;
} {
  if (atoms.length < 2) return { projected: atoms.map((a) => ({ x: a.x, y: a.y })), scale: 1, offsetX: 0, offsetY: 0, minX: 0, minY: 0, rangeX: 1, rangeY: 1 };
  const n = atoms.length;
  const c = centroid(atoms);
  const centered = atoms.map((a) => [a.x - c.x, a.y - c.y, a.z - c.z]);

  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const v of centered) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] += v[i] * v[j];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i][j] /= n;

  let evecs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let evals = [0, 0, 0];
  for (let iter = 0; iter < 100; iter++) {
    let maxVal = 0, p = 0, q = 1;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      if (Math.abs(cov[i][j]) > maxVal) { maxVal = Math.abs(cov[i][j]); p = i; q = j; }
    }
    if (maxVal < 1e-10) break;
    const theta = 0.5 * Math.atan2(2 * cov[p][q], cov[p][p] - cov[q][q]);
    const co = Math.cos(theta), si = Math.sin(theta);
    const G = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    G[p][p] = co; G[p][q] = -si; G[q][p] = si; G[q][q] = co;
    const GT = G.map((r) => [...r]);
    const tmp = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) tmp[i][j] += GT[i][k] * cov[k][j];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { cov[i][j] = 0; for (let k = 0; k < 3; k++) cov[i][j] += tmp[i][k] * G[k][j]; }
    const nv = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) nv[i][j] += evecs[i][k] * G[k][j];
    evecs = nv;
  }
  for (let i = 0; i < 3; i++) evals[i] = cov[i][i];

  const order = [0, 1, 2].sort((a, b) => evals[b] - evals[a]);
  const v1 = evecs.map((r) => r[order[0]]);
  const v2 = evecs.map((r) => r[order[1]]);

  const raw = centered.map((a) => ({
    x: a[0] * v1[0] + a[1] * v1[1] + a[2] * v1[2],
    y: a[0] * v2[0] + a[1] * v2[1] + a[2] * v2[2],
  }));

  const minX = Math.min(...raw.map((p) => p.x));
  const maxX = Math.max(...raw.map((p) => p.x));
  const minY = Math.min(...raw.map((p) => p.y));
  const maxY = Math.max(...raw.map((p) => p.y));
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const W = 800, H = 500, PAD = 60;
  const BACKBONE_HEIGHT = H * 0.65;
  const scale = Math.min((W - PAD * 2) / rangeX, (BACKBONE_HEIGHT - PAD) / rangeY);
  const offsetX = PAD + (W - PAD * 2 - rangeX * scale) / 2;
  const offsetY = PAD + (BACKBONE_HEIGHT - PAD - rangeY * scale) / 2;

  const projected = raw.map((p) => ({
    x: offsetX + (p.x - minX) * scale,
    y: offsetY + (p.y - minY) * scale,
  }));

  return { projected, scale, offsetX, offsetY, minX, minY, rangeX, rangeY };
}

type MappedInteraction = Interaction2D & {
  fromX: number; fromY: number;
  toX: number; toY: number;
  fromResidue: string;
  fromResseq: number;
  fromChain: string;
};

type LigandResNode = { res: string; name: string; pos: number; x: number; y: number };

const SVG_W = 800;
const SVG_H = 600;

function getMarkerBase(type: string, active: boolean): string {
  const map: Record<string, [string, string]> = {
    hydrogen_bond: ["url(#arrowCyan)", "url(#arrowCyanBright)"],
    hydrophobic: ["url(#arrowGreen)", "url(#arrowGreenBright)"],
    salt_bridge: ["url(#arrowAmber)", "url(#arrowAmberBright)"],
    pi_stacking: ["url(#arrowPurple)", "url(#arrowPurpleBright)"],
    van_der_waals: ["url(#arrowGray)", "url(#arrowGrayBright)"],
  };
  const pair = map[type] || map.van_der_waals;
  return active ? pair[1] : pair[0];
}

export function DockingInteractionDiagram({
  interactions,
  pdbId,
  targetName = "Target",
  ligandName = "Binder",
}: {
  interactions: Interaction2D[];
  pdbId: string;
  targetName?: string;
  ligandName?: string;
}) {
  const [backbone, setBackbone] = useState<Atom[]>([]);
  const [ligandAtoms, setLigandAtoms] = useState<LigandAtom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoveredResidue, setHoveredResidue] = useState<string | null>(null);
  const [hoveredInteraction, setHoveredInteraction] = useState<number | null>(null);
  const [selectedResidue, setSelectedResidue] = useState<string | null>(null);

  const [dragState, setDragState] = useState<{ key: string; offsetX: number; offsetY: number } | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: SVG_W, h: SVG_H });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://files.rcsb.org/view/${pdbId}.pdb`);
        if (!res.ok) throw new Error(`PDB fetch failed: ${res.status}`);
        const text = await res.text();
        if (cancelled) return;
        const parsed = parsePDB(text);
        setBackbone(parsed.caAtoms);
        setLigandAtoms(parsed.ligandAtoms);
        setDragPositions({});
        setViewBox({ x: 0, y: 0, w: SVG_W, h: SVG_H });
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pdbId]);

  const projected = useMemo(() => {
    if (backbone.length === 0) return null;

    const pca = pcaProject(backbone);
    const allPoints: ProjectedAtom[] = backbone.map((a, i) => ({ ...a, px: pca.projected[i].x, py: pca.projected[i].y }));

    let pocketResidues: Atom[] = [];
    if (ligandAtoms.length > 0) {
      const ligC = centroid(ligandAtoms);
      const byDistance = [...backbone].filter((ca) => dist3(ca, ligC) <= 8.0).sort((a, b) => dist3(a, ligC) - dist3(b, ligC));
      const seen = new Set<string>();
      for (const atom of byDistance) {
        const key = `${atom.chain}:${atom.resseq}`;
        if (!seen.has(key)) { seen.add(key); pocketResidues.push(atom); }
        if (pocketResidues.length >= 15) break;
      }
    }
    if (pocketResidues.length === 0) {
      const mid = Math.floor(backbone.length / 2);
      pocketResidues = backbone.slice(Math.max(0, mid - 5), Math.min(backbone.length, mid + 5));
    }

    const pocketSet = new Set(pocketResidues.map((r) => `${r.chain}:${r.resseq}`));
    const pocket2d = allPoints.filter((p) => pocketSet.has(`${p.chain}:${p.resseq}`));

    const ligandProj = { x: SVG_W / 2, y: SVG_H - 100 };

    const mappedInteractions: MappedInteraction[] = [];
    const pocketByDistance = pocketResidues.slice(0, interactions.length);

    const uniqueBinder = [...new Set(interactions.map((i) => i.binderResidue))];
    const binderSpacing = 40;
    const ligandResNodes: LigandResNode[] = uniqueBinder.map((res, i) => {
      const m = res.match(/^([A-Z]+)(\d+)$/i);
      const name = m ? m[1].toUpperCase() : res;
      const pos = m ? parseInt(m[2]) : 0;
      return {
        res, name, pos,
        x: ligandProj.x + (i - (uniqueBinder.length - 1) / 2) * binderSpacing,
        y: ligandProj.y + Math.sin(i * 0.8) * 5,
      };
    });
    const ligandResMap = new Map(ligandResNodes.map((r) => [r.res, r]));

    for (let i = 0; i < interactions.length; i++) {
      const int = interactions[i];
      const pocketAtom = pocketByDistance[i % pocketByDistance.length];
      if (!pocketAtom) continue;
      const pt = allPoints.find((p) => p.chain === pocketAtom.chain && p.resseq === pocketAtom.resseq);
      if (!pt) continue;
      const ligNode = ligandResMap.get(int.binderResidue);
      if (!ligNode) continue;
      mappedInteractions.push({
        ...int,
        fromX: pt.px, fromY: pt.py, toX: ligNode.x, toY: ligNode.y,
        fromResidue: `${pocketAtom.resname}${pocketAtom.resseq}`, fromResseq: pocketAtom.resseq, fromChain: pocketAtom.chain,
      });
    }

    const segments: { points: ProjectedAtom[]; ss: string }[] = [];
    if (allPoints.length > 0) {
      let current = { points: [allPoints[0]], ss: allPoints[0].ss };
      for (let i = 1; i < allPoints.length; i++) {
        const prev = current.points[current.points.length - 1];
        if (allPoints[i].chain === prev.chain && allPoints[i].resseq === prev.resseq + 1 && allPoints[i].ss === current.ss) {
          current.points.push(allPoints[i]);
        } else {
          segments.push(current);
          current = { points: [allPoints[i]], ss: allPoints[i].ss };
        }
      }
      segments.push(current);
    }

    const mappedResseqs = new Set(mappedInteractions.map((m) => m.fromResidue));

    return { allPoints, pocket2d, mappedInteractions, ligandProj, ligandResNodes, segments, mappedResseqs, pocketResidues };
  }, [backbone, ligandAtoms, interactions]);

  const connectedToHovered = useMemo(() => {
    if (!projected) return { residues: new Set<string>(), interactions: new Set<number>() };
    const { mappedInteractions } = projected;
    const residueIds = new Set<string>();
    const interactionIndices = new Set<number>();

    if (hoveredResidue) {
      for (let i = 0; i < mappedInteractions.length; i++) {
        const m = mappedInteractions[i];
        const resKey = `${m.fromChain}:${m.fromResseq}`;
        if (resKey === hoveredResidue || m.binderResidue === hoveredResidue) {
          interactionIndices.add(i);
          residueIds.add(resKey);
          residueIds.add(m.binderResidue);
        }
      }
    }
    if (hoveredInteraction !== null) {
      const m = mappedInteractions[hoveredInteraction];
      if (m) {
        residueIds.add(`${m.fromChain}:${m.fromResseq}`);
        residueIds.add(m.binderResidue);
      }
    }

    return { residues: residueIds, interactions: interactionIndices };
  }, [hoveredResidue, hoveredInteraction, projected]);

  const getResiduePos = useCallback((key: string, fallbackX: number, fallbackY: number) => {
    const d = dragPositions[key];
    return d ? { x: d.x, y: d.y } : { x: fallbackX, y: fallbackY };
  }, [dragPositions]);

  const handleResidueDragStart = useCallback((key: string, svgX: number, svgY: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = dragPositions[key] || { x: svgX, y: svgY };
    setDragState({ key, offsetX: svgX - pos.x, offsetY: svgY - pos.y });
  }, [dragPositions]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
    const svgY = viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;
    setDragPositions((prev) => ({
      ...prev,
      [dragState.key]: { x: svgX - dragState.offsetX, y: svgY - dragState.offsetY },
    }));
  }, [dragState, viewBox]);

  const handleSvgMouseUp = useCallback(() => { setDragState(null); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    setViewBox((prev) => {
      const newW = Math.max(200, Math.min(2400, prev.w * factor));
      const newH = Math.max(150, Math.min(1800, prev.h * factor));
      return {
        x: prev.x + (prev.w - newW) * mx,
        y: prev.y + (prev.h - newH) * my,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element) !== svgRef.current) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
  }, [viewBox]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;
    setViewBox((prev) => ({ ...prev, x: panStart.current.vx - dx, y: panStart.current.vy - dy }));
  }, [viewBox.w, viewBox.h]);

  const handlePanEnd = useCallback(() => { isPanning.current = false; }, []);
  const handleResetView = useCallback(() => { setViewBox({ x: 0, y: 0, w: SVG_W, h: SVG_H }); }, []);

  if (loading) {
    return (
      <Card className="border-cyan-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="size-4 text-cyan-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><line x1="12" y1="3" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="21" />
              <line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
            </svg>
            2D Docking Interaction Diagram
          </CardTitle>
          <CardDescription>Loading PDB backbone coordinates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">2D Docking Interaction Diagram</CardTitle>
          <CardDescription className="text-red-400">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!projected || projected.allPoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>2D Docking Interaction Diagram</CardTitle>
          <CardDescription>No backbone atoms in PDB {pdbId}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { allPoints, mappedInteractions, ligandProj, ligandResNodes, segments, mappedResseqs, pocketResidues } = projected;
  const labeledResidues = allPoints.filter((p) => mappedResseqs.has(`${p.resname}${p.resseq}`));
  const pocketPts = allPoints.filter((p) => pocketResidues.some((r) => r.chain === p.chain && r.resseq === p.resseq));
  const pocketCx = pocketPts.length > 0 ? pocketPts.reduce((s, a) => s + a.px, 0) / pocketPts.length : SVG_W / 2;
  const pocketCy = pocketPts.length > 0 ? pocketPts.reduce((s, a) => s + a.py, 0) / pocketPts.length : SVG_H / 3;
  const hasHover = hoveredResidue !== null || hoveredInteraction !== null;
  const activeResidues = connectedToHovered.residues;
  const activeInteractions = connectedToHovered.interactions;

  const selectedData = selectedResidue ? mappedInteractions.filter((m) => {
    const resKey = `${m.fromChain}:${m.fromResseq}`;
    return resKey === selectedResidue || m.binderResidue === selectedResidue;
  }) : [];

  const ncTerm = allPoints.length > 1 ? { f: allPoints[0], l: allPoints[allPoints.length - 1] } : null;

  const ligandBbPts = ligandResNodes.map((r) => {
    const pos = getResiduePos(r.res, r.x, r.y);
    return `${pos.x},${pos.y}`;
  }).join(" ");

  let targetZoneLabel = null;
  if (labeledResidues.length > 0) {
    const cx = labeledResidues.reduce((s, a) => s + a.px, 0) / labeledResidues.length;
    const minY = Math.min(...labeledResidues.map((a) => a.py)) - 24;
    targetZoneLabel = { cx, minY };
  }

  let selectedDetail = null;
  if (selectedResidue && selectedData.length > 0) {
    const atom = allPoints.find((p) => `${p.chain}:${p.resseq}` === selectedResidue);
    if (atom) selectedDetail = atom;
  }

  return (
    <Card className="border-cyan-500/10 shadow-lg shadow-cyan-950/20">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <svg className="size-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><line x1="12" y1="3" x2="12" y2="9" /><line x1="12" y1="15" x2="12" y2="21" />
              <line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
            </svg>
            2D Docking Interaction Diagram
          </CardTitle>
          <CardDescription>
            Real backbone from PDB {pdbId} · {backbone.length} residues · Drag residues · Scroll to zoom · Click for details
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="cyan">{mappedInteractions.length} contacts · {pocketResidues.length} pocket</Badge>
          <button onClick={handleResetView} className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400 hover:text-white transition-colors">Reset View</button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-950 via-slate-900/60 to-slate-950 p-3">
          <svg
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            className="w-full min-w-[500px] cursor-grab active:cursor-grabbing"
            style={{ maxHeight: "650px" }}
            onWheel={handleWheel}
            onMouseDown={handlePanStart}
            onMouseMove={(e) => { handleSvgMouseMove(e); handlePanMove(e); }}
            onMouseUp={() => { handleSvgMouseUp(); handlePanEnd(); }}
            onMouseLeave={() => { handleSvgMouseUp(); handlePanEnd(); setHoveredResidue(null); setHoveredInteraction(null); }}
          >
            <defs>
              <filter id="g2-sm"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="g2-md"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="g2-lg"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <filter id="g2-xl"><feGaussianBlur stdDeviation="14" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <radialGradient id="pocketGlow2"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" /><stop offset="40%" stopColor="#f59e0b" stopOpacity="0.06" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
              <radialGradient id="bgGlow2"><stop offset="0%" stopColor="#22d3ee" stopOpacity="0.03" /><stop offset="100%" stopColor="#061126" stopOpacity="0" /></radialGradient>
              <linearGradient id="helixGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#dc2626" /><stop offset="100%" stopColor="#f87171" /></linearGradient>
              <linearGradient id="sheetGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#60a5fa" /></linearGradient>
              <linearGradient id="ligandBarGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0e7490" stopOpacity="0" /><stop offset="30%" stopColor="#0e7490" stopOpacity="0.4" /><stop offset="70%" stopColor="#0e7490" stopOpacity="0.4" /><stop offset="100%" stopColor="#0e7490" stopOpacity="0" /></linearGradient>
              <marker id="aC" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#22d3ee" opacity="0.7" /></marker>
              <marker id="aA" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#f59e0b" opacity="0.7" /></marker>
              <marker id="aG" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#34d399" opacity="0.7" /></marker>
              <marker id="aP" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#a78bfa" opacity="0.7" /></marker>
              <marker id="aW" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#64748b" opacity="0.7" /></marker>
              <marker id="aCb" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#22d3ee" /></marker>
              <marker id="aAb" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#f59e0b" /></marker>
              <marker id="aGb" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#34d399" /></marker>
              <marker id="aPb" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#a78bfa" /></marker>
              <marker id="aWb" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="10" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,3 L0,6 Z" fill="#64748b" /></marker>
            </defs>

            <rect x={viewBox.x - 50} y={viewBox.y - 50} width={viewBox.w + 100} height={viewBox.h + 100} fill="url(#bgGlow2)" />

            {pocketPts.length > 0 && (
              <circle cx={pocketCx} cy={pocketCy} r="65" fill="url(#pocketGlow2)" filter="url(#g2-lg)"
                opacity={hasHover ? 0.4 : 1} style={{ transition: "opacity 0.3s ease" }} />
            )}

            {allPoints.length > 1 && (
              <polyline points={allPoints.map((p) => `${p.px},${p.py}`).join(" ")} fill="none" stroke="#1e293b" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" opacity={hasHover ? 0.2 : 0.6} style={{ transition: "opacity 0.3s ease" }} />
            )}

            {segments.map((seg, si) => (
              <polyline key={`ss-${si}`} points={seg.points.map((p) => `${p.px},${p.py}`).join(" ")} fill="none"
                stroke={seg.ss === "H" ? "url(#helixGrad2)" : seg.ss === "E" ? "url(#sheetGrad2)" : SS_COLORS[seg.ss]}
                strokeWidth={seg.ss === "H" ? 4.5 : seg.ss === "E" ? 4 : 1.5} strokeLinecap="round" strokeLinejoin="round"
                opacity={seg.ss === "C" ? (hasHover ? 0.08 : 0.2) : (hasHover ? 0.25 : 0.85)}
                filter={seg.ss !== "C" ? "url(#g2-sm)" : undefined} style={{ transition: "opacity 0.3s ease" }} />
            ))}

            {pocketPts.filter((p) => !mappedResseqs.has(`${p.resname}${p.resseq}`)).map((p) => {
              const key = `${p.chain}:${p.resseq}`;
              const isActive = activeResidues.has(key);
              return <circle key={`pd-${p.resseq}`} cx={p.px} cy={p.py} r="2.5" fill="#94a3b8"
                opacity={hasHover ? (isActive ? 0.6 : 0.08) : 0.2} style={{ transition: "opacity 0.3s ease" }} />;
            })}

            {mappedInteractions.map((int, i) => {
              const cfg = TYPE_CONFIG[int.type] || TYPE_CONFIG.van_der_waals;
              const isActive = activeInteractions.has(i);
              const isDimmed = hasHover && !isActive;
              const marker = getMarkerBase(int.type, isActive);
              const fromPos = getResiduePos(`${int.fromChain}:${int.fromResseq}`, int.fromX, int.fromY);
              const toLigNode = ligandResNodes.find((r) => r.res === int.binderResidue);
              const toPos = toLigNode ? getResiduePos(int.binderResidue, toLigNode.x, toLigNode.y) : { x: int.toX, y: int.toY };
              const mx = (fromPos.x + toPos.x) / 2;
              const my = (fromPos.y + toPos.y) / 2;
              const dx = toPos.x - fromPos.x;
              const dy = toPos.y - fromPos.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const curvature = (i % 2 === 0) ? 0.25 : -0.25;
              const ctrlX = mx + (-dy / len) * len * curvature;
              const ctrlY = my + (dx / len) * len * curvature;
              const isStrong = int.type === "hydrogen_bond" || int.type === "salt_bridge";

              return (
                <g key={`bond-${i}`} onMouseEnter={() => setHoveredInteraction(i)} onMouseLeave={() => setHoveredInteraction(null)} style={{ cursor: "pointer" }}>
                  <path d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`} fill="none" stroke="transparent" strokeWidth="12" />
                  <path d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                    fill="none" stroke={cfg.color} strokeWidth={isActive ? (isStrong ? 3 : 2.2) : (isStrong ? 2 : 1.2)}
                    strokeDasharray={cfg.dash || "none"} markerEnd={marker}
                    filter={isActive ? "url(#g2-md)" : "url(#g2-sm)"}
                    opacity={isDimmed ? 0.12 : (isActive ? 1 : 0.85)} style={{ transition: "all 0.3s ease" }} />
                  <g opacity={isDimmed ? 0.08 : (isActive ? 1 : 0.95)} style={{ transition: "opacity 0.3s ease" }}>
                    <rect x={mx - 28} y={my - 14} width="56" height="14" rx="7"
                      fill={isActive ? "#0f1f33" : "#0c1322"} stroke={isActive ? cfg.color : "rgba(100,100,100,0.2)"} strokeWidth={isActive ? 1.2 : 0.7} />
                    <text x={mx} y={my - 4} textAnchor="middle" dominantBaseline="central" fill={cfg.color} fontSize={isActive ? "6" : "5.5"} fontWeight="700" fontFamily="monospace">{cfg.label}</text>
                    <text x={mx} y={my + 6} textAnchor="middle" fill="#475569" fontSize="4.5" fontFamily="monospace">{int.distance.toFixed(1)}A · {int.energy.toFixed(1)}</text>
                  </g>
                </g>
              );
            })}

            {labeledResidues.map((a) => {
              const key = `${a.chain}:${a.resseq}`;
              const color = residueColor(a.resname);
              const isActive = activeResidues.has(key);
              const isDimmed = hasHover && !isActive;
              const pos = getResiduePos(key, a.px, a.py);
              return (
                <g key={`lab-${a.chain}-${a.resseq}`}
                  onMouseEnter={() => setHoveredResidue(key)} onMouseLeave={() => setHoveredResidue(null)}
                  onMouseDown={(e) => handleResidueDragStart(key, a.px, a.py, e)}
                  onClick={(e) => { e.stopPropagation(); setSelectedResidue(selectedResidue === key ? null : key); }}
                  style={{ cursor: "grab", opacity: isDimmed ? 0.12 : 1, transition: "opacity 0.3s ease" }}>
                  {isActive && <g><circle cx={pos.x} cy={pos.y} r="22" fill="none" stroke={color} strokeWidth="1" opacity="0.4" filter="url(#g2-xl)" /><circle cx={pos.x} cy={pos.y} r="16" fill={color} opacity="0.06" /></g>}
                  {selectedResidue === key && <circle cx={pos.x} cy={pos.y} r="18" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3,2" filter="url(#g2-md)" />}
                  <circle cx={pos.x} cy={pos.y} r="12" fill={color} opacity={isActive ? 0.2 : 0.08}
                    stroke={isActive ? color : (selectedResidue === key ? "#fbbf24" : color)} strokeWidth={isActive ? 1.5 : 1} filter="url(#g2-sm)" style={{ transition: "all 0.3s ease" }} />
                  <rect x={pos.x - 13} y={pos.y - 8} width="26" height="10" rx="3" fill={color} opacity={isActive ? 0.25 : 0.15} style={{ transition: "opacity 0.3s ease" }} />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="6" fontWeight="700" fontFamily="monospace" style={{ pointerEvents: "none" }}>{a.resname.substring(0, 3).toUpperCase()}</text>
                  <text x={pos.x} y={pos.y + 14} textAnchor="middle" fill={isActive ? color : "#94a3b8"} fontSize="5" fontFamily="monospace" style={{ pointerEvents: "none", transition: "fill 0.3s ease" }}>{a.resseq}</text>
                </g>
              );
            })}

            {ncTerm && (
              <g>
                <circle cx={ncTerm.f.px} cy={ncTerm.f.py} r="7" fill="#22c55e" opacity="0.25" stroke="#22c55e" strokeWidth="1.2" filter="url(#g2-sm)" />
                <text x={ncTerm.f.px} y={ncTerm.f.py + 3} textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="800">N</text>
                <circle cx={ncTerm.l.px} cy={ncTerm.l.py} r="7" fill="#ef4444" opacity="0.25" stroke="#ef4444" strokeWidth="1.2" filter="url(#g2-sm)" />
                <text x={ncTerm.l.px} y={ncTerm.l.py + 3} textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="800">C</text>
              </g>
            )}

            <line x1="80" y1={ligandProj.y - 25} x2={SVG_W - 80} y2={ligandProj.y - 25} stroke="url(#ligandBarGrad2)" strokeWidth="1" />

            {ligandResNodes.length > 1 && (
              <polyline key="lig-bb" points={ligandBbPts} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" filter="url(#g2-sm)" />
            )}

            {ligandResNodes.map((r) => {
              const w = 28, h = 16;
              const pos = getResiduePos(r.res, r.x, r.y);
              const isActive = activeResidues.has(r.res);
              const isDimmed = hasHover && !isActive;
              const pts = [`${pos.x - w / 2 + 4},${pos.y - h / 2}`, `${pos.x + w / 2 - 4},${pos.y - h / 2}`,
                `${pos.x + w / 2},${pos.y}`, `${pos.x + w / 2 - 4},${pos.y + h / 2}`,
                `${pos.x - w / 2 + 4},${pos.y + h / 2}`, `${pos.x - w / 2},${pos.y}`].join(" ");
              return (
                <g key={`lig-${r.res}`} filter={isActive ? "url(#g2-md)" : "url(#g2-sm)"} style={{ opacity: isDimmed ? 0.15 : 1, transition: "opacity 0.3s ease" }}>
                  <polygon points={pts} fill={isActive ? "#134e66" : "#0c4a5e"} opacity={isActive ? 0.7 : 0.5}
                    stroke={isActive ? "#22d3ee" : "#0e7490"} strokeWidth={isActive ? 1.5 : 1} />
                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fill={isActive ? "#a5f3fc" : "#67e8f9"} fontSize="6.5" fontWeight="700" fontFamily="monospace" style={{ pointerEvents: "none" }}>{r.name}{r.pos}</text>
                </g>
              );
            })}

            <line x1="60" y1={SVG_H - 150} x2={SVG_W - 60} y2={SVG_H - 150} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4,4" />

            {targetZoneLabel && (
              <g filter="url(#g2-sm)">
                <rect x={targetZoneLabel.cx - 52} y={targetZoneLabel.minY - 10} width="104" height="18" rx="9"
                  fill="#0c1322" opacity="0.92" stroke="rgba(125, 211, 252, 0.2)" strokeWidth="0.8" />
                <text x={targetZoneLabel.cx} y={targetZoneLabel.minY + 2} textAnchor="middle" dominantBaseline="central" fill="#e2e8f0" fontSize="9" fontWeight="700" fontFamily="sans-serif">{targetName}</text>
              </g>
            )}

            <g filter="url(#g2-sm)">
              <rect x={ligandProj.x - 52} y={ligandProj.y - 42} width="104" height="18" rx="9" fill="#0e7490" opacity="0.4" stroke="#22d3ee" strokeWidth="0.8" />
              <text x={ligandProj.x} y={ligandProj.y - 30} textAnchor="middle" dominantBaseline="central" fill="#67e8f9" fontSize="9" fontWeight="700" fontFamily="sans-serif">{ligandName}</text>
            </g>

            <g transform={`translate(12, ${SVG_H - 72})`}>
              <rect x="-8" y="-12" width="235" height="68" rx="8" fill="#0c1322" opacity="0.92" stroke="rgba(125, 211, 252, 0.08)" strokeWidth="0.6" />
              <text x="0" y="0" fill="#cbd5e1" fontSize="8.5" fontWeight="700" letterSpacing="0.5">INTERACTION TYPES</text>
              {Object.entries(TYPE_CONFIG).map(([key, cfg], i) => (
                <g key={key} transform={`translate(0, ${12 + i * 10})`}>
                  <line x1="0" y1="0" x2="14" y2="0" stroke={cfg.color} strokeWidth="1.5" strokeDasharray={cfg.dash || "none"} />
                  <text x="18" y="3" fill="#94a3b8" fontSize="6.5">{cfg.label}</text>
                </g>
              ))}
              <g transform="translate(100, 0)">
                <text x="0" y="0" fill="#cbd5e1" fontSize="8.5" fontWeight="700" letterSpacing="0.5">STRUCTURE</text>
                <line x1="0" y1="12" x2="14" y2="12" stroke="#ef4444" strokeWidth="4.5" filter="url(#g2-sm)" />
                <text x="18" y="15" fill="#94a3b8" fontSize="6.5">Helix</text>
                <line x1="0" y1="22" x2="14" y2="22" stroke="#3b82f6" strokeWidth="4" filter="url(#g2-sm)" />
                <text x="18" y="25" fill="#94a3b8" fontSize="6.5">Sheet</text>
                <line x1="0" y1="32" x2="14" y2="32" stroke="#94a3b8" strokeWidth="1.5" opacity="0.2" />
                <text x="18" y="35" fill="#94a3b8" fontSize="6.5">Coil</text>
                <circle cx="7" cy="45" r="4" fill="#22c55e" opacity="0.3" stroke="#22c55e" strokeWidth="1" />
                <text x="18" y="48" fill="#94a3b8" fontSize="6.5">N-term</text>
                <circle cx="70" cy="45" r="4" fill="#ef4444" opacity="0.3" stroke="#ef4444" strokeWidth="1" />
                <text x="81" y="48" fill="#94a3b8" fontSize="6.5">C-term</text>
              </g>
            </g>

            <g transform={`translate(${SVG_W - 155}, ${SVG_H - 72})`}>
              <rect x="-8" y="-12" width="155" height="68" rx="8" fill="#0c1322" opacity="0.92" stroke="rgba(125, 211, 252, 0.08)" strokeWidth="0.6" />
              <text x="0" y="0" fill="#cbd5e1" fontSize="8.5" fontWeight="700" letterSpacing="0.5">BINDING SUMMARY</text>
              <text x="0" y="14" fill="#94a3b8" fontSize="7.5">Contacts: {mappedInteractions.length}</text>
              <text x="0" y="24" fill="#94a3b8" fontSize="7.5">H-bonds: {mappedInteractions.filter((m) => m.type === "hydrogen_bond").length}</text>
              <text x="0" y="34" fill="#94a3b8" fontSize="7.5">Hydrophobic: {mappedInteractions.filter((m) => m.type === "hydrophobic").length}</text>
              <text x="0" y="46" fill="#22d3ee" fontSize="8" fontWeight="700">Total: {mappedInteractions.reduce((s, m) => s + m.energy, 0).toFixed(1)} kcal/mol</text>
            </g>

            <g transform={`translate(${SVG_W - 155}, 8)`}>
              <rect x="-8" y="-12" width="155" height="26" rx="8" fill="#0c1322" opacity="0.85" stroke="rgba(125, 211, 252, 0.08)" strokeWidth="0.6" />
              <text x="70" y="2" textAnchor="middle" fill="#64748b" fontSize="6.5" fontFamily="monospace">Scroll to zoom · Drag canvas to pan</text>
            </g>
          </svg>

          {selectedDetail && (
            <div className="absolute right-5 top-5 w-56 rounded-lg border border-slate-700/50 bg-slate-950/95 p-3 text-xs shadow-xl backdrop-blur-sm z-20">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono font-bold text-white">{selectedDetail.resname}{selectedDetail.resseq}</span>
                <button onClick={() => setSelectedResidue(null)} className="text-slate-500 hover:text-white transition-colors">x</button>
              </div>
              <div className="space-y-1 text-slate-400">
                <div>Chain: <span className="text-slate-200">{selectedDetail.chain}</span></div>
                <div>SS: <span className="text-slate-200">{selectedDetail.ss === "H" ? "Alpha-Helix" : selectedDetail.ss === "E" ? "Beta-Sheet" : "Coil"}</span></div>
                <div>Position: <span className="text-slate-200">{selectedDetail.resseq}</span></div>
                <div className="border-t border-slate-800 pt-1 mt-1">
                  <span className="text-slate-300 font-semibold">Interactions ({selectedData.length}):</span>
                </div>
                {selectedData.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: TYPE_CONFIG[m.type]?.color }} />
                    <span className="text-slate-300">{m.binderResidue}</span>
                    <span className="text-slate-500">{m.type.replace("_", " ")}</span>
                    <span className="ml-auto text-slate-500">{m.distance.toFixed(1)}A</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
