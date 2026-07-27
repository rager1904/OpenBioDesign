# OpenBioDesign - Google Colab Quick Start Guide

## Prerequisites
- Google account
- Chrome browser
- ~15 minutes setup time

---

## Step 1: Open Colab

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Click **File** → **New notebook**

---

## Step 2: Enable GPU (CRITICAL)

1. Click **Runtime** → **Change runtime type**
2. Set **Hardware accelerator** to **T4 GPU**
3. Click **Save**

---

## Step 3: Run These Cells

Copy and paste each block into a separate cell, then run with Shift+Enter.

### Cell 1: Install Dependencies
```python
!pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-multipart httpx numpy
!pip install transformers torch --quiet
!pip install localtunnel
!apt-get update -qq && apt-get install -y nodejs npm -qq
print("Dependencies installed!")
```

### Cell 2: Clone Repository
```python
import os

!git clone https://github.com/rager1904/OpenBioDesign.git /content/OpenBioDesign 2>/dev/null || echo 'Using existing repo'

os.chdir('/content/OpenBioDesign/platform/backend')
print(f"Working directory: {os.getcwd()}")
```

### Cell 3: Load ESM2 Model (~3GB VRAM)
```python
import torch

print(f"GPU Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

from transformers import AutoModelForMaskedLM, AutoTokenizer

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_NAME = "facebook/esm2_t33_650M_UR50D"

print(f"Loading {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
esm2_model = AutoModelForMaskedLM.from_pretrained(MODEL_NAME).to(device).eval()
print("ESM2 loaded successfully!")
```

### Cell 4: Load ESMFold Model (~1GB VRAM)
```python
print("Loading ESMFold...")

try:
    from transformers import AutoModelForProteinFolding
    esmfold_model = AutoModelForProteinFolding.from_pretrained(
        "facebook/esmfold_v1",
        trust_remote_code=True
    ).to(device).eval()
    print("ESMFold loaded from transformers!")
except Exception as e:
    print(f"Transformers failed: {e}")
    print("Trying esm package...")
    !pip install esm --quiet
    import esm
    esmfold_model, _ = esm.pretrained.esmfold_v1()
    esmfold_model = esmfold_model.to(device).eval()
    print("ESMFold loaded from esm package!")

if torch.cuda.is_available():
    allocated = torch.cuda.memory_allocated() / 1e9
    print(f"VRAM Used: {allocated:.1f} GB")
```

### Cell 5: Patch Models & Start Backend
```python
import sys
import subprocess
import time
import os

sys.path.insert(0, os.getcwd())

# Patch ESM2 client
from openbiodesign.infrastructure.esm2_client import ESM2Client

class PatchedESM2(ESM2Client):
    def __init__(self):
        self.model = esm2_model
        self.tokenizer = tokenizer
        self.device = device
        self._model_loaded = True

ESM2Client._instance = PatchedESM2()
print("ESM2 client patched!")

# Patch ESMFold client
from openbiodesign.infrastructure.esmfold_client import ESMFoldClient

class PatchedESMFold(ESMFoldClient):
    def __init__(self):
        self.model = esmfold_model
        self.device = device
        self._model_loaded = True

ESMFoldClient._instance = PatchedESMFold()
print("ESMFold client patched!")

# Start backend
!pkill -f uvicorn 2>/dev/null
time.sleep(1)

server = subprocess.Popen(
    ['python', '-m', 'uvicorn', 'openbiodesign.main:app',
     '--host', '0.0.0.0', '--port', '8080'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(5)

import httpx
try:
    r = httpx.get('http://localhost:8080/api/v1/health', timeout=10)
    print(f"Server OK: {r.json()}")
except Exception as e:
    print(f"Server check failed: {e}")
```

