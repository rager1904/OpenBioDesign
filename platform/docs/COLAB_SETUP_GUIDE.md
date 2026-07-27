# OpenBioDesign - Google Colab Quick Start Guide

## Prerequisites
- Google account
- Chrome browser
- ~10 minutes setup time

---

## Step 1: Open Colab

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Click **File** → **Open notebook** → **GitHub** tab
3. Paste: `rager1904/OpenBioDesign`
4. Select `platform/colab_demo.ipynb`

---

## Step 2: Enable GPU

1. Click **Runtime** → **Change runtime type**
2. Set **Hardware accelerator** to **T4 GPU**
3. Click **Save**

---

## Step 3: Run Cells in Order

Run each cell with Shift+Enter. Cell 1 takes ~3 min to install dependencies.

### Cell 1: Install Dependencies
```python
import os, time

# Core Python deps
!pip install -q fastapi uvicorn sqlalchemy pydantic pydantic-settings python-multipart httpx numpy scipy
!pip install -q transformers torch

# Node.js for frontend
!apt-get update -qq && apt-get install -y -qq nodejs npm > /dev/null 2>&1

# localtunnel for remote access (npm package, not pip)
!npm install -g localtunnel

# ESMFold deps (from ColabFold - proven to work on Colab)
!pip install -q omegaconf pytorch_lightning biopython ml_collections einops modelcif
!pip install -q git+https://github.com/NVIDIA/dllogger.git
!pip install -q git+https://github.com/sokrypton/openfold.git

# Remove any conflicting esm package BEFORE installing sokrypton fork
!pip uninstall -y esm fair-esm 2>/dev/null; echo 'done'
!pip install -q git+https://github.com/sokrypton/esm.git

print('All dependencies installed!')
```

### Cell 2: Clone Repository
```python
import os

!git clone https://github.com/rager1904/OpenBioDesign.git /content/OpenBioDesign 2>/dev/null || echo 'Using existing repo'

os.chdir('/content/OpenBioDesign/platform/backend')
print(f'Working directory: {os.getcwd()}')
```

### Cell 3: Load ESM2 (~2.5 GB VRAM)
```python
import torch

if torch.cuda.is_available():
    gpu = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f'GPU: {gpu} ({vram:.1f} GB)')
else:
    print('WARNING: No GPU! Runtime > Change runtime type > GPU')

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

from transformers import AutoModelForMaskedLM, AutoTokenizer

ESM2_MODEL = 'facebook/esm2_t33_650M_UR50D'
print(f'Loading {ESM2_MODEL}...')

tokenizer = AutoTokenizer.from_pretrained(ESM2_MODEL)
esm2_model = AutoModelForMaskedLM.from_pretrained(ESM2_MODEL).to(device).eval()

params = sum(p.numel() for p in esm2_model.parameters()) / 1e6
print(f'ESM2 loaded! ({params:.0f}M params on {device})')
```

### Cell 4: Load ESMFold (~1 GB VRAM, ~2 min download)
```python
import os, time

model_name = 'esmfold.model'
if not os.path.isfile(model_name):
    print('Downloading ESMFold weights (~1 GB)...')
    !apt-get install -qq aria2 > /dev/null 2>&1
    !aria2c -q -x 16 https://colabfold.steineggerlab.workers.dev/esm/esmfold.model &
    while not os.path.isfile(model_name):
        time.sleep(5)
    while os.path.isfile(f'{model_name}.aria2'):
        time.sleep(5)
    print('Download complete!')
else:
    print('ESMFold weights already cached')

import sys, torch, esm

# Ensure esm.Alphabet exists for torch.load unpickling
if not hasattr(esm, 'Alphabet'):
    from esm.data import Alphabet
    esm.Alphabet = Alphabet
    sys.modules['esm'].Alphabet = Alphabet
    print('Patched esm.Alphabet from esm.data')

print('Loading ESMFold model...')
esmfold_model = torch.load(model_name, weights_only=False)
esmfold_model.eval().cuda().requires_grad_(False)

if torch.cuda.is_available():
    used = torch.cuda.memory_allocated() / 1e9
    print(f'ESMFold loaded! (VRAM used: {used:.1f} GB)')
else:
    print('ESMFold loaded on CPU')
```

