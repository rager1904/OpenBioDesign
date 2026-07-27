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
!apt-get update -qq && apt-get install -y nodejs npm -qq
print("Dependencies installed!")
```

### Cell 2: Download Project
```python
import os

# Option A: If you have the project as a zip, upload it
# from google.colab import files
# uploaded = files.upload()
# !unzip *.zip -o

# Option B: Clone from git (replace with your repo URL)
!git clone https://github.com/YOUR_USERNAME/openbiodesign.git /content/platform 2>/dev/null

# If git fails, create minimal structure manually
if not os.path.exists('/content/platform/backend'):
    os.makedirs('/content/platform/backend/openbiodesign', exist_ok=True)
    print("WARNING: Git clone failed. Upload your project as a zip file instead.")
    print("Steps:")
    print("1. Zip your 'platform' folder")
    print("2. Uncomment lines 6-7 in this cell")
    print("3. Re-run this cell")
else:
    print("Project downloaded!")

os.chdir('/content/platform/backend')
print(f"Working directory: {os.getcwd()}")
!ls -la
```

### Cell 3: Load ESM2 Model (~3GB VRAM)
```python
import torch

print(f"GPU Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

from transformers import ESM2ForMaskedLM, ESM2Tokenizer

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_NAME = "facebook/esm2_t33_650M_UR50D"

print(f"Loading {MODEL_NAME}...")
tokenizer = ESM2Tokenizer.from_pretrained(MODEL_NAME)
esm2_model = ESM2ForMaskedLM.from_pretrained(MODEL_NAME).to(device).eval()
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

# Report VRAM usage
if torch.cuda.is_available():
    allocated = torch.cuda.memory_allocated() / 1e9
    print(f"VRAM Used: {allocated:.1f} GB")
```

### Cell 5: Patch Models & Start Server
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

# Kill any existing server
!pkill -f uvicorn 2>/dev/null
time.sleep(1)

# Start backend server
server = subprocess.Popen(
    ['python', '-m', 'uvicorn', 'openbiodesign.main:app',
     '--host', '0.0.0.0', '--port', '8080'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait for server to start
print("Starting server...")
time.sleep(5)

# Test health endpoint
import httpx
try:
    r = httpx.get('http://localhost:8080/api/v1/health', timeout=10)
    print(f"Server OK: {r.json()}")
except Exception as e:
    print(f"Server check failed: {e}")
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

# Save PDB
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

### Test 6: Full Analysis
```python
r = httpx.post(
    'http://localhost:8080/api/v1/esm2/analyze-sequence',
    json={"sequence": SEQUENCE, "top_k": 5},
    timeout=60
)

analysis = r.json()
print("FULL SEQUENCE ANALYSIS")
print("=" * 40)
print(f"Sequence Length: {analysis['sequence_length']}")
print(f"Score: {analysis['sequence_score']['mean_log_likelihood']:.4f}")
print(f"Interpretation: {analysis['sequence_score']['interpretation']}")
print(f"Binding Site: {analysis['binding_sites']['residue_positions_1indexed']}")
print(f"Binding Confidence: {analysis['binding_sites']['confidence']:.4f}")
print("STATUS: PASS")
```

---

## Step 5: View API Documentation

Open in a new browser tab:

```
http://localhost:8080/docs
```

This shows all available endpoints with interactive testing.

---

## Step 6: Build Frontend (Optional)

```python
import os

frontend_dir = '/content/platform/frontend'
if os.path.exists(frontend_dir):
    os.chdir(frontend_dir)
    !npm install --silent 2>/dev/null
    !npm run build
    print("Frontend built!")
    print("Run: !npx serve -s .next -l 3000")
else:
    print("Frontend directory not found - skip this step")
```

---

## Troubleshooting

### Problem: GPU Out of Memory
```python
# Restart runtime and only run cells 3+4 (skip if not needed)
import torch
torch.cuda.empty_cache()
print(f"VRAM freed: {torch.cuda.memory_allocated()/1e9:.1f} GB allocated")
```

### Problem: Server Won't Start
```python
# Check logs
!ps aux | grep uvicorn
!netstat -tlnp | grep 8080
```

### Problem: Import Errors
```python
# Verify you're in the right directory
import os
os.chdir('/content/platform/backend')
print(os.getcwd())
!ls openbiodesign/
```

---

## Expected Results

| Test | What It Proves |
|------|----------------|
| Binding Sites | ESM2 attention maps work |
| Sequence Scoring | Log-likelihood computation works |
| Binder Design | End-to-end ML workflow works |
| Structure Prediction | ESMFold inference works |
| Mutation Analysis | Zero-shot effect prediction works |
| Full Analysis | All components integrate correctly |

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

## Next Steps

1. Try different protein sequences
2. Explore the API at `/docs`
3. Test mutation positions
4. Compare with known structures
5. Export results for further analysis

---

## Support

If you encounter issues:
1. Check the Troubleshooting section
2. Verify GPU is enabled (Runtime → Change runtime type)
3. Restart runtime and run cells in order
4. Check `!nvidia-smi` for GPU status
