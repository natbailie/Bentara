import os
import cv2
import shutil
from sklearn.model_selection import train_test_split

# -----------------------------
# Paths
# -----------------------------
project_root = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets"
mask_root = os.path.join(project_root, "PathOlOgics_RBCs Cells/Masks")
image_root = os.path.join(project_root, "PathOlOgics_RBCs Cells/Segmented images")
dataset_root = os.path.join(project_root, "dataset")

labels_root = os.path.join(dataset_root, "labels")
images_root = os.path.join(dataset_root, "images")

os.makedirs(labels_root, exist_ok=True)
os.makedirs(images_root, exist_ok=True)

# -----------------------------
# Convert mask → YOLO polygon format
# -----------------------------
def mask_to_yolo(mask, cls_id, w, h):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    segments = []
    for cnt in contours:
        seg = []
        for point in cnt:
            x, y = point[0]
            seg.append(x / w)
            seg.append(y / h)
        if len(seg) >= 6:  # YOLO requires at least 3 points
            segments.append(f"{cls_id} " + " ".join(map(str, seg)))
    return segments

# -----------------------------
# Detect class folders
# -----------------------------
mask_folders = sorted([f for f in os.listdir(mask_root) if f.startswith("Masks -")])
class_map = {mask_folders[i]: i for i in range(len(mask_folders))}

print("Detected classes:")
for k, v in class_map.items():
    print(f"{v}: {k}")

# -----------------------------
# Process all classes
# -----------------------------
all_images, all_labels = [], []

for cls_folder, cls_id in class_map.items():
    mask_dir = os.path.join(mask_root, cls_folder)
    img_dir = os.path.join(image_root, cls_folder.replace("Masks -", "SEGMENTED -"))

    if not os.path.exists(mask_dir) or not os.path.exists(img_dir):
        print(f"⚠️ Skipping {cls_folder}, missing folder")
        continue

    mask_files = [f for f in os.listdir(mask_dir) if f.lower().endswith((".png", ".jpg", ".jpeg"))]

    if not mask_files:
        print(f"⚠️ No mask files found in {mask_dir}")
        continue

    for fname in mask_files:
        mask_path = os.path.join(mask_dir, fname)
        img_path = os.path.join(img_dir, fname)

        if not os.path.exists(img_path):
            print(f"⚠️ No matching image for {fname}, skipping")
            continue

        mask = cv2.imread(mask_path, 0)
        h, w = mask.shape
        segments = mask_to_yolo(mask, cls_id, w, h)

        if segments:
            label_path = os.path.join(labels_root, fname.rsplit('.', 1)[0] + ".txt")
            with open(label_path, "w") as f:
                f.write("\n".join(segments))

            all_images.append(img_path)
            all_labels.append(label_path)

print(f"✅ Created {len(all_labels)} YOLO label files")

# -----------------------------
# Train/Val split
# -----------------------------
if not all_images:
    raise ValueError("No images/labels found. Check your mask/image folders and extensions.")

train_imgs, val_imgs, train_lbls, val_lbls = train_test_split(
    all_images, all_labels, test_size=0.2, random_state=42
)

def copy_files(imgs, lbls, subset):
    img_out = os.path.join(images_root, subset)
    lbl_out = os.path.join(labels_root, subset)
    os.makedirs(img_out, exist_ok=True)
    os.makedirs(lbl_out, exist_ok=True)

    for img, lbl in zip(imgs, lbls):
        shutil.copy(img, os.path.join(img_out, os.path.basename(img)))
        shutil.copy(lbl, os.path.join(lbl_out, os.path.basename(lbl)))

copy_files(train_imgs, train_lbls, "train")
copy_files(val_imgs, val_lbls, "val")

print("✅ Dataset ready for YOLOv8-Seg")
print(f"Train images: {len(train_imgs)}, Val images: {len(val_imgs)}")

# -----------------------------
# Create data.yaml
# -----------------------------
yaml_path = os.path.join(dataset_root, "data.yaml")
class_names = [f.replace("Masks - Class ", "").strip() for f in mask_folders]

with open(yaml_path, "w") as f:
    f.write(f"train: {os.path.join(dataset_root, 'images/train')}\n")
    f.write(f"val: {os.path.join(dataset_root, 'images/val')}\n\n")
    f.write(f"nc: {len(class_names)}\n")
    f.write("names: " + str(class_names) + "\n")

print(f"✅ data.yaml created at {yaml_path}")