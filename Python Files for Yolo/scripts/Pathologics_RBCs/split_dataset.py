import glob, shutil
from sklearn.model_selection import train_test_split

images = glob.glob("PathOlOgics_RBCs_Cells/Cropped images/*/*.png")
labels = [os.path.join("dataset/labels", os.path.basename(x).replace(".png", ".txt")) for x in images]

train_imgs, val_imgs, train_lbls, val_lbls = train_test_split(images, labels, test_size=0.2, random_state=42)

def copy_files(imgs, lbls, subset):
    os.makedirs(f"dataset/images/{subset}", exist_ok=True)
    os.makedirs(f"dataset/labels/{subset}", exist_ok=True)
    for img, lbl in zip(imgs, lbls):
        shutil.copy(img, f"dataset/images/{subset}/{os.path.basename(img)}")
        shutil.copy(lbl, f"dataset/labels/{subset}/{os.path.basename(lbl)}")

copy_files(train_imgs, train_lbls, "train")
copy_files(val_imgs, val_lbls, "val")