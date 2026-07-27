import type {
  Candidate,
  ChatMessage,
  DockingPose,
  GraphEdge,
  GraphNode,
  Metric,
  Project,
  ProteinTarget,
  ResearchActivity,
  WorkflowStep,
} from "@/lib/types";

export const metrics: Metric[] = [
  { label: "Active Projects", value: "18", delta: "+4 this month", tone: "cyan" },
  { label: "Targets Under Investigation", value: "42", delta: "11 high confidence", tone: "blue" },
  { label: "Proteins Analyzed", value: "3,284", delta: "+19.6%", tone: "emerald" },
  { label: "Generated Molecules", value: "12,908", delta: "834 ranked", tone: "white" },
  { label: "Successful Docking Candidates", value: "276", delta: "32 ready for assays", tone: "emerald" },
  { label: "AI Recommendations", value: "64", delta: "9 urgent reviews", tone: "cyan" },
];

export const projects: Project[] = [
  {
    id: "obd-onc-042",
    name: "EGFR allosteric binder campaign",
    target: "EGFR L858R",
    objective: "Design selective binders against kinase domain escape variants.",
    status: "running",
    owner: "Cancer Biology Team",
    progress: 72,
    updatedAt: "Today 14:20",
  },
  {
    id: "obd-imm-017",
    name: "PD-L1 interface disruptor",
    target: "CD274",
    objective: "Prioritize manufacturable candidates with conserved interface contacts.",
    status: "completed",
    owner: "Immunology Lab",
    progress: 100,
    updatedAt: "Yesterday 18:05",
  },
  {
    id: "obd-neuro-009",
    name: "Alpha-synuclein aggregation modulator",
    target: "SNCA",
    objective: "Screen stabilizing binders against oligomerization-prone regions.",
    status: "queued",
    owner: "Neurodegeneration Unit",
    progress: 18,
    updatedAt: "Jun 12, 2026",
  },
];

export const target: ProteinTarget = {
  accession: "P00533",
  proteinName: "Epidermal growth factor receptor",
  geneName: "EGFR",
  organism: "Homo sapiens",
  sequence:
    "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTCPPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGIGIGEFKDSLSINATNIKHFKNCTSISGDLHILPVAFRGDSFTHTPPLDPQELDILKTVKEITGFLLIQAWPENRTDLHAFENLEIIRGRTKQHGQFSLAVVSLNITSLGLRSLKEISDGDVIISGNKNLCYANTINWKKLFGTSGQKTKIISNRGENSCKATGQVCHALCSPEGCWGPEPRDCVSCRNVSRGRECVDKCNLLEGEPREFVENSECIQCHPECLPQAMNITCTGRGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHVCHLCHPNCTYGCTGPGLEGCPTNGPKIPSIATGMVGALLLLLVVALGIGLFMRRRHIVRKRTLRRLLQERELVEPLTPSGEAPNQALLRILKETEFKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA",
  domains: [
    { name: "Extracellular ligand-binding", start: 25, end: 621, confidence: 0.92 },
    { name: "Transmembrane helix", start: 646, end: 668, confidence: 0.98 },
    { name: "Tyrosine kinase", start: 712, end: 968, confidence: 0.95 },
    { name: "Regulatory tail", start: 969, end: 1210, confidence: 0.77 },
  ],
  mutations: [
    { residue: "L858R", effect: "Activating kinase mutation; shifts ATP pocket dynamics.", risk: "high" },
    { residue: "T790M", effect: "Gatekeeper substitution associated with inhibitor resistance.", risk: "high" },
    { residue: "C797S", effect: "Reduces covalent inhibitor engagement.", risk: "medium" },
  ],
  diseases: ["Non-small cell lung cancer", "Glioblastoma", "Head and neck squamous carcinoma"],
  references: [
    { title: "EGFR kinase domain variants and therapeutic resistance", source: "PubMed", confidence: 0.91 },
    { title: "UniProt reviewed EGFR functional annotation", source: "UniProtKB", confidence: 0.96 },
    { title: "AlphaFold predicted EGFR kinase confidence model", source: "AlphaFold DB", confidence: 0.84 },
  ],
};