### Cell 6: Expose Backend & Build Frontend
```python
import subprocess
import time
import os

# Create backend tunnel
print("Creating backend tunnel...")
backend_tunnel = subprocess.Popen(
    ['npx', 'localtunnel', '--port', '8080'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(5)

backend_url = ''
if backend_tunnel.stdout:
    for _ in range(10):
        line = backend_tunnel.stdout.readline()
        if 'loca.lt' in line or 'https' in line:
            backend_url = line.strip()
            break
        time.sleep(0.5)

if not backend_url:
    backend_url = backend_tunnel.stdout.readline().strip()

print(f"Backend tunnel URL: {backend_url}")

api_base = backend_url.rstrip('/') + '/api/v1'
print(f"Frontend will call API at: {api_base}")

# Build frontend with backend URL
frontend_dir = '/content/OpenBioDesign/platform/frontend'
os.chdir(frontend_dir)

!npm install --silent 2>/dev/null

env = os.environ.copy()
env['NEXT_PUBLIC_API_BASE_URL'] = api_base

print("\nBuilding frontend...")
build_result = subprocess.run(
    ['npm', 'run', 'build'],
    env=env,
    capture_output=True,
    text=True
)

if build_result.returncode != 0:
    print(f"Build warning: {build_result.stderr[:500]}")
else:
    print("Frontend built successfully!")
```

### Cell 7: Start Frontend & Create Tunnel
```python
env = os.environ.copy()
env['NEXT_PUBLIC_API_BASE_URL'] = api_base

frontend_server = subprocess.Popen(
    ['npx', 'next', 'start', '-H', '0.0.0.0', '-p', '3000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)
time.sleep(3)

print("Creating frontend tunnel...")
frontend_tunnel = subprocess.Popen(
    ['npx', 'localtunnel', '--port', '3000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

time.sleep(5)

frontend_url = ''
if frontend_tunnel.stdout:
    for _ in range(10):
        line = frontend_tunnel.stdout.readline()
        if 'loca.lt' in line or 'https' in line:
            frontend_url = line.strip()
            break
        time.sleep(0.5)

if not frontend_url:
    frontend_url = frontend_tunnel.stdout.readline().strip()

print()
print("=" * 60)
print("  OPENBIODESIGN - REMOTE ACCESS URLS")
print("=" * 60)
print()
print(f"  Frontend UI:   {frontend_url}")
print(f"  Backend API:   {backend_url}")
print()
print("  Open the Frontend URL on any device (phone, tablet, laptop).")
print("  Share these URLs with collaborators.")
print()
print("  NOTE: On first visit, localtunnel shows a 'Click to Continue'")
print("  page. Just click through it to proceed.")
print("=" * 60)
```

---

## Step 4: Test the System

### Test 1: Binding Site Detection
```python
import httpx

SEQUENCE = "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIR"

r = httpx.post(
    'http://localhost:8080/api/v1/esm2/detect-binding-sites',
    json={"sequence": SEQUENCE, "top_k": 8},
    timeout=60
)

result = r.json()
print("BINDING SITE DETECTION")
print("=" * 40)
print(f"Residues: {result['residue_positions_1indexed']}")
print(f"Confidence: {result['confidence']:.4f}")
print(f"Method: {result['method']}")
print("STATUS: PASS" if result['confidence'] > 0 else "STATUS: FAIL")
```

### Test 2: Sequence Scoring
```python
r = httpx.post(
    'http://localhost:8080/api/v1/esm2/score-sequence',
    json={"sequence": SEQUENCE},
    timeout=60
)

result = r.json()
print("SEQUENCE SCORING")
print("=" * 40)
print(f"Mean Log-Likelihood: {result['mean_log_likelihood']:.4f}")
print(f"Sequence Length: {result['sequence_length']}")
print(f"Interpretation: {result['interpretation']}")
print(f"Method: {result['method']}")
print("STATUS: PASS" if result['mean_log_likelihood'] < 0 else "STATUS: FAIL")
```

### Test 3: Binder Design Workflow
```python
r = httpx.post(
    'http://localhost:8080/api/v1/workflows/binder-design',
    json={
        "project_id": "colab-test",
        "target": {
            "name": "EGFR",
            "sequence": SEQUENCE,
            "organism": "Homo sapiens"
        },
        "hypothesis": "Design protein binder for EGFR kinase domain",
        "requested_candidates": 3,
        "random_seed": 42
    },
    headers={"Authorization": "Bearer scientist"},
    timeout=120
)

result = r.json()
print("BINDER DESIGN WORKFLOW")
print("=" * 40)
print(f"Experiment ID: {result['experiment']['experiment_id'][:12]}...")
print(f"Candidates Generated: {len(result['candidates'])}")
print(f"Binding Sites Found: {len(result['binding_sites'])}")
print()
for i, c in enumerate(result['candidates']):
    print(f"Candidate #{i+1}:")
    print(f"  Binding Score: {c['binding_score']}")
    print(f"  Stability Score: {c['stability_score']}")
    print(f"  Sequence: {c['sequence'][:30]}...")
print("STATUS: PASS" if len(result['candidates']) > 0 else "STATUS: FAIL")
```

