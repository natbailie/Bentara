import os

subtypes = [
    "Rounded",
    "Ovalocytes",
    "Fragmented",
    "Two_Overlapping",
    "Three_Overlapping",
    "Burr_Cells",
    "Teardrops",
    "Angled",
    "Borderline_Ovalocytes"
]

template = """from ultralytics import YOLO
import os

project_root = "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/dataset"
data_yaml = os.path.join(project_root, "data.yaml")

model = YOLO("yolov8s-seg.pt")

model.train(
    data=data_yaml,
    epochs=50,
    imgsz=512,
    batch=4,
    device="mps",
    name="{name}",
    save=True,
    project=os.path.join(project_root, "runs/train")
)

print("✅ Training complete for {name}")
"""

for subtype in subtypes:
    filename = f"train_rbc_{subtype.lower()}.py"
    with open(filename, "w") as f:
        f.write(template.format(name=f"RBC_{subtype}"))
    print(f"Created {filename}")