import os
from textwrap import dedent

# ---------------------------
# CONFIG
# ---------------------------
OUTPUT_TRAINERS_DIR = "/Users/natbailie/Documents/Blood Cell Identifier Project/scripts/trainers"
DATASET_DIR = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin_split"

classes = ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil"]

os.makedirs(OUTPUT_TRAINERS_DIR, exist_ok=True)

# ---------------------------
# Generate one script per class
# ---------------------------
for cls in classes:
    script_content = dedent(f"""
    from ultralytics import YOLO

    def main():
        model = YOLO("yolov8n.pt")  # start with pretrained YOLOv8n

        model.train(
            data="{DATASET_DIR}/{cls}/{cls}.yaml",
            epochs=50,
            imgsz=640,
            batch=16,
            project="/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect",
            name="{cls}_detector",
            exist_ok=True
        )

        print("\\n✅ Training complete! Model saved in: runs/detect/{cls}_detector/weights/best.pt")

    if __name__ == "__main__":
        main()
    """).strip()

    script_path = os.path.join(OUTPUT_TRAINERS_DIR, f"train_{cls}.py")
    with open(script_path, "w") as f:
        f.write(script_content + "\n")

    print(f"✅ Created trainer: {script_path}")

print("\n🎉 All trainer scripts ready! Run them one by one to train each class.")