"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Search,
  FlaskConical,
  Bug,
  Shield,
  AlertTriangle,
  Dna,
  Leaf,
} from "lucide-react";

export type PathogenType = "viral" | "bacterial" | "parasitic" | "fungal";

export type DiseaseTarget = {
  id: string;
  name: string;
  fullName: string;
  pathogenType: PathogenType;
  pathogen: string;
  pdbId: string;
  targetProtein: string;
  targetDescription: string;
  drugRelevance: string;
  annualDeathsAfrica: string;
};

export const AFRICA_TOP_15_DISEASES: DiseaseTarget[] = [
  {
    id: "hiv",
    name: "HIV/AIDS",
    fullName: "Human Immunodeficiency Virus / Acquired Immunodeficiency Syndrome",
    pathogenType: "viral",
    pathogen: "Human Immunodeficiency Virus 1",
    pdbId: "1HHP",
    targetProtein: "HIV-1 Protease",
    targetDescription: "Aspartyl protease essential for viral maturation and replication",
    drugRelevance: "Target of all protease inhibitors (darunavir, atazanavir, lopinavir)",
    annualDeathsAfrica: "~260,000",
  },
  {
    id: "malaria",
    name: "Malaria",
    fullName: "Plasmodium falciparum Malaria",
    pathogenType: "parasitic",
    pathogen: "Plasmodium falciparum",
    pdbId: "1J3K",
    targetProtein: "PfDHFR-TS",
    targetDescription: "Dihydrofolate reductase-thymidylate synthase in folate biosynthesis",
    drugRelevance: "Target of antifolate antimalarials (pyrimethamine, cycloguanil)",
    annualDeathsAfrica: "~580,000",
  },
  {
    id: "tb",
    name: "Tuberculosis",
    fullName: "Mycobacterium tuberculosis Tuberculosis",
    pathogenType: "bacterial",
    pathogen: "Mycobacterium tuberculosis",
    pdbId: "4TZK",
    targetProtein: "InhA (Enoyl-ACP Reductase)",
    targetDescription: "Fatty acid synthesis II enzyme, essential for mycolic acid biosynthesis",
    drugRelevance: "Target of isoniazid (first-line TB drug) and triclosan",
    annualDeathsAfrica: "~250,000",
  },
  {
    id: "pneumonia",
    name: "Lower Respiratory Infections",
    fullName: "Bacterial and Viral Pneumonia",
    pathogenType: "bacterial",
    pathogen: "Streptococcus pneumoniae",
    pdbId: "2G5V",
    targetProtein: "Pneumococcal CbpA",
    targetDescription: "Choline-binding protein A, adhesin critical for nasopharyngeal colonization",
    drugRelevance: "Target for next-gen pneumococcal vaccines and anti-adhesion therapeutics",
    annualDeathsAfrica: "~200,000",
  },
  {
    id: "diarrhea",
    name: "Diarrheal Diseases",
    fullName: "Cholera and Enteric Infections",
    pathogenType: "bacterial",
    pathogen: "Vibrio cholerae / ETEC",
    pdbId: "1S5F",
    targetProtein: "Cholera Toxin B Subunit",
    targetDescription: "GM1 ganglioside-binding component of cholera toxin complex",
    drugRelevance: "Target for oral cholera vaccines and toxin-neutralizing therapeutics",
    annualDeathsAfrica: "~110,000",
  },
  {
    id: "meningitis",
    name: "Meningitis",
    fullName: "Bacterial Meningitis (Meningococcal)",
    pathogenType: "bacterial",
    pathogen: "Neisseria meningitidis serogroup B",
    pdbId: "4EO9",
    targetProtein: "Factor H Binding Protein (fHbp)",
    targetDescription: "Surface lipoprotein that hijacks host complement regulation",
    drugRelevance: "Antigen in 4CMenB (Bexsero) vaccine; target for complement evasion inhibitors",
    annualDeathsAfrica: "~30,000",
  },
  {
    id: "hepatitis_b",
    name: "Hepatitis B",
    fullName: "Hepatitis B Virus Infection",
    pathogenType: "viral",
    pathogen: "Hepatitis B Virus",
    pdbId: "4ILE",
    targetProtein: "HBV Capsid (Cp149)",
    targetDescription: "Core protein assembling into icosahedral nucleocapsid",
    drugRelevance: "Target of capsid assembly modulators (lenacapavir-class, JNJ-56136379)",
    annualDeathsAfrica: "~70,000",
  },
  {
    id: "hepatitis_c",
    name: "Hepatitis C",
    fullName: "Hepatitis C Virus Infection",
    pathogenType: "viral",
    pathogen: "Hepatitis C Virus genotype 1b",
    pdbId: "4KVG",
    targetProtein: "HCV NS3/4A Protease",
    targetDescription: "Serine protease processing viral polyprotein; 4A cofactor essential for activity",
    drugRelevance: "Target of direct-acting antivirals (glecaprevir, grazoprevir, voxilaprevir)",
    annualDeathsAfrica: "~80,000",
  },
  {
    id: "measles",
    name: "Measles",
    fullName: "Measles Virus Infection",
    pathogenType: "viral",
    pathogen: "Measles virus (Morbillivirus)",
    pdbId: "5Y5Y",
    targetProtein: "Measles Fusion Protein (F)",
    targetDescription: "Class I fusion protein mediating virus-host membrane fusion",
    drugRelevance: "Target of fusion inhibitor peptides; antigen for live-attenuated vaccines",
    annualDeathsAfrica: "~40,000",
  },
  {
    id: "yellow_fever",
    name: "Yellow Fever",
    fullName: "Yellow Fever Virus Infection",
    pathogenType: "viral",
    pathogen: "Yellow Fever Virus (Flavivirus)",
    pdbId: "5DLG",
    targetProtein: "YFV NS2B-NS3 Protease",
    targetDescription: "Two-component serine protease processing viral polyprotein",
    drugRelevance: "Target for pan-flavivirus protease inhibitors; no specific antiviral exists",
    annualDeathsAfrica: "~10,000",
  },
  {
    id: "ebola",
    name: "Ebola",
    fullName: "Ebola Virus Disease",
    pathogenType: "viral",
    pathogen: "Zaire ebolavirus",
    pdbId: "5JQ3",
    targetProtein: "Ebola GP (glycoprotein)",
    targetDescription: "Trimeric surface glycoprotein binding NPC1 receptor for cell entry",
    drugRelevance: "Target of monoclonal antibodies (Inmazeb); basis for rVSV-ZEBOV vaccine",
    annualDeathsAfrica: "~5,000 (epidemic peaks)",
  },
  {
    id: "lassa",
    name: "Lassa Fever",
    fullName: "Lassa Fever (Arenavirus Hemorrhagic Fever)",
    pathogenType: "viral",
    pathogen: "Lassa virus (LASSV)",
    pdbId: "4GH1",
    targetProtein: "Lassa NP (Nucleoprotein)",
    targetDescription: "Nucleoprotein with C-terminal phosphodiesterase domain; RNA synthesis cofactor",
    drugRelevance: "Target for antivirals disrupting NP-SSB interaction; no approved therapy exists",
    annualDeathsAfrica: "~5,000",
  },
  {
    id: "trypanosomiasis",
    name: "Sleeping Sickness",
    fullName: "Human African Trypanosomiasis (HAT)",
    pathogenType: "parasitic",
    pathogen: "Trypanosoma brucei gambiense",
    pdbId: "2PNT",
    targetProtein: "TbPNT (Pteridine Reductase)",
    targetDescription: "NAD(P)H-dependent oxidoreductase in folate/pteridine metabolism",
    drugRelevance: "Target of antifolate drugs; functional analog of DHFR in trypanosomatids",
    annualDeathsAfrica: "~1,000 (near elimination)",
  },
  {
    id: "leishmaniasis",
    name: "Leishmaniasis",
    fullName: "Visceral and Cutaneous Leishmaniasis",
    pathogenType: "parasitic",
    pathogen: "Leishmania donovani / major",
    pdbId: "1DGH",
    targetProtein: "LmDHFR-TS",
    targetDescription: "Bifunctional dihydrofolate reductase-thymidylate synthase",
    drugRelevance: "Target of antifolate antileishmanials; species-specific active site differences",
    annualDeathsAfrica: "~20,000 (visceral)",
  },
  {
    id: "cryptococcosis",
    name: "Cryptococcal Meningitis",
    fullName: "Cryptococcus neoformans Meningoencephalitis",
    pathogenType: "fungal",
    pathogen: "Cryptococcus neoformans",
    pdbId: "1IOL",
    targetProtein: "Inositol Oxygenase (MIOX)",
    targetDescription: "Key enzyme in fungal inositol catabolism and capsule biosynthesis",
    drugRelevance: "Target for novel antifungals; amphotericin B and flucytosine used currently",
    annualDeathsAfrica: "~75,000 (HIV-associated)",
  },
];

