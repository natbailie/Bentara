import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import os
import sys
from PyQt6.QtCore import QThread, pyqtSignal
from ultralytics import YOLO
import cv2

def resource_path(rel):
    try:
        base = sys._MEIPASS
    except Exception:
        base = os.path.abspath(os.path.dirname(__file__))
    return os.path.join(base, rel)

# Look for models inside Application/models/ or fallback to runs/detect
MODEL_DIRS = {
    "Neutrophil": "Neutrophil_detector",
    "Lymphocyte": "Lymphocyte_detector",
    "Monocyte": "Monocyte_detector",
    "Eosinophil": "Eosinophil_detector",
    "BloodCells": "blood_cell_detector",
}

def resolve_model(folder_name):
    # custom override
    cfg = os.path.join(os.path.dirname(__file__), "config_models.txt")
    if os.path.exists(cfg):
        custom = open(cfg).read().strip()
        candidate = os.path.join(custom, folder_name, "weights", "best.pt")
        if os.path.exists(candidate):
            return candidate

    # Application/models
    base = os.path.abspath(os.path.dirname(__file__))
    candidate = os.path.join(base, "models", folder_name, "weights", "best.pt")
    if os.path.exists(candidate):
        return candidate

    # fallback to repo runs/detect
    candidate = os.path.join(base, "..", "runs", "detect", folder_name, "weights", "best.pt")
    if os.path.exists(candidate):
        return os.path.abspath(candidate)

    return None

class CellDetector:
    def __init__(self):
        self.models = {}
        for name, folder in MODEL_DIRS.items():
            path = resolve_model(folder)
            if path and os.path.exists(path):
                try:
                    self.models[name] = YOLO(path)
                    print(f"Loaded model: {name}")
                except Exception as e:
                    print("Error loading", name, e)
            else:
                print("Model not found:", name)

    def run_on_image(self, image_path):
        image = cv2.imread(image_path)
        combined = {}
        annotated = image.copy()
        for name, model in self.models.items():
            results = model(image)
            boxes = results[0].boxes
            for box in boxes:
                cls = int(box.cls[0])
                label = model.names[cls]
                combined[label] = combined.get(label, 0) + 1
            annotated = results[0].plot()  # returns annotated image (numpy)
        # save annotated to unique file
        out_path = os.path.join(os.path.dirname(__file__), "annotated_last.jpg")
        cv2.imwrite(out_path, annotated)
        return combined, out_path

# Worker thread
class DetectionWorker(QThread):
    finished = pyqtSignal(dict, str)   # counts, annotated_path
    error = pyqtSignal(str)

    def __init__(self, image_path, detector: CellDetector):
        super().__init__()
        self.image_path = image_path
        self.detector = detector

    def run(self):
        try:
            counts, annotated = self.detector.run_on_image(self.image_path)
            self.finished.emit(counts, annotated)
        except Exception as e:
            self.error.emit(str(e))