### Cell 5: Start Backend Server
```python
import sys, os, threading, time

sys.path.insert(0, os.getcwd())

from openbiodesign.infrastructure.esm2_client import ESM2Client

class PatchedESM2(ESM2Client):
    def __init__(self):
        self.model = esm2_model
        self.tokenizer = tokenizer
        self.device = device
        self._model_loaded = True

ESM2Client._instance = PatchedESM2()
print('ESM2 client patched')

from openbiodesign.infrastructure.esmfold_client import ESMFoldClient

class PatchedESMFold(ESMFoldClient):
    def __init__(self):
        self.model = esmfold_model
        self.device = device
        self._model_loaded = True

ESMFoldClient._instance = PatchedESMFold()
print('ESMFold client patched')

# Start FastAPI server in SAME process so singleton patches work
import uvicorn
from openbiodesign.main import app

def run_server():
    uvicorn.run(app, host='0.0.0.0', port=8000, log_level='warning')

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(3)

import httpx
try:
    r = httpx.get('http://localhost:8000/api/v1/health', timeout=10)
    print(f'Backend running! Health: {r.json()}')
except Exception as e:
    print(f'Backend check failed: {e}')
```

### Cell 6: Expose Backend & Build Frontend
```python
import subprocess, time, os

# Backend tunnel
print('Creating backend tunnel...')
backend_tunnel = subprocess.Popen(
    ['npx', 'localtunnel', '--port', '8000'],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)
time.sleep(5)

backend_url = ''
for _ in range(20):
    line = backend_tunnel.stdout.readline()
    if 'loca.lt' in line or 'https' in line:
        backend_url = line.strip()
        break
    time.sleep(0.5)

if not backend_url:
    backend_url = backend_tunnel.stdout.readline().strip()

api_base = backend_url.rstrip('/') + '/api/v1'
print(f'Backend URL: {backend_url}')

# Build frontend
frontend_dir = '/content/OpenBioDesign/platform/frontend'
os.chdir(frontend_dir)

!npm install

env = os.environ.copy()
env['NEXT_PUBLIC_API_BASE_URL'] = api_base

print('Building frontend...')
result = subprocess.run(['npm', 'run', 'build'], env=env, capture_output=True, text=True, cwd=frontend_dir)
print('Frontend built!' if result.returncode == 0 else f'Build issues: {result.stderr[:500]}')
```

### Cell 7: Start Frontend & Create Tunnel
```python
import subprocess, time, os

env = os.environ.copy()
env['NEXT_PUBLIC_API_BASE_URL'] = api_base

frontend_server = subprocess.Popen(
    ['npx', 'next', 'start', '-H', '0.0.0.0', '-p', '3000'],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env,
    cwd='/content/OpenBioDesign/platform/frontend'
)
time.sleep(3)

print('Creating frontend tunnel...')
frontend_tunnel = subprocess.Popen(
    ['npx', 'localtunnel', '--port', '3000'],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)
time.sleep(5)

frontend_url = ''
for _ in range(20):
    line = frontend_tunnel.stdout.readline()
    if 'loca.lt' in line or 'https' in line:
        frontend_url = line.strip()
        break
    time.sleep(0.5)

if not frontend_url:
    frontend_url = frontend_tunnel.stdout.readline().strip()

print()
print('=' * 60)
print('  OPENBIODESIGN - REMOTE ACCESS')
print('=' * 60)
print(f'  Frontend: {frontend_url}')
print(f'  Backend:  {backend_url}')
print()
print('  Open the Frontend URL on any device.')
print('  First visit: click through the localtunnel warning page.')
print('=' * 60)
```

---

## Step 4: Test

### Binding Site Detection
```python
import httpx

SEQUENCE = "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIR"

r = httpx.post('http://localhost:8000/api/v1/esm2/detect-binding-sites',
    json={"sequence": SEQUENCE, "top_k": 8}, timeout=60)
result = r.json()
print(f"Residues: {result['residue_positions_1indexed']}")
print(f"Confidence: {result['confidence']:.4f}")
```

### Structure Prediction
```python
r = httpx.post('http://localhost:8000/api/v1/esmfold/predict',
    json={"sequence": SEQUENCE[:100]}, timeout=120)
s = r.json()
print(f"pLDDT: {s['mean_plddt']:.2f}")
print(f"Confidence: {s['confidence_classification']}")
```

### Mutation Analysis
```python
r = httpx.post('http://localhost:8000/api/v1/esm2/predict-mutation',
    json={"sequence": SEQUENCE[:50], "position": 10, "mutant_residue": "D"}, timeout=60)
m = r.json()
print(f"Effect: {m['effect_classification']} (delta: {m['delta_score']:.4f})")
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No GPU detected | Runtime > Change runtime type > T4 GPU |
| ESMFold download stalls | Re-run Cell 4 |
| Backend won't start | Re-run Cell 5 |
| Tunnel URL not appearing | Wait 10s, re-run Cell 7 |
| Frontend can't reach backend | Re-run Cell 6 (rebuilds with correct URL) |
| `localtunnel` page says "Click to Continue" | Just click through it |

## System Requirements

| Resource | Usage | Colab Free |
|----------|-------|------------|
| GPU VRAM | ~4.5 GB | 15 GB |
| RAM | ~4 GB | ~12 GB |
| Storage | ~2 GB | ~75 GB |
| Session | ~10 min | 12 hr max |
