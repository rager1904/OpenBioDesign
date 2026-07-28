"use client";

import { useState } from "react";

const RESIDUE_PROPERTIES: Record<string, { color: string; label: string }> = {
  A: { color: "bg-amber-900/60 text-amber-200", label: "Ala" },
  V: { color: "bg-amber-900/60 text-amber-200", label: "Val" },
  L: { color: "bg-amber-900/60 text-amber-200", label: "Leu" },
  I: { color: "bg-amber-900/60 text-amber-200", label: "Ile" },
  M: { color: "bg-amber-900/60 text-amber-200", label: "Met" },
  F: { color: "bg-purple-900/60 text-purple-200", label: "Phe" },
  W: { color: "bg-purple-900/60 text-purple-200", label: "Trp" },
  P: { color: "bg-orange-900/60 text-orange-200", label: "Pro" },
  G: { color: "bg-slate-700/60 text-slate-300", label: "Gly" },
  S: { color: "bg-sky-900/60 text-sky-200", label: "Ser" },
  T: { color: "bg-sky-900/60 text-sky-200", label: "Thr" },
  C: { color: "bg-yellow-900/60 text-yellow-200", label: "Cys" },
  Y: { color: "bg-purple-900/60 text-purple-200", label: "Tyr" },
  N: { color: "bg-green-900/60 text-green-200", label: "Asn" },
  Q: { color: "bg-green-900/60 text-green-200", label: "Gln" },
  D: { color: "bg-red-900/60 text-red-200", label: "Asp" },
  E: { color: "bg-red-900/60 text-red-200", label: "Glu" },
  K: { color: "bg-blue-900/60 text-blue-200", label: "Lys" },
  R: { color: "bg-blue-900/60 text-blue-200", label: "Arg" },
  H: { color: "bg-cyan-900/60 text-cyan-200", label: "His" },
};

function getResidueClass(residue: string): string {
  return RESIDUE_PROPERTIES[residue]?.color ?? "bg-slate-800 text-slate-400";
}

const PAGE_SIZE = 100;

export function SequenceViewer({
  sequence,
  bindingSites,
  highlightPositions,
}: {
  sequence: string;
  bindingSites?: number[];
  highlightPositions?: number[];
}) {
  const [page, setPage] = useState(0);
  const [selectedResidue, setSelectedResidue] = useState<{ pos: number; aa: string } | null>(null);

  if (!sequence || sequence.length === 0) {
    return (
      <div className="rounded-lg border bg-slate-950/60 p-3 text-sm text-muted-foreground" aria-label="Protein sequence viewer">
        Submit a protein target with a sequence to visualize residues here.
      </div>
    );
  }

  const totalLength = sequence.length;
  const totalPages = Math.ceil(totalLength / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, totalLength);
  const residues = sequence.slice(start, end).split("");
  const highlightSet = new Set(bindingSites ?? highlightPositions ?? []);

  return (
    <div className="rounded-lg border bg-slate-950/60 p-3" aria-label="Protein sequence viewer">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Residues {start + 1}–{end} of {totalLength}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="rounded border px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            |&lt;
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded border px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            &lt;
          </button>
          <span className="text-xs text-slate-500">{page + 1}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded border px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            &gt;
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="rounded border px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            &gt;|
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-10 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="text-center">
            {start + i * (PAGE_SIZE / 10)}+{(PAGE_SIZE / 10)}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-[2px]" style={{ lineHeight: "1" }}>
        {residues.map((residue, index) => {
          const position = start + index + 1;
          const isBindingSite = highlightSet.has(position);
          return (
            <span
              key={`${position}`}
              title={`${residue}${position}`}
              onClick={() => setSelectedResidue(selectedResidue?.pos === position ? null : { pos: position, aa: residue })}
              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[11px] font-bold transition ${
                isBindingSite
                  ? "bg-cyan-400 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                  : getResidueClass(residue)
              } ${selectedResidue?.pos === position ? "ring-2 ring-white" : ""}`}
            >
              {residue}
            </span>
          );
        })}
      </div>

      {selectedResidue && (
        <div className="mt-2 rounded border border-slate-700 bg-slate-900 p-2 text-xs">
          <span className="font-mono font-bold text-cyan-300">
            {selectedResidue.aa}{selectedResidue.pos}
          </span>
          <span className="ml-2 text-slate-400">
            {RESIDUE_PROPERTIES[selectedResidue.aa]?.label ?? "Unknown"} · Position {selectedResidue.pos}
            {highlightSet.has(selectedResidue.pos) ? " · Binding site" : ""}
          </span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-amber-900" />Hydrophobic</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-sky-900" />Polar</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-900" />Negative</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-blue-900" />Positive</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-cyan-400" />Binding site</span>
      </div>
    </div>
  );
}
