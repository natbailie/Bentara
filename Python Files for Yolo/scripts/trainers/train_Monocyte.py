from ultralytics import YOLO

def main():
    model = YOLO("yolov8n.pt")  # start with pretrained YOLOv8n

    model.train(
        data="/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin_split/Monocyte/Monocyte.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        project="/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect",
        name="Monocyte_detector",
        exist_ok=True
    )

    print("\n✅ Training complete! Model saved in: runs/detect/Monocyte_detector/weights/best.pt")

if __name__ == "__main__":
    main()
