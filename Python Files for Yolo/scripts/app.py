# ==========================================================
# Bentara Pathology Backend (Multi-Model YOLOv8 + Composite PDF)
# ==========================================================
# FastAPI backend for blood film image upload, YOLOv8 detection,
# automatic PDF report generation with composite image.
# ==========================================================

import os
import json
import shutil
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

# ==========================================================
# INITIALIZE FASTAPI APP
# ==========================================================
app = FastAPI(title="Bentara Pathology Backend (Multi-Model + Composite PDF)", version="5.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ⚠️ Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# PATH CONFIGURATION
# ==========================================================
BASE_DIR = os.path.dirname(__file__)
BASE_OUTPUT = os.path.abspath(os.path.join(BASE_DIR, "../Application/outputs/reports"))
os.makedirs(BASE_OUTPUT, exist_ok=True)

# ==========================================================
# YOLO MODEL PATHS
# ==========================================================
MODEL_PATHS = {
    "Neutrophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Neutrophil_detector/weights/best.pt",
    "Lymphocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Lymphocyte_detector/weights/best.pt",
    "Monocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Monocyte_detector/weights/best.pt",
    "Eosinophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Eosinophil_detector/weights/best.pt",
    "Bloodcells": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/blood_cell_detector/weights/best.pt"
}

# ==========================================================
# LOAD YOLO MODELS INTO MEMORY
# ==========================================================
MODELS = {}
for cell_type, path in MODEL_PATHS.items():
    if os.path.exists(path):
        try:
            model = YOLO(path)
            MODELS[cell_type] = model
            print(f"✅ Loaded {cell_type} model from {path}")
        except Exception as e:
            print(f"❌ Failed to load {cell_type} model: {e}")
    else:
        print(f"⚠️ Model not found for {cell_type} at {path}")

if not MODELS:
    raise RuntimeError("❌ No YOLO models loaded. Check model paths!")

# ==========================================================
# ROOT ENDPOINT
# ==========================================================
@app.get("/")
def read_root():
    return {
        "message": "Bentara Pathology Backend (Multi-Model + Composite PDF) is running!",
        "models_loaded": list(MODELS.keys())
    }

# ==========================================================
# ANALYZE ENDPOINT
# ==========================================================
@app.post("/analyze")
async def analyze(
    patient_id: str = Form(...),
    clinician: str = Form(...),
    image_type: str = Form(...),
    stain: str = Form(...),
    zoom: str = Form(...),
    file: UploadFile = File(...),
):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    patient_dir = os.path.join(BASE_OUTPUT, f"Patient_{patient_id}")
    os.makedirs(patient_dir, exist_ok=True)

    # Save uploaded image
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    image_filename = f"image_{timestamp}{ext}"
    image_path = os.path.join(patient_dir, image_filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    print(f"📸 Image saved: {image_path}")

    # Run multi-model YOLOv8 detection
    combined_counts = {}
    annotated_dirs = {}

    for cell_type, model in MODELS.items():
        print(f"🔬 Running {cell_type} model...")
        try:
            results = model(image_path, save=True, project=patient_dir, name=f"{cell_type}_annotated_{timestamp}")
            detections = results[0]
            count = len(detections.boxes.cls) if detections.boxes is not None else 0
            combined_counts[cell_type] = int(count)

            result_dir = os.path.join(patient_dir, f"{cell_type}_annotated_{timestamp}")
            annotated_files = [f for f in os.listdir(result_dir) if f.endswith((".jpg", ".png"))]
            if annotated_files:
                annotated_dirs[cell_type] = os.path.join(result_dir, annotated_files[0])
        except Exception as e:
            print(f"⚠️ Error running {cell_type} model: {e}")
            combined_counts[cell_type] = 0

    # Generate composite annotated image
    composite_path = os.path.join(patient_dir, f"composite_{timestamp}.png")
    if annotated_dirs:
        images = []
        for img_path in annotated_dirs.values():
            img = Image.open(img_path)
            img = img.resize((200, 200))  # uniform size
            images.append(img)
        total_width = sum(img.width for img in images)
        max_height = max(img.height for img in images)
        composite = Image.new("RGB", (total_width, max_height), color=(255, 255, 255))
        x_offset = 0
        for img in images:
            composite.paste(img, (x_offset, 0))
            x_offset += img.width
        composite.save(composite_path)
        print(f"✅ Composite annotated image saved: {composite_path}")
    else:
        composite_path = None

    # Generate PDF report
    pdf_path = os.path.join(patient_dir, f"report_{timestamp}.pdf")
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "Bentara Pathology Blood Film Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 90, f"Patient ID: {patient_id}")
    c.drawString(50, height - 110, f"Clinician: {clinician}")
    c.drawString(50, height - 130, f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(50, height - 150, f"Image Type: {image_type}")
    c.drawString(50, height - 170, f"Stain: {stain}")
    c.drawString(50, height - 190, f"Zoom: {zoom}")

    # Cell counts
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 220, "Cell Counts:")
    c.setFont("Helvetica", 12)
    y_pos = height - 240
    for cell, count in combined_counts.items():
        c.drawString(60, y_pos, f"{cell}: {count}")
        y_pos -= 20

    # Composite image
    if composite_path:
        try:
            img = ImageReader(composite_path)
            c.drawImage(img, 50, y_pos - 220, width=500, height=200, preserveAspectRatio=True)
            c.drawString(50, y_pos - 240, "Composite annotated image")
        except Exception as e:
            print(f"⚠️ Could not add composite image to PDF: {e}")

    c.save()

    # Save metadata JSON
    meta = {
        "patient_id": patient_id,
        "analyst": clinician,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "image_type": image_type,
        "stain_used": stain,
        "zoom_used": zoom,
        "cell_counts": combined_counts,
        "annotated_images": annotated_dirs,
        "composite_image_path": composite_path,
        "pdf_path": pdf_path,
        "diagnosis": "Pending Review"
    }

    meta_path = os.path.join(patient_dir, f"meta_{timestamp}.json")
    with open(meta_path, "w", encoding="utf-8") as jf:
        json.dump(meta, jf, indent=2)

    print(f"✅ Analysis & PDF complete for Patient {patient_id}")

    return JSONResponse({
        "ok": True,
        "message": "Multi-model YOLOv8 analysis + composite PDF report complete",
        "meta": meta
    })

# ==========================================================
# HOW TO RUN
# ==========================================================
# 1. Activate environment:
#    cd "/Users/natbailie/Documents/Blood Cell Identifier Project/Python Files for Yolo/scripts"
#    source venv/bin/activate
# 2. Install dependencies:
#    pip install fastapi uvicorn python-multipart ultralytics opencv-python reportlab pillow
# 3. Run backend:
#    uvicorn app:app --reload
# 4. Test root: http://127.0.0.1:8000/
# 5. POST /analyze with image upload
# ==========================================================

# source "/Users/natbailie/Documents/Blood Cell Identifier Project/Python Files for Yolo/scripts/venv/bin/activate" && cd "/Users/natbailie/Documents/Blood Cell Identifier Project/Python Files for Yolo# /scripts" && uvicorn app:app --reload