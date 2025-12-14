import os

# ---------------------------
# CONFIGURATION
# ---------------------------
RAW_DATASET_DIR = "/Datasets/Raabin-WBC"
IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp"]

# ---------------------------
# HELPER FUNCTIONS
# ---------------------------
def normalize_filenames(folder):
    """Replace dashes with underscores in filenames of images and JSONs."""
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if "-" in filename:
                old_path = os.path.join(root, filename)
                new_filename = filename.replace("-", "_")
                new_path = os.path.join(root, new_filename)
                os.rename(old_path, new_path)
                print(f"Renamed: {old_path} -> {new_path}")

def get_base_name(file_name):
    """Remove extension to get base name."""
    return os.path.splitext(file_name)[0]

def find_json_for_image(image_path):
    """Check if JSON exists for a given image."""
    base_name = get_base_name(os.path.basename(image_path))
    json_folder = os.path.join(os.path.dirname(os.path.dirname(image_path)), "jsons")
    json_path = os.path.join(json_folder, base_name + ".json")
    return json_path if os.path.exists(json_path) else None

def find_image_for_json(json_path):
    """Check if image exists for a given JSON (try multiple extensions)."""
    base_name = get_base_name(os.path.basename(json_path))
    images_folder = os.path.join(os.path.dirname(os.path.dirname(json_path)), "images")
    for ext in IMAGE_EXTENSIONS:
        img_path = os.path.join(images_folder, base_name + ext)
        if os.path.exists(img_path):
            return img_path
    return None

def check_pairs(folder):
    """Check that each JSON has a matching image and each image has a matching JSON."""
    images_without_json = []
    jsons_without_image = []

    for root, dirs, files in os.walk(folder):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            full_path = os.path.join(root, f)
            if ext in IMAGE_EXTENSIONS:
                if not find_json_for_image(full_path):
                    images_without_json.append(full_path)
            elif ext == ".json":
                if not find_image_for_json(full_path):
                    jsons_without_image.append(full_path)

    # Report
    print("\n--- Images without JSON ---")
    for img in images_without_json:
        print(img)
    print(f"Total: {len(images_without_json)}")

    print("\n--- JSONs without Image ---")
    for js in jsons_without_image:
        print(js)
    print(f"Total: {len(jsons_without_image)}")

# ---------------------------
# MAIN SCRIPT
# ---------------------------
print("✅ Normalizing filenames...")
normalize_filenames(RAW_DATASET_DIR)

print("\n✅ Checking JSON-image pairs...")
check_pairs(RAW_DATASET_DIR)

print("\n🎉 Check complete.")