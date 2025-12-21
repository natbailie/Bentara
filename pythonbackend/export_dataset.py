import os
import shutil
import random
import zipfile
from datetime import datetime


def prepare_and_export(source_dir="dataset", split_ratio=0.8):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_dir = f"yolo_export_{timestamp}"

    # 1. Create the YOLO directory structure
    for folder in ['train', 'val']:
        os.makedirs(os.path.join(export_dir, 'images', folder), exist_ok=True)
        os.makedirs(os.path.join(export_dir, 'labels', folder), exist_ok=True)

    # 2. Get list of all images
    img_source = os.path.join(source_dir, "images")
    images = [f for f in os.listdir(img_source) if f.endswith('.jpg')]
    random.shuffle(images)

    split_idx = int(len(images) * split_ratio)
    train_images = images[:split_idx]
    val_images = images[split_idx:]

    def move_files(file_list, subset):
        print(f"🚚 Moving {len(file_list)} files to {subset}...")
        for img_name in file_list:
            base_name = os.path.splitext(img_name)[0]
            label_name = f"{base_name}.txt"

            # Paths
            src_img = os.path.join(source_dir, "images", img_name)
            src_lbl = os.path.join(source_dir, "labels", label_name)

            # Copy to Export Directory
            if os.path.exists(src_img) and os.path.exists(src_lbl):
                shutil.copy(src_img, os.path.join(export_dir, 'images', subset, img_name))
                shutil.copy(src_lbl, os.path.join(export_dir, 'labels', subset, label_name))

    # 3. Perform the split
    move_files(train_images, 'train')
    move_files(val_images, 'val')

    # 4. Create the data.yaml inside the export folder
    yaml_content = f"""
path: .
train: images/train
val: images/val

nc: 8
names: ['Neutrophil', 'Lymphocyte', 'Monocyte', 'Eosinophil', 'Basophil', 'Blast Cell', 'RBC', 'Platelet']
"""
    with open(os.path.join(export_dir, "data.yaml"), "w") as f:
        f.write(yaml_content)

    # 5. Zip it all up
    zip_name = f"final_dataset_{timestamp}.zip"
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(export_dir):
            for file in files:
                zipf.write(os.path.join(root, file),
                           os.path.relpath(os.path.join(root, file), export_dir))

    # 6. Cleanup export folder (leaving only the zip)
    shutil.rmtree(export_dir)
    print(f"✨ Export Complete! File: {zip_name}")


if __name__ == "__main__":
    prepare_and_export()