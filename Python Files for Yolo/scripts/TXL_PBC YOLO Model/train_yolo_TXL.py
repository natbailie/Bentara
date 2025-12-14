from ultralytics import YOLO

def main():
    # Load YOLOv8 nano (fast & light, good starting point)
    model = YOLO("yolov8n.pt")

    # Train the model
    model.train(
        data="/Users/natbailie/Documents/Blood Cell Identifier Project/configs/blood_cells.yaml",  # absolute path to dataset config
        epochs=50,                              # increase if needed
        imgsz=640,                              # input image size
        batch=16,                               # adjust based on memory
        project="/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect",  # save location
        name="blood_cell_detector",             # fixed folder name
        exist_ok=True                           # overwrite if folder exists
    )

    print("\n✅ Training complete! Model saved in: runs/detect/blood_cell_detector/weights/best.pt")

if __name__ == "__main__":
    main()