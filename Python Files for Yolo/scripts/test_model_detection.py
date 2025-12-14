from ultralytics import YOLO
import cv2
import os

# -----------------------------
# Configure models
# -----------------------------
MODEL_PATHS = {
    "Neutrophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect/Neutrophil_detector/weights/best.pt",
    "Lymphocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect/Lymphocyte_detector/weights/best.pt",
    "Monocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect/Monocyte_detector/weights/best.pt",
    "Eosinophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/runs/detect/Eosinophil_detector/weights/best.pt"
}

MODELS = {name: YOLO(path) for name, path in MODEL_PATHS.items()}

# -----------------------------
# Test image(s)
# -----------------------------
test_images = [
    "/Users/natbailie/Documents/Blood Cell Identifier Project/Datasets/Raabin-WBC-YOLO/images/test/20160721_005739.jpg",
    # Add more images here if needed
]

output_dir = "diagnostics_output"
os.makedirs(output_dir, exist_ok=True)

# -----------------------------
# Detection settings
# -----------------------------
conf_thresholds = [0.05, 0.1, 0.2]   # Try multiple confidence thresholds
img_sizes = [640, 768, 1024]         # Try multiple input resolutions

# -----------------------------
# Run robust detection
# -----------------------------
for img_path in test_images:
    print(f"\n=== Processing {img_path} ===")
    img_name = os.path.basename(img_path)
    original_img = cv2.imread(img_path)

    for model_name, model in MODELS.items():
        print(f"\n--- Model: {model_name} ---")
        print("Classes:", model.names)

        detections_found = False

        for imgsz in img_sizes:
            for conf in conf_thresholds:
                results = model.predict(source=img_path, conf=conf, imgsz=imgsz, save=False, verbose=False)
                result = results[0]

                boxes = result.boxes.xyxy
                classes = result.boxes.cls
                confidences = result.boxes.conf

                if len(boxes) > 0:
                    detections_found = True
                    print(f"\nDetected with imgsz={imgsz}, conf={conf}: {len(boxes)} boxes")
                    for i, (box, cls, conf_score) in enumerate(zip(boxes, classes, confidences)):
                        label = model.names[int(cls)]
                        x1, y1, x2, y2 = box
                        print(f"  Box {i}: {label}, Conf={conf_score:.2f}, Coords=({x1:.1f},{y1:.1f},{x2:.1f},{y2:.1f})")

                    # Save annotated image
                    annotated = result.plot()
                    out_path = os.path.join(output_dir, f"{model_name}_{img_name}_imgsz{imgsz}_conf{conf}.jpg")
                    cv2.imwrite(out_path, annotated)
                    print(f"Annotated image saved to {out_path}")

        if not detections_found:
            print("No detections found with any imgsz/conf combination.")