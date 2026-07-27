const activeResidues = new Set([858, 790, 797, 745, 762, 831, 855, 861]);

export function SequenceViewer({ sequence }: { sequence: string }) {
  if (!sequence || sequence.length === 0) {
    return (
      <div className="rounded-lg border bg-slate-950/60 p-3 text-sm text-muted-foreground" aria-label="Protein sequence viewer">
        Submit a protein target with a sequence to visualize residues here.
      </div>
    );
  }
  const residues = sequence.slice(700, 900).split("");
  return (
    <div className="sequence-grid rounded-lg border bg-slate-950/60 p-3" aria-label="Protein sequence viewer">
      {residues.map((residue, index) => {
        const position = 701 + index;
        const active = activeResidues.has(position);
        return (
          <span
            key={`${position}-${residue}`}
            title={`${residue}${position}`}
            className={`flex h-7 items-center justify-center rounded text-xs font-semibold ${
              active ? "bg-cyan-300 text-slate-950 shadow-glow" : "bg-slate-900 text-slate-300"
            }`}
          >
            {residue}
          </span>
        );
      })}
    </div>
  );
}
