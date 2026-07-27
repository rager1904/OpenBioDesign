# OpenBioDesign: Valuation & Investment Analysis

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Valuation Assessment](#current-valuation-assessment)
3. [Comparable Company Landscape](#comparable-company-landscape)
4. [Current Asset Inventory](#current-asset-inventory)
5. [Investment Attraction by Stage](#investment-attraction-by-stage)
6. [Detailed Stage Analysis](#detailed-stage-analysis)
7. [Market Context](#market-context)
8. [Valuation Maximizers](#valuation-maximizers)
9. [Risk Factors](#risk-factors)
10. [Summary](#summary)

---

## Executive Summary

OpenBioDesign is currently a **pre-seed to seed-stage platform** with a production-quality codebase but no real ML models, no published results, no pharma partnerships, and no team beyond founders. Based on comparable company analysis across 30+ AI drug discovery and AI protein design startups funded in 2024-2026, the platform's current valuation ranges from **$3M to $10M**.

The critical valuation inflection point occurs at **Phase 2 completion** (real model integration), where the platform transitions from "interesting prototype" to "credible drug discovery tool" and can realistically target a **$25M-$75M seed round**.

Full completion of the drug discovery evolution roadmap (Phases 1-7) positions the platform for a **$300M-$800M valuation** at Series A/B, with potential for **$1B+ with pharma partnerships and clinical data**.

---

## Current Valuation Assessment

### Valuation Methods

| Method | Estimate | Rationale |
|--------|----------|-----------|
| **Comparable (Pre-Seed)** | **$2M - $5M** | Working prototype with no models, no team, no revenue. Comparable to Mandrake Bio ($2.1M pre-seed) or Ternary Therapeutics ($4.5M seed) |
| **Comparable (Seed Early)** | **$5M - $15M** | If packaged as a SaaS platform with 2+ cofounders. Comparable to Topos Bio ($10.5M) or Tamarind Bio ($13.6M) |
| **Comparable (Seed Mid)** | **$15M - $30M** | If with published benchmarks and early pharma interest. Comparable to Boltz ($28M) or Scala Biodesign ($21.5M) |
| **Asset Value (Code)** | **$500K - $2M** | ~50K lines of production code, 89% test coverage, full stack. Code repos sell for $1-3/line for quality code |
| **IP Value** | **$1M - $5M** | Architecture, agent contracts, domain model, provenance system. Not patented, but defensible |
| **Realistic Current Valuation** | **$3M - $10M** | Pre-seed to seed stage. Working platform, no models, no revenue, no team |

### What Drives Current Value

```
POSITIVE FACTORS (what exists):
  + Full Next.js frontend (13 pages)
  + FastAPI backend (16 API endpoints)
  + 5 scientific agent contracts with ABC interfaces
  + 2 real-data source agents (UniProt, PDB, AlphaFold, Europe PMC)
  + Knowledge graph infrastructure (Neo4j + SQL fallback)
  + Vector store (Qdrant + in-memory)
  + Experiment provenance system (input hashing, audit trail)
  + RBAC + audit logging (enterprise-grade security foundation)
  + 89.6% test coverage (above industry average)
  + Content-addressed artifact storage
  + Model adapter framework (GPU-ready contracts)
  + Docker Compose + Helm charts (deployment-ready)
  + Alembic migrations (schema-managed)
  + Prometheus metrics (observability foundation)
  + Complete domain model with scientific rigor

NEGATIVE FACTORS (what's missing):
  - No real ML models (deterministic baselines only)
  - No published results or benchmarks
  - No pharma partnerships or customers
  - No wet-lab validation
  - No clinical-stage assets
  - No team (solo/founders only)
  - No revenue or funding
  - No grant funding
  - No open-source community
  - No published papers
  - No patent protection
```

---

## Comparable Company Landscape

### Tier 1: Mega-Platforms ($1B+ Valuation)

```
+--------------------------------------------------------------------------+
|  COMPANY              | TOTAL RAISED  | LATEST VAL   | STATUS           |
|  ==================== | ============= | ============ | ================  |
|  Isomorphic Labs      | $2.7B         | ~$10B+ est   | Series B (2026)  |
|  (Alphabet spinout)   |               |              |                  |
|  Chai Discovery       | $630M         | $3.8B        | Series C (2026)  |
|  (OpenAI-backed)      |               |              |                  |
|  Xaira Therapeutics   | $1B           | $2B+ est     | Series A (2024)  |
|  Insilico Medicine    | ~$400M        | $1B          | Series E (2025)  |
|  Lila Sciences        | $350M         | $1B+ est     | Series A (2025)  |
|  Earendil Labs        | $787M         | $2B+ est     | Financing (2026) |
+--------------------------------------------------------------------------+

WHAT THEY HAVE:
  - Published frontier models (AlphaFold-based, Chai-2/3, etc.)
  - Pharma partnerships (Novartis, Eli Lilly, Pfizer, Takeda)
  - Clinical-stage assets
  - 100+ person teams
  - Billions in funding
  - Founded by world-class scientists (DeepMind, OpenAI alumni)
```

### Tier 2: Growth-Startups ($100M-$500M Raised)

```
+--------------------------------------------------------------------------+
|  COMPANY              | TOTAL RAISED  | LATEST ROUND | FOCUS            |
|  ==================== | ============= | ============ | ================  |
|  Profluent           | $150M         | $106M Ser B  | Protein design   |
|  AI Proteins         | $59.7M        | $41.5M Ser A | De novo proteins |
|  Cradle              | $102M         | $73M Ser B   | Protein eng.     |
|  Galux               | $47M          | $29M Ser B   | Protein design   |
|  Converge Bio        | $30M          | $25M Ser A   | AI drug discovery|
|  Medra               | $52M          | $52M Ser A   | AI + robotic lab |
|  Alloy Therapeutics  | $174M         | $40M Ser E   | AI biologics     |
+--------------------------------------------------------------------------+

WHAT THEY HAVE:
  - Working models with published results
  - Pharma partnerships (Profluent: Eli Lilly, $2.25B milestones)
  - Some wet-lab validation
  - Funded teams (20-100+ people)
  - Revenue or clear path to revenue
```

### Tier 3: Early-Stage ($5M-$50M Raised)

```
+--------------------------------------------------------------------------+
|  COMPANY              | TOTAL RAISED  | LATEST ROUND | FOCUS            |
|  ==================== | ============= | ============ | ================  |
|  Boltz                | $28M          | $28M Seed    | Biomolecular AI  |
|  Latent Labs          | $50M          | $50M Seed    | Protein design   |
|  Scala Biodesign      | $21.5M        | $16M Ser A   | Protein design   |
|  Tamarind Bio         | $13.6M        | $13.6M Ser A | AI infrastructure|
|  Topos Bio            | $10.5M        | $10.5M Seed  | Disordered prot. |
|  Antiverse            | $9.3M         | $9.3M Ser A  | Antibody design  |
|  Generare             | $23M          | $23M Ser A   | Molecular disc.  |
|  Manas AI             | $24.6M        | $24.6M Seed  | Oncology + rare  |
|  Bioptimus            | $41M          | $41M Seed    | Biology FMs      |
|  Variational AI       | $5.5M         | $5.5M Seed   | Small molecules  |
+--------------------------------------------------------------------------+

WHAT THEY HAVE:
  - Working prototypes with some published results
  - Small teams (5-30 people)
  - Early customer/partner interest
  - Clear technical thesis
  - Some grant or accelerator funding
```

### Tier 4: Pre-Seed / Idea ($0-$5M Raised)

```
+--------------------------------------------------------------------------+
|  COMPANY              | TOTAL RAISED  | LATEST ROUND | FOCUS            |
|  ==================== | ============= | ============ | ================  |
|  Ternary Therapeutics | $4.5M         | $4.5M Seed   | Molecular glues  |
|  Mandrake Bio         | ~$2.1M        | Pre-seed     | Gene editing     |
|  Various stealth      | <$5M          | Various      | Various          |
+--------------------------------------------------------------------------+

WHAT THEY HAVE:
  - Early prototypes or concept validation
  - Founding team assembled
  - Clear problem statement
  - No published results yet
```

### Market Position Map

```
                    HIGH TECHNICAL MATURITY
                           |
                           |
  Isomorphic Labs         |         Chai Discovery
  Xaira Therapeutics      |         Lila Sciences
  Insilico Medicine       |         Earendil Labs
                           |
                           |
    Profluent             |         AI Proteins
    Cradle                |         Medra
    Galux                 |         Alloy Therapeutics
                           |
                           |
    Boltz                 |         Converge Bio
    Latent Labs           |         Tamarind Bio
    Scala Biodesign       |         Topos Bio
                           |
                           |
    Ternary               |         <<< OpenBioDesign >>>
    Mandrake Bio          |         (NOW)
                           |
                           |
                    LOW TECHNICAL MATURITY
                           |
    LOW FUNDING -----------+----------- HIGH FUNDING
```

---

## Current Asset Inventory

### Technical Assets (Comparable to Funded Companies)

| Asset | OpenBioDesign | Comparable Company | Comparable Value |
|-------|--------------|-------------------|------------------|
| Full frontend (13 pages) | Yes | Scala Biodesign (ScalaOS) | $21.5M raised |
| Backend (16 endpoints) | Yes | Converge Bio | $30M raised |
| 5 agent contracts | Yes | Boltz (agent framework) | $28M raised |
| 2 real-data agents | Yes | Tamarind Bio (infrastructure) | $13.6M raised |
| Knowledge graph | Yes | Converge Bio (KG) | $30M raised |
| Experiment provenance | Yes | Better than most seed cos | Premium feature |
| 89.6% test coverage | Yes | Above industry average | Credibility signal |
| Deployment-ready | Yes | Docker + Helm | Standard |
| Model adapter framework | Yes | GPU-ready contracts | Infra foundation |

### What It Lacks (vs. Funded Competitors)

| Gap | Impact | Comparable Gap |
|-----|--------|----------------|
| No real ML models | **Critical** | Boltz has Boltz-2, Chai has Chai-3 |
| No published results | **Critical** | Most Tier 3+ have benchmarks |
| No pharma partnerships | **High** | Profluent has Eli Lilly ($2.25B) |
| No wet-lab validation | **High** | AI Proteins has BMS ($400M) |
| No clinical assets | **Critical** | Insilico has multiple in trials |
| No team beyond founders | **High** | Most have 10-100+ people |
| No revenue/customers | **Medium** | Most have early revenue |
| No grant funding | **Medium** | Many have NIH/DOE grants |
| No published papers | **High** | Most have preprints/papers |
| No open-source community | **Medium** | Boltz is open-source |
| No patent protection | **Low-Medium** | Most file provisional patents |

---

## Investment Attraction by Stage

### Valuation Progression

```
+--------------------------------------------------------------------------+
|              INVESTMENT ATTRACTION BY DEVELOPMENT STAGE                   |
+--------------------------------------------------------------------------+
|                                                                          |
|  STAGE              VALUATION      LIKELY ROUND    INVESTOR TYPE        |
|  =================  =============  ==============  ====================  |
|                                                                          |
|  NOW (Code only)    $3M - $10M     Pre-seed        Angels, accelerators  |
|  Phase 1 complete   $10M - $25M    Seed            Deep tech VCs        |
|  Phase 2 complete   $25M - $75M    Seed/A          Bio + tech VCs       |
|  Phase 3 complete   $50M - $150M   Series A        Tier 1-2 VCs        |
|  Phase 4 complete   $100M - $300M  Series A/B      Tier 1 VCs, CVC     |
|  Phase 5 complete   $150M - $400M  Series B        Top-tier VCs        |
|  Phase 6 complete   $200M - $500M  Series B        Mega-funds          |
|  Phase 7 complete   $300M - $800M  Series B/C      Strategic investors |
|                                                                          |
|  WITH PHARMA PARTNERSHIP:  +$50M - $200M premium                        |
|  WITH PUBLISHED BENCHMARKS: +$20M - $50M premium                        |
|  WITH CLINICAL DATA:  +$500M - $2B premium                             |
+--------------------------------------------------------------------------+
```

### Gantt Chart: Valuation vs. Development Timeline

```
Week:    1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
         |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
Phase 1: [==================]
Phase 2:    [==================]
Phase 3:          [==================]
Phase 4:                [==========================]
Phase 5:                      [==========================]
Phase 6:                            [==========================]
Phase 7:                                  [==========================]

VALUATION:
$3-10M    [=======]
$10-25M           [=======]
$25-75M                 [=======]
$50-150M                      [=======]
$100-300M                            [=======]
$150-400M                                  [=======]
$200-500M                                        [=======]
$300-800M                                              [=======]

KEY MILESTONES:
Week 4:  Small molecules ready (ChEMBL/PubChem/DrugBank)
Week 6:  Real models online (ESM2/ESMFold/RFdiffusion/DiffDock)
Week 8:  Affinity prediction working
Week 12: Full pipeline operational
Week 14: Pathway analysis live
Week 16: ADMET profiling complete
Week 20: Full drug discovery platform
```

---

## Detailed Stage Analysis

### NOW: Pre-Seed ($3M - $10M)

```
+--------------------------------------------------------------------------+
|  STAGE: PRE-SEED                                                        |
|  VALUATION: $3M - $10M                                                  |
|  REALISTIC RAISE: $1M - $3M                                            |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU HAVE:                                                         |
|    - Complete platform architecture (frontend + backend)                |
|    - Real data integrations (UniProt, PDB, AlphaFold, Europe PMC)      |
|    - Knowledge graph infrastructure                                     |
|    - 89% test coverage                                                  |
|    - Deterministic baselines                                            |
|    - Deployment-ready Docker/Helm                                       |
|                                                                          |
|  WHAT YOU NEED:                                                         |
|    - Cofounders (AI + biology)                                          |
|    - Working demo                                                       |
|    - Clear thesis                                                       |
|    - 6-month runway                                                     |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Angel investors (biotech founders, ex-Pharma)                     |
|    - Y Combinator, Techstars, IndieBio                                 |
|    - Small deep-tech VCs (Boldstart, Threshold, Neo)                   |
|    - Science-focused angels (like Clément Delangue at Hugging Face)    |
|                                                                          |
|  COMPARABLE DEALS (2025-2026):                                         |
|    - Mandrake Bio: $2.1M pre-seed (2026, India)                       |
|    - Ternary Therapeutics: $4.5M seed (2026, Europe)                  |
|    - Topos Bio: $10.5M seed (2026, includes angels)                   |
|    - Variational AI: $5.5M seed (2025, Merck GHI fund)                |
|                                                                          |
|  WHAT TO DO:                                                            |
|    1. Get 2 cofounders (AI/ML + computational biology)                |
|    2. Build working demo with ESM2 (can run free on HuggingFace)     |
|    3. Write compelling 2-page thesis                                   |
|    4. Apply to Y Combinator / IndieBio                                 |
|    5. Pitch 50+ angels                                                 |
+--------------------------------------------------------------------------+
```

### After Phase 1: Seed ($10M - $25M)

```
+--------------------------------------------------------------------------+
|  STAGE: SEED                                                            |
|  VALUATION: $10M - $25M                                                 |
|  REALISTIC RAISE: $5M - $15M                                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU'VE ADDED:                                                     |
|    - Small molecule handling (SMILES, SDF)                              |
|    - ChEMBL, PubChem, DrugBank integrations                            |
|    - Compound search and bioactivity data                               |
|    - Knowledge graph expanded (compounds, assays, pathways)            |
|    - 8+ new API endpoints                                              |
|    - Compound frontend pages                                            |
|                                                                          |
|  WHY THIS MATTERS:                                                      |
|    - Platform now handles both proteins AND small molecules             |
|    - Unlocks small-molecule drug discovery modality                    |
|    - More comparable to full drug discovery platforms                  |
|    - ChEMBL integration = real bioactivity data                        |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Deep tech VCs (Boldstart, Threshold, Neo, a16z Bio)              |
|    - Bio-focused VCs (ARCH, Flagship, ARCH Venture)                   |
|    - Angel investors from pharma                                       |
|                                                                          |
|  COMPARABLE DEALS:                                                      |
|    - Topos Bio: $10.5M seed (2026)                                     |
|    - Tamarind Bio: $13.6M Series A (2026)                             |
|    - Antiverse: $9.3M Series A (2026)                                  |
|    - Variational AI: $5.5M seed (2025)                                |
+--------------------------------------------------------------------------+
```

### After Phase 2: Seed/A ($25M - $75M)

```
+--------------------------------------------------------------------------+
|  STAGE: SEED / SERIES A                                                 |
|  VALUATION: $25M - $75M                                                 |
|  REALISTIC RAISE: $15M - $40M                                          |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU'VE ADDED:                                                     |
|    - Real ESM2 integration (protein embeddings, mutation effects)       |
|    - ESMFold integration (fast structure prediction)                   |
|    - RFdiffusion adapter (novel backbone generation)                   |
|    - ProteinMPNN adapter (sequence design)                             |
|    - DiffDock adapter (molecular docking)                              |
|    - GPU scheduling (Kubernetes)                                        |
|    - Redis job queue (production async)                                |
|                                                                          |
|  ** THIS IS THE CRITICAL INFLECTION POINT **                           |
|                                                                          |
|  Why this matters more than anything else:                              |
|    - Real models = real credibility                                     |
|    - Can show actual protein design results                            |
|    - Can benchmark against known methods                               |
|    - Transitions from "prototype" to "platform"                        |
|    - Every funded competitor at this stage has working models          |
|                                                                          |
|  KEY RISK:                                                              |
|    - GPU costs ($5K-$50K/month for development)                        |
|    - Model integration complexity                                       |
|    - Need NVIDIA NIM credits or cloud GPU budget                       |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Bio + deep tech VCs (a16z Bio, Flagship, GV)                     |
|    - NVIDIA Ventures (they invest in AI protein companies)             |
|    - Strategic investors (Amgen Ventures, Roche, Pfizer)              |
|                                                                          |
|  COMPARABLE DEALS:                                                      |
|    - Boltz: $28M seed (2026, a16z) - similar model integration       |
|    - Scala Biodesign: $21.5M total (2026, protein design)             |
|    - Converge Bio: $25M Series A (2026, AI drug discovery)           |
|    - Manas AI: $24.6M seed (2025)                                     |
|    - Galux: $29M Series B ($47M total, 2026)                         |
+--------------------------------------------------------------------------+
```

### After Phase 3: Series A ($50M - $150M)

```
+--------------------------------------------------------------------------+
|  STAGE: SERIES A                                                        |
|  VALUATION: $50M - $150M                                                |
|  REALISTIC RAISE: $30M - $80M                                          |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU'VE ADDED:                                                     |
|    - Multi-method binding affinity prediction                           |
|    - FEP+ / OpenFE integration                                         |
|    - Mutation optimization loop (ESM2 scanning)                        |
|    - Multi-objective candidate ranking                                  |
|    - Uncertainty quantification                                         |
|    - Published benchmark results (vs. PDBbind, known drugs)           |
|                                                                          |
|  Why this matters:                                                      |
|    - Can now PREDICT binding affinity (not just dock)                  |
|    - Can OPTIMIZE candidates iteratively                               |
|    - Can RANK candidates with explainable scores                      |
|    - Benchmark results provide credibility                             |
|    - Platform is now "research-grade"                                  |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Tier 1-2 VCs (Sequoia, GV, Thrive, Lux)                         |
|    - Corporate VCs (Sanofi, Novartis, Pfizer)                         |
|    - Bio-focused mega-funds (Flagship, ARCH)                          |
|                                                                          |
|  COMPARABLE DEALS:                                                      |
|    - AI Proteins: $41.5M Series A (2025)                              |
|    - TandemAI: $22M Series A (2025, AI + physics)                     |
|    - Cradle: $73M Series B (2025)                                      |
|    - Galux: $29M Series B ($47M total)                                |
|    - Fathom Therapeutics: $47M Series A (2026)                        |
+--------------------------------------------------------------------------+
```

### After Phase 4: Series A/B ($100M - $300M)

```
+--------------------------------------------------------------------------+
|  STAGE: SERIES A / B                                                    |
|  VALUATION: $100M - $300M                                               |
|  REALISTIC RAISE: $50M - $150M                                         |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU'VE ADDED:                                                     |
|    - Full target-to-candidate pipeline                                  |
|    - Disease → Target → Hit → Lead → Candidate                        |
|    - Pipeline orchestration (LangGraph)                                |
|    - Druggability assessment                                            |
|    - Hit generation (protein binders + small molecules)               |
|    - Lead optimization                                                 |
|    - Pipeline monitoring dashboard                                      |
|                                                                          |
|  Why this matters:                                                      |
|    - End-to-end drug discovery workflow                                |
|    - Can take a disease and produce candidate molecules               |
|    - Comparable to Isomorphic Labs' IsoDDE                             |
|    - Major pharma partnership potential                                |
|    - Can run internal drug programs                                    |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Tier 1 VCs (Sequoia, Thrive, GV, a16z)                          |
|    - Strategic pharma (Eli Lilly, Novartis, Roche)                    |
|    - Sovereign wealth funds (Temasek, MGX, ADIA)                     |
|    - Growth equity (KKR, Blackrock, General Atlantic)                 |
|                                                                          |
|  COMPARABLE DEALS:                                                      |
|    - Profluent: $150M total (2025, protein design)                    |
|    - Chai Discovery: $70M Series A (2025), $3.8B by 2026            |
|    - Medra: $52M Series A (2025, AI + robotic lab)                   |
|    - Alloy Therapeutics: $174M total ($1B valuation)                  |
|    - Insilico Medicine: $110M Series D+ (2025)                       |
+--------------------------------------------------------------------------+
```

### After Phase 7 (Full Drug Discovery): Series B ($300M - $800M+)

```
+--------------------------------------------------------------------------+
|  STAGE: SERIES B / C                                                    |
|  VALUATION: $300M - $800M+                                              |
|  REALISTIC RAISE: $100M - $400M                                        |
+--------------------------------------------------------------------------+
|                                                                          |
|  WHAT YOU'VE ADDED:                                                     |
|    - Pathway analysis (Reactome, KEGG, enrichment)                    |
|    - ADMET profiling (absorption, distribution, metabolism,            |
|      excretion, toxicity)                                               |
|    - Safety screening pipeline                                          |
|    - Clinical translation (ClinicalTrials.gov)                        |
|    - Benchmarking framework (vs. known drugs)                          |
|    - Competitive landscape analysis                                    |
|    - Complete end-to-end drug discovery platform                      |
|                                                                          |
|  Why this matters:                                                      |
|    - Platform now covers ENTIRE drug discovery lifecycle              |
|    - Comparable to Isomorphic Labs, Chai Discovery                    |
|    - Can run multiple drug programs simultaneously                    |
|    - Can attract pharma partnerships worth $100M+                    |
|    - Can spin out drug candidates                                     |
|                                                                          |
|  LIKELY INVESTORS:                                                      |
|    - Mega-funds (Sequoia, Thrive, a16z, GV)                          |
|    - Strategic pharma (multiple)                                        |
|    - Sovereign wealth funds                                            |
|    - Growth equity / crossover funds                                   |
|    - Public market investors (if IPO-track)                           |
|                                                                          |
|  COMPARABLE DEALS:                                                      |
|    - Chai Discovery: $400M at $3.8B (2026)                           |
|    - Isomorphic Labs: $2.1B Series B (2026)                          |
|    - Xaira Therapeutics: $1B Series A (2024)                          |
|    - Lila Sciences: $350M Series A (2025)                            |
|    - Earendil Labs: $787M (2026)                                      |
|    - Insilico Medicine: $1B valuation (2025)                         |
+--------------------------------------------------------------------------+
```

---

## Market Context

### AI Drug Discovery Market

```
+--------------------------------------------------------------------------+
|                    AI DRUG DISCOVERY MARKET DATA                         |
+--------------------------------------------------------------------------+
|                                                                          |
|  MARKET SIZE:                                                           |
|    2025: ~$2.35B                                                        |
|    2033: ~$13.7B (projected)                                           |
|    CAGR: ~24.5%                                                         |
|                                                                          |
|  AI PROTEIN DESIGN MARKET:                                              |
|    2026: ~$719M                                                         |
|    2033: ~$6.98B (projected)                                           |
|    CAGR: ~18.6%                                                         |
|                                                                          |
|  VC FUNDING:                                                            |
|    2025 total: $2.11B across AI drug discovery                         |
|    2026 YTD (May): $308M across 17 deals                               |
|    10-year total: $9.73B across 221 companies                          |
|    AI-native biotech valuation premium: ~100% over traditional         |
|                                                                          |
|  KEY TRENDS (2026):                                                     |
|    - More deals, smaller rounds (market maturing)                      |
|    - Seed/Series A still very active                                   |
|    - Late-stage rounds less frequent but larger                        |
|    - 173+ AI drug programs in clinical development                     |
|    - 15-20 expected to reach working trials in 2026                   |
|    - NO AI-discovered drug approved yet = first-mover advantage        |
|    - Big tech entering (Anthropic acquired drug design startup)        |
|    - ByteDance entering the race                                       |
|                                                                          |
|  FUNDING BY STAGE (10-year totals):                                     |
|    Seed: $364M across many rounds                                       |
|    Early (Series A/B): $3.44B                                           |
|    Late (Series C+): $4.88B                                             |
+--------------------------------------------------------------------------+
```

### Deal Size Distribution (2025-2026)

```
SEED ROUNDS:
  $2M   ████████████████████  Mandrake Bio
  $4.5M ████████████████████████████  Ternary Therapeutics
  $5.5M ████████████████████████████████  Variational AI
  $10M  ████████████████████████████████████████████████  Topos Bio, Perceptic
  $12M  ████████████████████████████████████████████████████  Perceptic
  $24.6M████████████████████████████████████████████████████████████████████  Manas AI
  $28M  ████████████████████████████████████████████████████████████████████████████  Boltz
  $41M  ████████████████████████████████████████████████████████████████████████████████████████████  Bioptimus
  $50M  ████████████████████████████████████████████████████████████████████████████████████████████████████████  Latent Labs
  $80M  ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Proxima
  $200M ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Lila Sciences

SERIES A ROUNDS:
  $6.6M ████████████████  Pepticom
  $9.3M ████████████████████████  Antiverse
  $13.6M████████████████████████████  Tamarind Bio
  $16M  ████████████████████████████████████  Scala Biodesign
  $22M  ████████████████████████████████████████████████████  TandemAI
  $23M  ████████████████████████████████████████████████████████  Generare
  $25M  ████████████████████████████████████████████████████████████  Converge Bio
  $29M  ████████████████████████████████████████████████████████████████████  Galux
  $35M  ██████████████████████████████████████████████████████████████████████████████████  Manas AI
  $41.5M███████████████████████████████████████████████████████████████████████████████████████████  AI Proteins
  $47M  ████████████████████████████████████████████████████████████████████████████████████████████████████████  Fathom Therapeutics
  $52M  ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Medra
  $70M  ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Chai Discovery
  $73M  ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Cradle
  $106M ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Profluent
  $115M ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Lila Sciences
  $200M ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Lila Sciences (initial)
  $1000M██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  Xaira Therapeutics
```

---

## Valuation Maximizers

### High-Impact Actions

| Action | Impact | Difficulty | Timeline | Cost |
|--------|--------|------------|----------|------|
| **Published benchmark results** (beats known methods) | +$20M-$50M valuation | High | 3-6 months | $50K-$200K |
| **Pharma partnership** (even research-only) | +$50M-$200M valuation | Medium | 6-12 months | $0 (revenue) |
| **Grant funding** (NIH, DOE, EU) | +$2M-$10M + credibility | Medium | 6-12 months | $50K (application) |
| **Published paper** (Nature/Science/Cell) | +$30M-$100M valuation | Very High | 12-24 months | $100K-$500K |
| **Working wet-lab validation** | +$100M-$500M valuation | Very High | 12-24 months | $500K-$2M |
| **Clinical-stage asset** | +$500M-$2B valuation | Extremely High | 3-5 years | $5M-$50M |
| **Open-source community** (GitHub stars) | +$5M-$20M valuation | Low-Medium | 3-6 months | $10K-$50K |
| **Strong founding team** (AI + biology) | +$10M-$50M valuation | Depends | Immediate | Equity |
| **NVIDIA/Google partnership** | +$20M-$100M valuation | High | 6-12 months | $0 (revenue) |
| **African disease focus** (unique market position) | +$5M-$20M differentiation | Low | Immediate | $0 |

### Medium-Impact Actions

| Action | Impact | Difficulty | Timeline |
|--------|--------|------------|----------|
| **Open-source the platform** | +$5M-$15M (community) | Low | 1 month |
| **Y Combinator / IndieBio acceptance** | +$5M-$10M (credibility) | Medium | 3 months |
| **Conference talks** (NeurIPS, ISMB) | +$2M-$5M (visibility) | Low | 1-3 months |
| **Blog posts / technical writing** | +$1M-$3M (awareness) | Low | Ongoing |
| **Advisory board** (Pharma/VC connections) | +$5M-$15M (network) | Medium | 1-3 months |
| **NVIDIA Inception program** | +$2M-$5M (GPU credits) | Low | 1 month |
| **AWS/GCP startup credits** | +$100K-$500K (infra) | Low | 1 month |

### What Differentiates OpenBioDesign

```
UNIQUE SELLING POINTS:
  1. African disease focus (15 diseases in disease selector)
     - Most competitors focus on oncology/autoimmune
     - Africa-focused drug discovery is underserved
     - WHO/TDR funding opportunities
     - Unique market positioning

  2. Explainability-first architecture
     - Every prediction has confidence, uncertainty, evidence
     - Most competitors treat this as an afterthought
     - Regulatory advantage (FDA increasingly requires explainability)

  3. Open-source architecture
     - Most competitors are closed-source
     - Can build community + trust
     - Enables academic adoption

  4. Full-stack platform (not just one model)
     - Competitors usually do one thing well
     - OpenBioDesign does target-to-candidate
     - Similar to Isomorphic Labs' IsoDDE vision

  5. Knowledge graph as reasoning substrate
     - Most competitors don't have this
     - Enables multi-hop reasoning
     - Enables literature-grounded explanations
```

---

## Risk Factors

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| GPU cost overruns | Medium | High | Implement auto-scaling, spot instances, cost monitoring |
| Model inference latency | Medium | Medium | Cache results, use ESMFold for fast screening |
| Data source rate limits | High | Low | Implement caching, respect rate limits |
| Model version conflicts | Low | High | Pin model versions in MLflow, container-based deployment |
| Scientific accuracy of predictions | Medium | High | Validate against known benchmarks, uncertainty quantification |

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| No AI drug approved (market skepticism) | High | Medium | Focus on platform value, not drug development |
| Big tech entry (Google, Microsoft) | Medium | High | Focus on niche (Africa, explainability) |
| VC funding cooldown | Medium | Medium | Reduce burn, focus on revenue |
| Competitor launches similar platform | Medium | Medium | First-mover in Africa focus, speed to market |

### Execution Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cannot recruit co-founders | Medium | Critical | Offer significant equity, join accelerator |
| Cannot afford GPU costs | High | High | NVIDIA Inception, cloud credits, academic HPC |
| Cannot publish results | Medium | High | Focus on benchmarking, reproducibility |
| Cannot secure pharma partnership | Medium | High | Start with academic collaborations |

---

## Summary

### Valuation by Stage

```
+--------------------------------------------------------------------------+
|                    VALUATION SUMMARY                                      |
+--------------------------------------------------------------------------+
|                                                                          |
|  +------------------------------------------------------------------+  |
|  |  STAGE              VALUATION      RAISE         INVESTORS        |  |
|  |  =================  =============  ============  ===============  |  |
|  |  NOW (July 2026)   $3M - $10M     $1M - $3M     Angels           |  |
|  |  Phase 1 complete   $10M - $25M    $5M - $15M    Deep tech VCs    |  |
|  |  Phase 2 complete   $25M - $75M    $15M - $40M   Bio + tech VCs   |  |
|  |  Phase 3 complete   $50M - $150M   $30M - $80M   Tier 1-2 VCs     |  |
|  |  Phase 4 complete   $100M - $300M  $50M - $150M  Tier 1 VCs, CVC  |  |
|  |  Phase 5 complete   $150M - $400M  $75M - $200M  Top-tier VCs     |  |
|  |  Phase 6 complete   $200M - $500M  $100M - $250M Mega-funds       |  |
|  |  Phase 7 complete   $300M - $800M  $150M - $400M Strategic        |  |
|  +------------------------------------------------------------------+  |
|                                                                          |
|  PREMIUMS:                                                              |
|    + Pharma partnership:        +$50M - $200M                          |
|    + Published benchmarks:      +$20M - $50M                           |
|    + Grant funding:             +$2M - $10M + credibility             |
|    + Published paper:           +$30M - $100M                          |
|    + Wet-lab validation:        +$100M - $500M                         |
|    + Clinical-stage asset:      +$500M - $2B                           |
|                                                                          |
|  KEY INFLECTION POINTS:                                                 |
|    1. Phase 2 (real models) -> $25M-$75M seed round                    |
|    2. Phase 4 (full pipeline) -> $100M-$300M Series A                  |
|    3. Pharma deal -> immediate $50M-$200M valuation premium            |
|    4. Clinical data -> $500M-$2B valuation premium                     |
|                                                                          |
|  MARKET CONTEXT:                                                        |
|    AI drug discovery: $2.35B market (2025) -> $13.7B (2033)            |
|    AI protein design: $719M market (2026) -> $6.98B (2033)            |
|    VC appetite strong, especially for seed/Series A                    |
|    AI-native biotechs fetch ~100% valuation premium                    |
|    No approved AI drug yet = massive first-mover advantage             |
|                                                                          |
|  BOTTOM LINE:                                                          |
|    The platform is architecturally sound and more complete than        |
|    many funded competitors at the pre-seed stage. The key gap is       |
|    real ML models (Phase 2). Completing Phase 2 is the single most     |
|    important milestone for valuation, transforming a $3M-$10M          |
|    prototype into a $25M-$75M fundable platform.                       |
+--------------------------------------------------------------------------+
```
