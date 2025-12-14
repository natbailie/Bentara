# main.py
import os
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from passlib.context import CryptContext
from PIL import Image
from ultralytics import YOLO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

from database import init_db, get_db
from models import (
    UserRegister,
    UserLogin,
    PatientCreateFull,
    PatientUpdateFull,
    SettingsUpdate,
)

# ---------------------------
# App + CORS
# ---------------------------
app = FastAPI(title="Bentara Pathology API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Password hashing
# ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pw(pw: str) -> str:
    return pwd_context.hash(pw)


def verify_pw(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------
# File paths
# ---------------------------
BASE = Path(__file__).parent
UPLOADS = BASE / "saved" / "uploads"
IMAGES = BASE / "saved" / "images"
PDFS = BASE / "saved" / "pdfs"
OUTPUTS = BASE / "outputs"

for d in (UPLOADS, IMAGES, PDFS, OUTPUTS):
    d.mkdir(parents=True, exist_ok=True)


# ---------------------------
# YOLO models (multi-model)
# ---------------------------
MODEL_PATHS = {
    "eosinophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Eosinophil_detector/weights/best.pt",
    "neutrophil": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Neutrophil_detector/weights/best.pt",
    "lymphocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Lymphocyte_detector/weights/best.pt",
    "monocyte": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/Monocyte_detector/weights/best.pt",
    "bloodcells": "/Users/natbailie/Documents/Blood Cell Identifier Project/Yolo Models/detect/blood_cell_detector/weights/best.pt",
}
# Load models lazily to reduce startup time if file missing — attempt load, otherwise raise on use.
MODELS = {}
for k, v in MODEL_PATHS.items():
    try:
        MODELS[k] = YOLO(v)
    except Exception:
        # model failed to load now; will raise if used
        MODELS[k] = None

RBC_CLASSES = {"rbc", "red blood cell", "erythrocyte"}
WBC_CLASSES = {"wbc", "white blood cell", "leukocyte"}


# ---------------------------
# Startup DB
# ---------------------------
@app.on_event("startup")
def startup():
    init_db()


# ---------------------------
# Static routes for frontend file access
# ---------------------------
@app.get("/saved/uploads/{filename}")
def get_upload_file(filename: str):
    p = UPLOADS / filename
    if not p.exists():
        raise HTTPException(404, "Not found")
    return FileResponse(p)


@app.get("/outputs/{filename}")
def get_output_file(filename: str):
    p = OUTPUTS / filename
    if not p.exists():
        raise HTTPException(404, "Not found")
    return FileResponse(p)


@app.get("/saved/pdfs/{filename}")
def get_pdf_file(filename: str):
    p = PDFS / filename
    if not p.exists():
        raise HTTPException(404, "Not found")
    return FileResponse(p, media_type="application/pdf")


# ---------------------------
# Auth endpoints
# ---------------------------
@app.post("/register")
def register(data: UserRegister):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (data.email, hash_pw(data.password)),
        )
        conn.commit()
        return {"status": "ok"}
    except Exception:
        conn.rollback()
        raise HTTPException(400, "User already exists")
    finally:
        conn.close()


@app.post("/login")
def login(payload: dict):
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    if username == "" or password == "":
        raise HTTPException(status_code=400, detail="Missing username or password")

    # ✔ DEMO MODE: Accept ANY username/password
    return {
        "success": True,
        "token": "demo-token",
        "user": {"name": username}
    }


# ---------------------------
# Settings endpoints
# ---------------------------
@app.get("/settings")
def get_settings():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT show_clinician FROM settings WHERE id=1")
    row = cur.fetchone()
    conn.close()
    return {"show_clinician": bool(row["show_clinician"])}


@app.post("/settings")
def update_settings(data: SettingsUpdate):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE settings SET show_clinician=? WHERE id=1", (1 if data.show_clinician else 0,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


# ---------------------------
# Patients: create / get / search / list
# ---------------------------
@app.post("/patients/create")
def create_patient(data: PatientCreateFull):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO patients
        (name, dob, sex, mrn, nhs_number, clinician, stain, zoom, indication, ward, sample_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.name,
            data.dob,
            data.sex,
            data.mrn,
            data.nhs_number,
            data.clinician,
            data.stain,
            data.zoom,
            data.indication,
            data.ward,
            data.sample_date,
        ),
    )
    conn.commit()
    pid = cur.lastrowid
    conn.close()
    return {"patient_id": pid}