export const candidates: Candidate[] = [
  {
    id: "OBD-EGFR-BND-041",
    sequence: "GSHMDELYKQAVKELKDLGVEFNKQIKELEKQGA",
    confidence: 0.86,
    novelty: 0.79,
    developability: 0.82,
    affinity: 0.91,
    risk: "low",
    explanation: "Balanced interface polarity with low aggregation propensity and conserved pocket contact coverage.",
  },
  {
    id: "OBD-EGFR-BND-058",
    sequence: "MGSSHHHHHHSSGLVPRGSHMELRQLVRDAENL",
    confidence: 0.81,
    novelty: 0.88,
    developability: 0.74,
    affinity: 0.87,
    risk: "medium",
    explanation: "High novelty scaffold, but histidine-rich segment requires expression and immunogenicity review.",
  },
  {
    id: "OBD-EGFR-BND-063",
    sequence: "AQKLLDQLKDAVNDLTSQYQEKLAKLDETGL",
    confidence: 0.78,
    novelty: 0.69,
    developability: 0.9,
    affinity: 0.83,
    risk: "low",
    explanation: "Developability profile is strongest; predicted affinity is moderate but experimentally tractable.",
  },
];

export const dockingPoses: DockingPose[] = [
  { id: "pose-01", candidate: "OBD-EGFR-BND-041", bindingEnergy: -12.4, dockingScore: 0.91, hydrogenBonds: 7, pocketOccupancy: 0.88, confidence: 0.86 },
  { id: "pose-02", candidate: "OBD-EGFR-BND-058", bindingEnergy: -10.7, dockingScore: 0.83, hydrogenBonds: 5, pocketOccupancy: 0.79, confidence: 0.8 },
  { id: "pose-03", candidate: "OBD-EGFR-BND-063", bindingEnergy: -9.8, dockingScore: 0.78, hydrogenBonds: 4, pocketOccupancy: 0.74, confidence: 0.76 },
];

export const workflowSteps: WorkflowStep[] = [
  { name: "Target Analysis", status: "completed", progress: 100, agent: "Protein Analysis Agent" },
  { name: "Structure Prediction", status: "completed", progress: 100, agent: "OpenFold Adapter" },
  { name: "Binder Generation", status: "running", progress: 72, agent: "RFdiffusion Adapter" },
  { name: "Docking", status: "running", progress: 48, agent: "DiffDock Adapter" },
  { name: "Validation", status: "queued", progress: 16, agent: "Scientific Reasoning Agent" },
  { name: "Report Generation", status: "queued", progress: 8, agent: "Report Agent" },
];

export const activity: ResearchActivity[] = [
  { time: "14:20", title: "Binder candidate ranked", detail: "OBD-EGFR-BND-041 moved to assay shortlist.", status: "completed" },
  { time: "13:58", title: "Docking batch started", detail: "36 poses submitted with seed 42 and immutable inputs.", status: "running" },
  { time: "12:31", title: "Evidence package updated", detail: "3 UniProt and 5 PubMed references linked.", status: "completed" },
  { time: "11:44", title: "Structure prediction queued", detail: "AlphaFold-derived kinase model comparison pending.", status: "queued" },
];

export const graphNodes: GraphNode[] = [
  { id: "EGFR", label: "EGFR", type: "gene", x: 48, y: 44 },
  { id: "P00533", label: "EGFR protein", type: "protein", x: 33, y: 24 },
  { id: "NSCLC", label: "NSCLC", type: "disease", x: 68, y: 28 },
  { id: "BND041", label: "BND-041", type: "compound", x: 30, y: 67 },
  { id: "MAPK", label: "MAPK pathway", type: "pathway", x: 74, y: 65 },
  { id: "PMID", label: "Publication set", type: "publication", x: 52, y: 78 },
];

export const graphEdges: GraphEdge[] = [
  { source: "EGFR", target: "P00533", relation: "encodes" },
  { source: "EGFR", target: "NSCLC", relation: "associated_with" },
  { source: "BND041", target: "P00533", relation: "binds" },
  { source: "P00533", target: "MAPK", relation: "activates" },
  { source: "PMID", target: "EGFR", relation: "supports" },
];

export const chartData = [
  { name: "Mon", affinity: 62, confidence: 71, risk: 22 },
  { name: "Tue", affinity: 68, confidence: 74, risk: 19 },
  { name: "Wed", affinity: 76, confidence: 79, risk: 17 },
  { name: "Thu", affinity: 82, confidence: 83, risk: 14 },
  { name: "Fri", affinity: 91, confidence: 86, risk: 11 },
  { name: "Sat", affinity: 87, confidence: 88, risk: 10 },
];

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "I reviewed the EGFR campaign. The strongest next step is to validate OBD-EGFR-BND-041 with SPR and thermal shift assays before expanding mutations around L858R/T790M.",
    citations: ["UniProtKB:P00533", "AlphaFold DB:P00533", "Internal experiment obd-onc-042"],
  },
];
