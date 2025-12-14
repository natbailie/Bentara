from ultralytics import YOLO

def main():
    # Path to your trained model
    model_path = "/runs/detect/blood_cell_detector/weights/best.pt"

    # Load the trained model
    model = YOLO(model_path)

    # Evaluate on validation set (defined in blood_cells.yaml)
    metrics = model.val(data="/Users/natbailie/Documents/Blood Cell Identifier Project/configs/blood_cells.yaml")

    print("\n📊 Evaluation metrics:")
    print(metrics)

if __name__ == "__main__":
    main()