import os
import csv

# === CONFIG ===
IMAGES_DIR = "/Datasets/Raabin-WBC-YOLO/images"
LABELS_DIR = "/Datasets/Raabin-WBC-YOLO/labels"
NUM_CLASSES = 8  # should match nc in your YAML
REPORT_CSV = "dataset_cleanup_report.csv"
IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]
AUTO_FIX = True  # Remove empty labels and fix invalid classes

# === FUNCTIONS ===
def get_image_files(images_dir):
    image_files = set()
    for root, _, files in os.walk(images_dir):
        for file in files:
            if any(file.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
                image_files.add(os.path.splitext(file)[0])
    return image_files

def check_and_fix_label_file(file_path):
    issues = []
    empty_file = False
    fixed_lines = []

    with open(file_path, "r") as f:
        lines = f.readlines()

    if len(lines) == 0:
        issues.append("EMPTY FILE")
        empty_file = True
        return issues, fixed_lines, empty_file

    for i, line in enumerate(lines):
        parts = line.strip().split()
        if len(parts) < 5:
            issues.append(f"LINE {i+1} MALFORMED")
            fixed_lines.append(line)
            continue

        try:
            cls = int(float(parts[0]))
        except ValueError:
            issues.append(f"LINE {i+1} NON-INTEGER CLASS")
            fixed_lines.append(line)
            continue

        if cls < 0 or cls >= NUM_CLASSES:
            issues.append(f"LINE {i+1} INVALID CLASS {cls}")
            # Auto-fix
            if AUTO_FIX:
                cls_fixed = max(0, min(NUM_CLASSES - 1, cls))
                parts[0] = str(cls_fixed)
            fixed_lines.append(" ".join(parts) + "\n")
        else:
            fixed_lines.append(line)

    return issues, fixed_lines, empty_file

# === MAIN ===
image_files = get_image_files(IMAGES_DIR)
report_rows = []
total_labels = 0
total_issues = 0
total_removed = 0
total_fixed = 0
total_missing_images = 0

for root, _, files in os.walk(LABELS_DIR):
    for file in files:
        if file.endswith(".txt"):
            total_labels += 1
            file_path = os.path.join(root, file)
            base_name = os.path.splitext(file)[0]

            issues, fixed_lines, empty_file = check_and_fix_label_file(file_path)

            # Handle empty files
            if empty_file and AUTO_FIX:
                os.remove(file_path)
                total_removed += 1
                action = "REMOVED"
            # Fix invalid classes
            elif issues and fixed_lines and AUTO_FIX:
                with open(file_path, "w") as f:
                    f.writelines(fixed_lines)
                total_fixed += 1
                action = "FIXED"
            else:
                action = "CHECKED"

            # Check if corresponding image exists
            if base_name not in image_files:
                issues.append("MISSING IMAGE FILE")
                total_missing_images += 1

            if issues:
                total_issues += len(issues)
                report_rows.append([file_path, "; ".join(issues), action])

# Write CSV report
with open(REPORT_CSV, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Label File Path", "Issues", "Action"])
    writer.writerows(report_rows)

print(f"Checked {total_labels} label files.")
print(f"Total issues found: {total_issues}")
print(f"Empty files removed: {total_removed}")
print(f"Files fixed (invalid classes): {total_fixed}")
print(f"Missing images: {total_missing_images}")
print(f"CSV report saved to {REPORT_CSV}")