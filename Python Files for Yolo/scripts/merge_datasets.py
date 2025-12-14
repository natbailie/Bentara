import os
import shutil
from glob import glob

def merge_datasets(src_dirs, dst_dir):
    """
    Merge multiple YOLO-style datasets into one Combined_Dataset
    with the structure:
      Combined_Dataset/
        images/{train,val,test}
        labels/{train,val,test}
    """
    for split in ["train", "val", "test"]:
        for sub in ["images", "labels"]:
            os.makedirs(os.path.join(dst_dir, sub, split), exist_ok=True)

    for src in src_dirs:
        for split in ["train", "val", "test"]:
            img_src = os.path.join(src, "images", split)
            lbl_src = os.path.join(src, "labels", split)

            img_dst = os.path.join(dst_dir, "images", split)
            lbl_dst = os.path.join(dst_dir, "labels", split)

            if os.path.exists(img_src):
                for f in glob(os.path.join(img_src, "*")):
                    shutil.copy(f, img_dst)

            if os.path.exists(lbl_src):
                for f in glob(os.path.join(lbl_src, "*")):
                    shutil.copy(f, lbl_dst)

    print(f"[✔] Datasets merged into {dst_dir}")


if __name__ == "__main__":
    merge_datasets(
        src_dirs=[
            "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/TXL-PBC",
            "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin-WBC"
        ],
        dst_dir="/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Combined_Dataset"
    )