export type DiseaseCategory = {
  type: PathogenType;
  label: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  borderColor: string;
};

export const DISEASE_CATEGORIES: Record<PathogenType, DiseaseCategory> = {
  viral: {
    type: "viral",
    label: "Viral",
    icon: AlertTriangle,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  bacterial: {
    type: "bacterial",
    label: "Bacterial",
    icon: FlaskConical,
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  parasitic: {
    type: "parasitic",
    label: "Parasitic",
    icon: Bug,
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.1)",
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  fungal: {
    type: "fungal",
    label: "Fungal",
    icon: Leaf,
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
};

export function DiseaseSelector({
  onSelect,
  selectedDiseaseId,
}: {
  onSelect: (disease: DiseaseTarget) => void;
  selectedDiseaseId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PathogenType | "all">("all");
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const filtered = AFRICA_TOP_15_DISEASES.filter((d) => {
    const matchFilter = activeFilter === "all" || d.pathogenType === activeFilter;
    const matchSearch =
      search === "" ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.pathogen.toLowerCase().includes(search.toLowerCase()) ||
      d.targetProtein.toLowerCase().includes(search.toLowerCase()) ||
      d.pdbId.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const selected = AFRICA_TOP_15_DISEASES.find((d) => d.id === selectedDiseaseId);

  const handleSelect = useCallback(
    (disease: DiseaseTarget) => {
      onSelect(disease);
      setIsOpen(false);
      setSearch("");
    },
    [onSelect]
  );

  const counts = {
    all: AFRICA_TOP_15_DISEASES.length,
    viral: AFRICA_TOP_15_DISEASES.filter((d) => d.pathogenType === "viral").length,
    bacterial: AFRICA_TOP_15_DISEASES.filter((d) => d.pathogenType === "bacterial").length,
    parasitic: AFRICA_TOP_15_DISEASES.filter((d) => d.pathogenType === "parasitic").length,
    fungal: AFRICA_TOP_15_DISEASES.filter((d) => d.pathogenType === "fungal").length,
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
          isOpen
            ? "border-cyan-400/50 bg-cyan-500/10 shadow-glow-sm"
            : "border-slate-700/50 bg-slate-900/60 hover:border-cyan-500/30 hover:bg-slate-800/60"
        }`}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-amber-500/20">
          <Shield className="size-4 text-cyan-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            African Disease Targets
          </p>
          {selected ? (
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: DISEASE_CATEGORIES[selected.pathogenType].color }}
              />
              <span className="truncate text-sm font-semibold text-white">
                {selected.name}
              </span>
              <span className="text-[10px] text-slate-500">PDB: {selected.pdbId}</span>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-slate-400">
              Select from {counts.all} priority diseases across 4 pathogen classes
            </p>
          )}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-700/40 bg-slate-950/98 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-slate-700/30 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/80 px-3 py-2">
              <Search className="size-3.5 text-slate-500" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search diseases, pathogens, proteins..."
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-300">
                  <AlertTriangle className="size-3" />
                </button>
              )}
            </div>

            <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                  activeFilter === "all"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                }`}
              >
                All ({counts.all})
              </button>
              {(Object.entries(DISEASE_CATEGORIES) as [PathogenType, DiseaseCategory][]).map(
                ([type, cat]) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type)}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                        activeFilter === type
                          ? "bg-opacity-20 text-white"
                          : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                      }`}
                      style={
                        activeFilter === type
                          ? { backgroundColor: cat.bgColor, color: cat.color }
                          : {}
                      }
                    >
                      <Icon className="size-3" />
                      {cat.label} ({counts[type]})
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <AlertTriangle className="size-6 text-slate-600" />
                <p className="text-xs text-slate-500">No diseases match your search</p>
              </div>
            ) : (
              <div className="p-1.5">
                {filtered.map((disease) => {
                  const cat = DISEASE_CATEGORIES[disease.pathogenType];
                  const Icon = cat.icon;
                  const isSelected = disease.id === selectedDiseaseId;
                  return (
                    <button
                      key={disease.id}
                      onClick={() => handleSelect(disease)}
                      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all duration-150 ${
                        isSelected
                          ? "bg-cyan-500/10"
                          : "hover:bg-slate-800/50"
                      }`}
                    >
                      <div
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: cat.bgColor, border: `1px solid ${cat.borderColor}` }}
                      >
                        <Icon className="size-3.5" style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{disease.name}</span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                            style={{
                              backgroundColor: cat.bgColor,
                              color: cat.color,
                              border: `1px solid ${cat.borderColor}`,
                            }}
                          >
                            {cat.label}
                          </span>
                          {isSelected && (
                            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-cyan-300">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{disease.pathogen}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                          <span className="font-mono text-cyan-300/80">PDB: {disease.pdbId}</span>
                          <span className="text-slate-600">|</span>
                          <span>{disease.targetProtein}</span>
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                          {disease.drugRelevance}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[9px] font-medium text-slate-600">Deaths/yr</p>
                        <p className="text-[11px] font-bold text-red-400/80">
                          {disease.annualDeathsAfrica}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/30 px-3 py-2">
            <div className="flex flex-wrap gap-2 text-[9px] text-slate-600">
              <span>15 priority diseases</span>
              <span>·</span>
              <span>4 pathogen classes</span>
              <span>·</span>
              <span>Real PDB drug targets</span>
              <span>·</span>
              <span>Source: WHO GBD / IHME 2024</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
