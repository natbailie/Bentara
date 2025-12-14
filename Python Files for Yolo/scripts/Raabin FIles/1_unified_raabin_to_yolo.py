# 1_unified_raabin_to_yolo.py - first file to run for raabin data
import os
import json
import cv2
from tqdm import tqdm

# -------------------------------
# Paths
# -------------------------------
BASE_DIR = "/Datasets/Raabin-WBC"
OUT_DIR = "/Datasets/Raabin-WBC-YOLO"

IMG_OUT = os.path.join(OUT_DIR, "images_all")
LBL_OUT = os.path.join(OUT_DIR, "labels_all")

os.makedirs(IMG_OUT, exist_ok=True)
os.makedirs(LBL_OUT, exist_ok=True)

# -------------------------------
# Class mapping (Raabin → YOLO ID)
# -------------------------------
CLASS_MAP = {
    "Neutrophil": 0,
    "Lymphocyte": 1,
    "Monocyte": 2,
    "Eosinophil": 3,
    "Basophil": 4,
    "Metamyelocyte": 5,
    "Myelocyte": 6,
    "Promyelocyte": 7
}

# -------------------------------
# Convert one JSON + image
# -------------------------------
def convert_one(json_path):
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[⚠] Could not load {json_path}: {e}")
        return False

    # Guess image path
    base = os.path.splitext(os.path.basename(json_path))[0]
    img_dir = os.path.dirname(json_path).replace("jsons", "images")

    possible_exts = [".jpg", ".bmp", ".png", ".JPG"]
    img_path = None
    for ext in possible_exts:
        candidate = os.path.join(img_dir, base + ext)
        if os.path.exists(candidate):
            img_path = candidate
            break

    if img_path is None:
        print(f"[⚠] No image found for {json_path}")
        return False

    # Load and rotate image
    img = cv2.imread(img_path)
    if img is None:
        print(f"[⚠] Failed to open {img_path}")
        return False
    img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    h, w = img.shape[:2]

    # Save rotated image
    out_img = os.path.join(IMG_OUT, os.path.basename(img_path))
    cv2.imwrite(out_img, img)

    # Extract bounding boxes
    yolo_lines = []
    num_cells = int(data.get("Cell Numbers", 0))
    for i in range(num_cells):
        cell_key = f"Cell_{i}"
        if cell_key not in data:
            continue

        cell = data[cell_key]
        cls_name = cell.get("Label1")
        if cls_name not in CLASS_MAP:
            continue

        cls_id = CLASS_MAP[cls_name]
        try:
            x1, x2 = int(cell["x1"]), int(cell["x2"])
            y1, y2 = int(cell["y1"]), int(cell["y2"])
        except KeyError:
            continue

        # Normalise coords to YOLO format
        cx = ((x1 + x2) / 2) / w
        cy = ((y1 + y2) / 2) / h
        bw = (x2 - x1) / w
        bh = (y2 - y1) / h

        yolo_lines.append(f"{cls_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")

    # Save label file
    out_lbl = os.path.join(LBL_OUT, os.path.splitext(os.path.basename(img_path))[0] + ".txt")
    with open(out_lbl, "w") as f:
        f.write("\n".join(yolo_lines))

    print(f"[✔] {os.path.basename(img_path)} → {len(yolo_lines)} cells")
    return True

# -------------------------------
# Main
# -------------------------------
def main():
    json_files = []
    for root, _, files in os.walk(BASE_DIR):
        for f in files:
            if f.endswith(".json"):
                json_files.append(os.path.join(root, f))

    print(f"[INFO] Found {len(json_files)} JSON files")

    for json_path in tqdm(json_files, desc="Converting Raabin"):
        convert_one(json_path)

    print(f"[INFO] Conversion complete → {OUT_DIR}")

if __name__ == "__main__":
    main()