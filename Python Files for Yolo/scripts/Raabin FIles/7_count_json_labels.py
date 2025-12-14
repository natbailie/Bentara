import os
import json
from collections import defaultdict
from tqdm import tqdm

# ---------------------------
# CONFIGURATION
# ---------------------------
RAW_DATASET_DIR = "/Datasets/Raabin-WBC"

# ---------------------------
# STEP 1: Scan JSONs
# ---------------------------
label_counts = defaultdict(int)

json_files = []
for root, dirs, files in os.walk(RAW_DATASET_DIR):
    for f in files:
        if f.endswith(".json"):
            json_files.append(os.path.join(root, f))

for jf in tqdm(json_files, desc="Scanning JSONs"):
    try:
        with open(jf, "r") as f:
            data = json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load {jf}: {e}")
        continue

    for key, val in data.items():
        if not key.startswith("Cell_"):
            continue
        label = val.get("Label1")
        if label:
            label_counts[label.strip()] += 1

# ---------------------------
# STEP 2: Report
# ---------------------------
print("\n🔎 Label counts across dataset:")
for lbl, cnt in sorted(label_counts.items(), key=lambda x: -x[1]):
    print(f"  {lbl}: {cnt}")

print(f"\n📊 Total unique labels: {len(label_counts)}")
print(f"📊 Total annotated cells: {sum(label_counts.values())}")