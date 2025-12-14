import os
import json

# Path to your Raabin-WBC dataset
RAW_DATASET_DIR = "/Datasets/Raabin-WBC"

unique_labels = set()

for root, dirs, files in os.walk(RAW_DATASET_DIR):
    for f in files:
        if f.endswith(".json"):
            json_path = os.path.join(root, f)
            try:
                with open(json_path, "r") as jf:
                    data = json.load(jf)
                for key, value in data.items():
                    if key.startswith("Cell_") and isinstance(value, dict):
                        if "Label1" in value and value["Label1"]:
                            unique_labels.add(value["Label1"].strip())
                        if "Label2" in value and value["Label2"]:
                            unique_labels.add(value["Label2"].strip())
            except Exception as e:
                print(f"⚠️ Failed to read {json_path}: {e}")

print("\n🔎 Unique labels found in dataset:")
for label in sorted(unique_labels):
    print(f"- {label}")

print(f"\nTotal unique labels: {len(unique_labels)}")