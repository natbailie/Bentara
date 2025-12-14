import os
import json
import shutil
import random
import yaml
from collections import defaultdict
from tqdm import tqdm
from PIL import Image

# ---------------------------
# CONFIGURATION
# ---------------------------
RAW_DATASET_DIR = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin-WBC"
OUTPUT_DIR = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin_split"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Classes we actually want (sufficient samples)
id2label = {
    0: "Neutrophil",
    1: "Lymphocyte",   # Small + Large Lymph merged
    2: "Monocyte",
    3: "Eosinophil"
}

# Map raw labels -> cleaned labels
label_map = {
    "Neutrophil": ["Neutrophil", "Band"],
    "Lymphocyte": ["Small Lymph", "Large Lymph", "Lymphocyte"],
    "Monocyte": ["Monocyte"],
    "Eosinophil": ["Eosinophil"]
}

IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp"]
SPLIT_RATIOS = {"train": 0.7, "val": 0.15, "test": 0.15}
random.seed(42)

def find_image_file(json_path):
    """Find matching image in sibling images/ folder."""
    base_name = os.path.splitext(os.path.basename(json_path))[0]
    parent_folder = os.path.dirname(os.path.dirname(json_path))
    images_folder = os.path.join(parent_folder, "images")

    for ext in IMAGE_EXTENSIONS:
        candidate = os.path.join(images_folder, base_name + ext)
        if os.path.exists(candidate):
            return candidate
    return None

def convert_to_yolo(bbox, img_w, img_h):
    """Convert [x1,y1,x2,y2] -> YOLO format."""
    x_min, y_min, x_max, y_max = bbox
    x_center = ((x_min + x_max) / 2) / img_w
    y_center = ((y_min + y_max) / 2) / img_h
    w = (x_max - x_min) / img_w
    h = (y_max - y_min) / img_h
    return x_center, y_center, w, h

# ---------------------------
# STEP 1: Collect annotations
# ---------------------------
image_annotations = {}

json_folders = []
for root, dirs, files in os.walk(RAW_DATASET_DIR):
    if os.path.basename(root) == "jsons":
        json_folders.append(root)

for folder in tqdm(json_folders, desc="Processing JSON folders"):
    for jf in os.listdir(folder):
        if not jf.endswith(".json"):
            continue
        json_path = os.path.join(folder, jf)
        try:
            with open(json_path, "r") as f:
                data = json.load(f)
        except Exception:
            continue

        for key in data:
            if not key.startswith("Cell_"):
                continue

            cell = data[key]
            raw_label = cell.get("Label1")
            if raw_label is None:
                continue
            raw_label = str(raw_label).strip()
            if not raw_label:
                continue

            cls_id = None
            for mapped_id, mapped_name in id2label.items():
                if any(sub.lower() in raw_label.lower() for sub in label_map[mapped_name]):
                    cls_id = mapped_id
                    break
            if cls_id is None:
                continue

            image_file = find_image_file(json_path)
            if not image_file:
                continue

            bbox = [int(cell["x1"]), int(cell["y1"]), int(cell["x2"]), int(cell["y2"])]

            if image_file not in image_annotations:
                image_annotations[image_file] = []
            image_annotations[image_file].append({"cls_id": cls_id, "bbox": bbox})

print(f"✅ Collected annotations for {len(image_annotations)} images")

# ---------------------------
# STEP 2: Train/Val/Test split
# ---------------------------
all_images = list(image_annotations.keys())
random.shuffle(all_images)

n_total = len(all_images)
n_train = int(SPLIT_RATIOS["train"] * n_total)
n_val = int(SPLIT_RATIOS["val"] * n_total)

split_map = {
    "train": all_images[:n_train],
    "val": all_images[n_train:n_train+n_val],
    "test": all_images[n_train+n_val:]
}

counts = defaultdict(lambda: defaultdict(int))

print("\n📂 Splitting dataset...")
for split, images in split_map.items():
    for img_path in images:
        anns = image_annotations[img_path]

        with Image.open(img_path) as img:
            w, h = img.size

        for ann in anns:
            cls_id = ann["cls_id"]
            cls_name = id2label[cls_id]

            img_dir = os.path.join(OUTPUT_DIR, cls_name, "images", split)
            lbl_dir = os.path.join(OUTPUT_DIR, cls_name, "labels", split)
            os.makedirs(img_dir, exist_ok=True)
            os.makedirs(lbl_dir, exist_ok=True)

            # Copy image
            dst_img_path = os.path.join(img_dir, os.path.basename(img_path))
            if not os.path.exists(dst_img_path):
                shutil.copy2(img_path, dst_img_path)

            # Write YOLO label (always class 0 for single-class training)
            x, y, w_norm, h_norm = convert_to_yolo(ann["bbox"], w, h)
            lbl_filename = os.path.splitext(os.path.basename(img_path))[0] + ".txt"
            lbl_path = os.path.join(lbl_dir, lbl_filename)
            with open(lbl_path, "a") as f:
                f.write(f"{0} {x} {y} {w_norm} {h_norm}\n")

            counts[cls_name][split] += 1

# ---------------------------
# STEP 3: Generate YAMLs
# ---------------------------
print("\n📄 Generating YAML files...")
for cls_name in id2label.values():
    cls_dir = os.path.join(OUTPUT_DIR, cls_name)
    if not os.path.exists(cls_dir):
        continue
    dataset_yaml = {
        "path": cls_dir,
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": {0: cls_name}
    }
    yaml_path = os.path.join(cls_dir, f"{cls_name}.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(dataset_yaml, f)
    print(f"✅ Generated YAML: {yaml_path}")

# ---------------------------
# STEP 4: Summary
# ---------------------------
print("\n📊 Split Summary:")
for cls_name in id2label.values():
    train = counts[cls_name].get("train", 0)
    val = counts[cls_name].get("val", 0)
    test = counts[cls_name].get("test", 0)
    total = train + val + test
    print(f"  {cls_name}: {total} objects | train: {train} | val: {val} | test: {test}")

print("\n🎉 All done! Datasets for Neutrophil, Lymphocyte, Monocyte, and Eosinophil are ready.")