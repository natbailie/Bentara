import os
import glob
import csv

# Path to your dataset labels folder (train, val, test)
LABELS_PATH = "/Datasets/Raabin-WBC-YOLO/labels"

# CSV report
report_file = "label_sanity_report.csv"
report = []


def sanitize_label_file(file_path):
    valid_lines = []
    removed_lines = 0

    with open(file_path, "r") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            removed_lines += 1
            continue
        try:
            parts = line.split()
            if len(parts) != 5:
                removed_lines += 1
                continue

            class_id, x_center, y_center, width, height = map(float, parts)

            # Skip invalid class ids
            if class_id < 0:
                removed_lines += 1
                continue

            # Width/height must be positive
            if width <= 0 or height <= 0:
                removed_lines += 1
                continue

            # Coordinates must be in [0,1]
            x_center = min(max(x_center, 0.0), 1.0)
            y_center = min(max(y_center, 0.0), 1.0)
            width = min(width, 1.0)
            height = min(height, 1.0)

            valid_lines.append(f"{int(class_id)} {x_center} {y_center} {width} {height}\n")
        except Exception as e:
            removed_lines += 1
            continue

    # Overwrite file with valid lines
    with open(file_path, "w") as f:
        f.writelines(valid_lines)

    report.append([file_path, len(lines), len(valid_lines), removed_lines])


# Recursively process all .txt files in labels folder
for txt_file in glob.glob(os.path.join(LABELS_PATH, "**/*.txt"), recursive=True):
    sanitize_label_file(txt_file)

# Save report
with open(report_file, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["File", "Original Lines", "Valid Lines", "Removed Lines"])
    writer.writerows(report)

print(f"Checked {len(report)} files. Report saved to {report_file}.")