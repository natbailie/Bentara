from ultralytics import YOLO

def main():
    model = YOLO("yolov8n.pt")  # base model
    model.train(
        data="/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin_split/Neutrophil/Neutrophil.yaml",
        epochs=50,
        imgsz=640,
        batch=16,
        project="/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect",
        name="Neutrophil_detector",
        exist_ok=True
    )
    print("✅ Training complete for Neutrophil. "
          "Model saved in: /Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect/Neutrophil_detector/weights/best.pt")

if __name__ == "__main__":
    main()