@app.get("/patients/{patient_id}")
def get_patient(patient_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients WHERE id=?", (patient_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Patient not found")
    return dict(row)


@app.get("/patients/search")
def patients_search(query: str = ""):
    conn = get_db()
    cur = conn.cursor()
    like = f"%{query}%"
    cur.execute("SELECT * FROM patients WHERE name LIKE ? OR mrn LIKE ? OR nhs_number LIKE ? ORDER BY id DESC LIMIT 200", (like, like, like))
    rows = cur.fetchall()
    conn.close()
    return {"patients": [dict(r) for r in rows]}


@app.get("/patients")
def list_patients(limit: int = 100):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients ORDER BY id DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()
    return {"patients": [dict(r) for r in rows]}


# ---------------------------
# Reports list for patient
# ---------------------------
@app.get("/reports/{patient_id}")
def list_reports(patient_id: int):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM reports WHERE patient_id=? ORDER BY id DESC", (patient_id,))
    rows = cur.fetchall()
    conn.close()
    return {"reports": [dict(r) for r in rows]}


# ---------------------------
# Upload endpoint (requires patient_id)
# ---------------------------
@app.post("/upload")
async def upload(
    file: UploadFile = File(...),
    patient_id: int = Form(...),
):
    # validate patient exists
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients WHERE id=?", (patient_id,))
    patient = cur.fetchone()
    conn.close()
    if not patient:
        raise HTTPException(400, "patient_id invalid - open patient chart first")

    # persist upload
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{ts}_{file.filename}"
    saved_path = UPLOADS / filename
    with saved_path.open("wb") as f:
        f.write(await file.read())

    # run models sequentially; count & annotate
    counts = {
        "eosinophils": 0,
        "neutrophils": 0,
        "lymphocytes": 0,
        "monocytes": 0,
        "rbcs": 0,
        "wbcs": 0,
    }

    # initial image path (will be replaced by annotated output every model)
    current_img_path = saved_path

    for name, model in MODELS.items():
        if model is None:
            continue  # skip missing model; you may want to log
        results = model(str(current_img_path))

        # count detections
        for r in results:
            for box in r.boxes:
                cls_name = r.names[int(box.cls)].lower()
                if cls_name in RBC_CLASSES:
                    counts["rbcs"] += 1
                elif cls_name in WBC_CLASSES:
                    counts["wbcs"] += 1
                elif name in counts:
                    counts[name] += 1

        # create annotated image and save to outputs with unique name
        annotated_np = results[0].plot()
        annotated_img = Image.fromarray(annotated_np)
        out_name = f"annotated_{name}_{ts}.jpg"
        out_path = OUTPUTS / out_name
        annotated_img.save(out_path)
        current_img_path = out_path

    # derive simple diagnostic impression (tune thresholds as appropriate)
    total_wbc = counts["eosinophils"] + counts["neutrophils"] + counts["lymphocytes"] + counts["monocytes"]
    if total_wbc > 50:
        diagnosis = "High leukocyte count — consider infection or inflammation."
    elif total_wbc < 3:
        diagnosis = "Low white cell count — consider marrow suppression."
    else:
        diagnosis = "Within automated limits."

    # generate PDF report containing full patient banner fields
    pdf_name = f"Report_{patient_id}_{ts}.pdf"
    pdf_path = PDFS / pdf_name
    create_pdf_report(
        pdf_path=str(pdf_path),
        patient_row=patient,
        counts=counts,
        diagnosis=diagnosis,
        annotated_image_path=str(current_img_path)
    )

    # store report record
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO reports
        (patient_id, report_date, pdf_path, annotated_image_path,
        eosinophils, neutrophils, lymphocytes, monocytes, rbcs, wbcs, diagnosis)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            patient_id,
            datetime.now().isoformat(),
            f"saved/pdfs/{pdf_name}",
            f"outputs/{current_img_path.name}",
            counts["eosinophils"],
            counts["neutrophils"],
            counts["lymphocytes"],
            counts["monocytes"],
            counts["rbcs"],
            counts["wbcs"],
            diagnosis,
        ),
    )
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "annotated_image": f"outputs/{current_img_path.name}",
        "pdf": f"saved/pdfs/{pdf_name}",
        "counts": counts,
        "diagnosis": diagnosis,
    }


