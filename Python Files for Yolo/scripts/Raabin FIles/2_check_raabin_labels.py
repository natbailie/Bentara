# run after 4_raabin_create_train_val_test.py to check for missing labels
import os

# Path to your YOLO dataset
base_dir = "/Datasets/Raabin-WBC-YOLO"

splits = ["train", "val", "test"]

for split in splits:
    img_dir = os.path.join(base_dir, "images", split)
    lbl_dir = os.path.join(base_dir, "labels", split)

    missing = []
    total = 0

    for img in os.listdir(img_dir):
        if not img.endswith(".jpg"):
            continue
        total += 1
        txt = os.path.splitext(img)[0] + ".txt"
        if not os.path.exists(os.path.join(lbl_dir, txt)):
            missing.append(img)

    print(f"\n[{split}] {len(missing)} missing labels out of {total} images")
    if missing:
        print("Examples:", missing[:10])