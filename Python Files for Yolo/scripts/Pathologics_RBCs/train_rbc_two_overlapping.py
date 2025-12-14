from ultralytics import YOLO
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
    name="RBC_Two_Overlapping",
    save=True,
    project=os.path.join(project_root, "runs/train")
)

print("✅ Training complete for RBC_Two_Overlapping")