# ---------------------------
# PDF generator helper
# ---------------------------
def create_pdf_report(pdf_path: str, patient_row, counts: dict, diagnosis: str, annotated_image_path: str):
    """
    Create a clinical PDF report using ReportLab containing the full patient banner info.
    patient_row: sqlite3.Row mapping for patient
    """
    pdf_path = Path(pdf_path)
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(pdf_path), pagesize=A4)
    width, height = A4

    # Logo - use frontend public path FS if available (adjust path if you copy logo to backend)
    logo_fs = Path("/Users/natbailie/Documents/Blood Cell Identifier Project/typescriptfrontend/public/bentaralogo.jpg")
    if logo_fs.exists():
        try:
            c.drawImage(str(logo_fs), 40, height - 90, width=70, height=70)
        except Exception:
            pass

    # Title area
    c.setFont("Helvetica-Bold", 18)
    c.drawString(120, height - 60, "Bentara Pathology — Haematology Report")

    # Patient banner block
    y = height - 120
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Patient:")
    c.setFont("Helvetica", 11)
    c.drawString(120, y, str(patient_row["name"]))
    y -= 16

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "DOB:")
    c.setFont("Helvetica", 11)
    c.drawString(120, y, str(patient_row.get("dob") or ""))
    c.drawString(320, y, f"Sex: {patient_row.get('sex') or ''}")
    y -= 16

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "MRN:")
    c.setFont("Helvetica", 11)
    c.drawString(120, y, str(patient_row.get("mrn") or ""))
    c.drawString(320, y, f"NHS No: {patient_row.get('nhs_number') or ''}")
    y -= 16

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Clinician:")
    c.setFont("Helvetica", 11)
    c.drawString(120, y, str(patient_row.get("clinician") or ""))
    c.drawString(320, y, f"Ward: {patient_row.get('ward') or ''}")
    y -= 18

    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, y, "Sample date:")
    c.setFont("Helvetica", 11)
    c.drawString(160, y, str(patient_row.get("sample_date") or ""))
    c.drawString(320, y, f"Stain: {patient_row.get('stain') or ''} | Zoom: {patient_row.get('zoom') or ''}")
    y -= 26

    # Table of counts (simple layout)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(40, y, "Automated Cell Counts")
    y -= 18
    c.setFont("Helvetica", 11)

    for k, v in counts.items():
        c.drawString(40, y, f"{k.title()}: {v}")
        y -= 14

    y -= 10
    c.setFont("Helvetica-Bold", 13)
    c.drawString(40, y, "AI Impression")
    y -= 16
    c.setFont("Helvetica", 11)
    c.drawString(40, y, diagnosis)
    y -= 24

    # Annotated image (fit into page)
    try:
        max_w = width - 80
        img = Image.open(annotated_image_path)
        iw, ih = img.size
        scale = min(1.0, max_w / iw, 300 / ih)
        w_img = iw * scale
        h_img = ih * scale
        # draw image centered horizontally
        x = (width - w_img) / 2
        c.drawImage(str(annotated_image_path), x, 60, width=w_img, height=h_img)
    except Exception:
        pass

    # Footer / legal
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(40, 40, "This report is a demonstration of AI-assisted analysis and must be validated by a qualified haematologist before clinical use.")
    c.showPage()
    c.save()


# End of file