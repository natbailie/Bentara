# 4_raabin_create_train_val_test.py
import os
import shutil
from sklearn.model_selection import train_test_split

BASE_DIR = "/Datasets/Raabin-WBC-YOLO"
IMG_DIR = os.path.join(BASE_DIR, "images_all")
LBL_DIR = os.path.join(BASE_DIR, "labels_all")

def split_dataset(test_size=0.1, val_size=0.1):
    images = [f for f in os.listdir(IMG_DIR) if f.endswith((".jpg", ".png", ".bmp"))]
    print(f"[INFO] Found {len(images)} images to split.")

    if not images:
        raise RuntimeError("❌ No images found. Did conversion fail?")

    # Split into train / val / test
    train_imgs, test_imgs = train_test_split(images, test_size=test_size, random_state=42)
    train_imgs, val_imgs = train_test_split(train_imgs, test_size=val_size/(1-test_size), random_state=42)

    splits = {"train": train_imgs, "val": val_imgs, "test": test_imgs}

    for split, files in splits.items():
        img_out = os.path.join(BASE_DIR, "images", split)
        lbl_out = os.path.join(BASE_DIR, "labels", split)
        os.makedirs(img_out, exist_ok=True)
        os.makedirs(lbl_out, exist_ok=True)

        for f in files:
            src_img = os.path.join(IMG_DIR, f)
            dst_img = os.path.join(img_out, f)

            if os.path.exists(src_img):
                shutil.move(src_img, dst_img)  # 🚨 MOVE instead of copy

            txt_name = os.path.splitext(f)[0] + ".txt"
            src_lbl = os.path.join(LBL_DIR, txt_name)
            dst_lbl = os.path.join(lbl_out, txt_name)
            if os.path.exists(src_lbl):
                shutil.move(src_lbl, dst_lbl)  # 🚨 MOVE instead of copy

        print(f"[✔] Moved {len(files)} {split} images to {img_out}")

    # Cleanup empty dirs
    try:
        if not os.listdir(IMG_DIR):
            os.rmdir(IMG_DIR)
            print(f"[🧹] Removed empty folder {IMG_DIR}")
        if not os.listdir(LBL_DIR):
            os.rmdir(LBL_DIR)
            print(f"[🧹] Removed empty folder {LBL_DIR}")
    except Exception as e:
        print(f"[⚠] Cleanup skipped: {e}")

if __name__ == "__main__":
    split_dataset()