### Test 4: Structure Prediction
```python
candidate_seq = result['candidates'][0]['sequence']

r = httpx.post(
    'http://localhost:8080/api/v1/esmfold/predict',
    json={"sequence": candidate_seq},
    timeout=120
)

structure = r.json()
print("STRUCTURE PREDICTION (ESMFold)")
print("=" * 40)
print(f"Sequence Length: {structure['sequence_length']} residues")
print(f"Mean pLDDT: {structure['mean_plddt']:.2f}")
print(f"Confidence: {structure['confidence_classification']}")
print(f"Interpretation: {structure['interpretation']}")
print()
stats = structure['confidence_summary']
print("Confidence Breakdown:")
print(f"  Confident (>90): {stats['confident_pct']:.1f}%")
print(f"  Good (70-90): {stats['good_pct']:.1f}%")
print(f"  Low (50-70): {stats['low_pct']:.1f}%")
print(f"  Very Low (<50): {stats['very_low_pct']:.1f}%")
print()
with open('predicted_structure.pdb', 'w') as f:
    f.write(structure['pdb_content'])
print("PDB file saved: predicted_structure.pdb")
print("STATUS: PASS" if structure['mean_plddt'] > 0 else "STATUS: FAIL")
```

### Test 5: Mutation Analysis
```python
r = httpx.post(
    'http://localhost:8080/api/v1/esm2/predict-mutation',
    json={
        "sequence": SEQUENCE[:100],
        "position": 10,
        "mutant_residue": "D"
    },
    timeout=60
)

mutation = r.json()
print("MUTATION ANALYSIS")
print("=" * 40)
print(f"Position: {mutation['position']}")
print(f"Wild Type: {mutation['wild_type_residue']}")
print(f"Mutant: {mutation['mutant_residue']}")
print(f"Wild Type Score: {mutation['wild_type_score']:.4f}")
print(f"Mutant Score: {mutation['mutant_score']:.4f}")
print(f"Delta: {mutation['delta_score']:.4f}")
print(f"Effect: {mutation['effect_classification']}")
print(f"Confidence: {mutation['confidence']:.4f}")
print("STATUS: PASS" if mutation['effect_classification'] in ['stabilizing', 'destabilizing', 'neutral'] else "STATUS: FAIL")
```

---

## Step 5: View API Documentation

Open in a new browser tab:

```
http://localhost:8080/docs
```

This shows all available endpoints with interactive testing.

---

## Troubleshooting

### Problem: GPU Out of Memory
```python
import torch
torch.cuda.empty_cache()
print(f"VRAM freed: {torch.cuda.memory_allocated()/1e9:.1f} GB allocated")
```

### Problem: Server Won't Start
```python
!ps aux | grep uvicorn
!netstat -tlnp | grep 8080
```

### Problem: Tunnel URL Not Appearing
```python
# Re-check tunnel processes
!ps aux | grep localtunnel
# If dead, restart from Cell 6
```

### Problem: Frontend Can't Reach Backend
- Verify the frontend was built with the correct `NEXT_PUBLIC_API_BASE_URL`
- Re-run Cell 6 to rebuild with the correct backend tunnel URL

---

## System Requirements

| Resource | Usage | Colab Free Tier |
|----------|-------|-----------------|
| GPU VRAM | ~4.5 GB | 15 GB available |
| RAM | ~4 GB | ~12 GB available |
| Storage | ~2 GB | ~75 GB available |
| Session Time | ~10 min | 12 hour max |

---

## Performance Notes

- **ESM2 inference**: ~1-2 seconds per sequence
- **ESMFold inference**: ~5-10 seconds per structure
- **Full workflow**: ~15-30 seconds total
- **Model download**: ~5 GB (first run only, cached after)

---

## Remote Access Notes

- Both services are exposed via **localtunnel** public URLs
- The frontend automatically calls the backend via its tunnel URL
- On first visit to a tunnel URL, you'll see a "Click to Continue" page - just click through
- Tunnel URLs change each time you restart the notebook
- Share the frontend URL with collaborators for demos
