import sys
import os
import json
import cv2
from datetime import datetime
from ultralytics import YOLO

# --------------------------------------------------------------------
# CONFIGURATION: Paths to YOLO models
# --------------------------------------------------------------------
MODEL_PATHS = {
    "Neutrophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Neutrophil_detector/weights/best.pt",
    "Eosinophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Eosinophil_detector/weights/best.pt",
    "Monocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Monocyte_detector/weights/best.pt",
    "Lymphocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Lymphocyte_detector/weights/best.pt",
    "BloodCell": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/blood_cell_detector/weights/best.pt"
    # Add more specialised models here (Basophil, etc.) if needed
}

# --------------------------------------------------------------------
# LOAD MODELS
# --------------------------------------------------------------------
MODELS = {}
for name, path in MODEL_PATHS.items():
    if os.path.exists(path):
        print(f"Loading model: {name}")
        MODELS[name] = YOLO(path)
    else:
        print(f"⚠️ Model file missing: {path}")

# --------------------------------------------------------------------
# ANALYSIS FUNCTION
# --------------------------------------------------------------------
def run_analysis(image_path: str):
    if not os.path.exists(image_path):
        return {"error": f"Image not found: {image_path}"}

    all_detections = []
    cell_counts = {}

    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        return {"error": f"Failed to read image: {image_path}"}

    # Run each YOLO model
    for model_name, model in MODELS.items():
        results = model(image, conf=0.25, imgsz=640, verbose=False)
        result = results[0]

        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = f"{model_name}_{model.names[cls_id]}"
            xyxy = [float(x) for x in box.xyxy[0]]

            all_detections.append({
                "label": label,
                "confidence": round(conf, 3),
                "box": {
                    "x1": xyxy[0],
                    "y1": xyxy[1],
                    "x2": xyxy[2],
                    "y2": xyxy[3]
                }
            })

            cell_counts[label] = cell_counts.get(label, 0) + 1

    # ----------------------------------------------------------------
    # Annotated output
    # ----------------------------------------------------------------
    annotated = image.copy()
    for det in all_detections:
        b = det["box"]
        color = (0, 0, 255)  # Red boxes
        cv2.rectangle(annotated, (int(b["x1"]), int(b["y1"])), (int(b["x2"]), int(b["y2"])), color, 2)
        cv2.putText(
            annotated,
            f"{det['label']} {det['confidence']:.2f}",
            (int(b["x1"]), int(b["y1"]) - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            1
        )

    annotated_path = os.path.splitext(image_path)[0] + "_annotated.jpg"
    cv2.imwrite(annotated_path, annotated)

    # ----------------------------------------------------------------
    # Final structured output
    # ----------------------------------------------------------------
    return {
        "timestamp": datetime.now().isoformat(),
        "image": image_path,
        "annotated_image": annotated_path,
        "summary": {
            "total_cells_detected": len(all_detections),
            "cell_type_counts": cell_counts
        },
        "detections": all_detections
    }

# --------------------------------------------------------------------
# ENTRY POINT
# --------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    result = run_analysis(image_path)
    print(json.dumps(result, indent=2))