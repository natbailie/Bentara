from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import shutil
import os
import uuid
import json
from datetime import datetime
from typing import Optional, List
from ultralytics import YOLO
from PIL import Image
from collections import Counter

app = FastAPI()

# --- CONFIGURATION (OPTIMIZED FOR HUGGING FACE) ---
# Persistent storage is not available in basic Spaces; use /tmp for session-based writing
UPLOAD_DIR = "/tmp/uploads"
DATASET_DIR = "/tmp/dataset"
DB_NAME = "/tmp/bentara.db"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "labels"), exist_ok=True)

# --- YOLO CLASS MAPPING ---
CLASS_MAP = {
    "Neutrophil": 0, "Lymphocyte": 1, "Monocyte": 2, "Eosinophil": 3,
    "Basophil": 4, "Blast Cell": 5, "RBC": 6, "Platelet": 7
}

# --- LOAD MODELS ---
# Looks specifically in the 'models/' folder you created
MODEL_FILES = ["eosinophil_best.pt", "lymphocyte_best.pt", "monocyte_best.pt", "neutrophil_best.pt", "blood_cell_best.pt"]
loaded_models = []

for model_file in MODEL_FILES:
    path = os.path.join("models", model_file)
    if os.path.exists(path):
        try:
            loaded_models.append(YOLO(path))
            print(f"✅ Successfully loaded {model_file}")
        except Exception as e:
            print(f"❌ Failed to load {model_file}: {e}")

if not loaded_models:
    print("📢 Using fallback model yolov8n.pt")
    loaded_models.append(YOLO("yolov8n.pt"))

# --- CORS SETTINGS ---
# Mandatory for allowing your Vercel frontend to communicate with this Space
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT, password TEXT NOT NULL, full_name TEXT, role TEXT, license_id TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, mrn TEXT UNIQUE NOT NULL, nhs_number TEXT NOT NULL, dob TEXT NOT NULL, gender TEXT NOT NULL, history TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER, date TEXT, image_url TEXT, diagnosis TEXT, confidence TEXT, status TEXT DEFAULT 'Pending', assigned_to TEXT, sample_type TEXT, sample_date TEXT, notes TEXT, detections TEXT, FOREIGN KEY(patient_id) REFERENCES patients(id))''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER, action TEXT, performed_by TEXT, timestamp TEXT, details TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS research_samples (id INTEGER PRIMARY KEY AUTOINCREMENT, contributor_id INTEGER, sample_type TEXT, image_url TEXT, annotations TEXT, notes TEXT, date TEXT, status TEXT DEFAULT 'Unverified')''')
    conn.commit()
    conn.close()

init_db()

# --- HELPER: YOLO COORDINATE CONVERSION ---
def save_yolo_label(base_filename, annotations_json):
    label_path = os.path.join(DATASET_DIR, "labels", f"{base_filename}.txt")
    try:
        parsed = json.loads(annotations_json)
        cells = parsed.get("cells", []) if isinstance(parsed, dict) else parsed
        with open(label_path, "w") as f:
            for cell in cells:
                label_name = cell["label"].split(":")[0].strip()
                class_id = CLASS_MAP.get(label_name, 0)
                w, h = cell["w"] / 100, cell["h"] / 100
                x_center = (cell["x"] / 100) + (w / 2)
                y_center = (cell["y"] / 100) + (h / 2)
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n")
    except Exception as e:
        print(f"❌ Failed to generate YOLO label: {e}")

# --- PYDANTIC MODELS ---
class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    role: str
    license_id: Optional[str] = None

class PatientRequest(BaseModel):
    name: str
    mrn: str
    nhs_number: str
    dob: str
    gender: str
    history: str = ""

class UpdateProfileRequest(BaseModel):
    full_name: str
    email: str
    role: str
    license_id: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- DEPENDENCIES ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT username, full_name, email, role, license_id, id FROM users WHERE username = ?", (token,))
    user = cursor.fetchone()
    conn.close()
    if not user: raise HTTPException(status_code=401, detail="Invalid session")
    return {"username": user[0], "full_name": user[1], "email": user[2], "role": user[3], "license_id": user[4], "id": user[5]}

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Bentara AI Backend is Running", "models": len(loaded_models)}

@app.post("/register")
def register_user(user: RegisterRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, full_name, email, role, license_id) VALUES (?, ?, ?, ?, ?, ?)",
            (user.username, user.password, user.full_name, user.email, user.role, user.license_id))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User ID already exists")
    finally:
        conn.close()
    return {"message": "Success"}

@app.post("/token")
def login(username: str = Form(...), password: str = Form(...)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?", (username, username, password))
    user = cursor.fetchone()
    conn.close()
    if user: return {"access_token": user[1], "token_type": "bearer", "user": {"username": user[1], "full_name": user[4], "role": user[5]}}
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.get("/dashboard/stats")
def get_stats():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM patients")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM reports WHERE status='Pending'")
    pending = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM reports WHERE diagnosis LIKE '%Acute%'")
    critical = cursor.fetchone()[0]
    conn.close()
    return {"total_patients": total, "pending_reports": pending, "critical_alerts": critical}

@app.post("/patients/register")
def register_patient(patient: PatientRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO patients (name, mrn, nhs_number, dob, gender, history) VALUES (?, ?, ?, ?, ?, ?)",
                       (patient.name, patient.mrn, patient.nhs_number, patient.dob, patient.gender, patient.history))
        conn.commit()
        pid = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="MRN already exists")
    finally:
        conn.close()
    return {"id": pid}

@app.get("/patients")
def get_patients():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "mrn": r[2], "nhs_number": r[3], "dob": r[4], "gender": r[5], "history": r[6]} for r in rows]

@app.post("/upload")
async def upload_slide(file: UploadFile = File(...), patient_id: int = Form(...), notes: str = Form(""),
                       sample_type: str = Form("Peripheral Blood Smear"), sample_date: str = Form(...),
                       assigned_to_id: str = Form(...), user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE username = ? OR license_id = ?", (assigned_to_id, assigned_to_id))
    consultant = cursor.fetchone()
    if not consultant: raise HTTPException(status_code=400, detail="Consultant not found")

    filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    detected_objects, class_names, highest_conf = [], [], 0.0
    for model in loaded_models:
        results = model(file_path)
        for result in results:
            img_h, img_w = result.orig_shape
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                label = model.names[int(box.cls[0])]
                detected_objects.append({"x": (x1/img_w)*100, "y": (y1/img_h)*100, "w": ((x2-x1)/img_w)*100, "h": ((y2-y1)/img_h)*100, "label": label, "score": f"{int(conf*100)}%"})
                class_names.append(label)
                highest_conf = max(highest_conf, conf)

    diagnosis = Counter(class_names).most_common(1)[0][0] if class_names else "No Abnormalities Detected"
    cursor.execute("INSERT INTO reports (patient_id, date, image_url, diagnosis, confidence, assigned_to, notes, sample_type, sample_date, detections) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)",
        (patient_id, f"/uploads/{filename}", diagnosis, f"{int(highest_conf * 100)}%", consultant[0], notes, sample_type, sample_date, json.dumps(detected_objects)))
    conn.commit()
    rid = cursor.lastrowid
    conn.close()
    return {"report_id": rid, "diagnosis": diagnosis, "image_url": f"/uploads/{filename}"}

@app.get("/reports/pending")
def get_pending_reports(user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT r.id, p.name, p.mrn, r.date, r.diagnosis, r.confidence, r.assigned_to, r.image_url FROM reports r JOIN patients p ON r.patient_id = p.id WHERE r.status = 'Pending' AND r.assigned_to = ?", (user['username'],))
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "patient_name": r[1], "patient_mrn": r[2], "date": r[3], "diagnosis": r[4], "confidence": r[5], "assigned_to": r[6], "image_url": r[7]} for r in rows]

@app.get("/reports/{report_id}")
def get_single_report(report_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT r.*, p.name, p.mrn, p.dob FROM reports r JOIN patients p ON r.patient_id = p.id WHERE r.id = ?", (report_id,))
    row = cursor.fetchone()
    if not row: conn.close(); raise HTTPException(status_code=404)
    cursor.execute("SELECT action, performed_by, timestamp, details FROM audit_logs WHERE report_id = ?", (report_id,))
    logs = cursor.fetchall()
    conn.close()
    return {"id": row[0], "diagnosis": row[4], "image_url": row[3], "detections": json.loads(row[11]) if row[11] else [], "audit_trail": [{"action": l[0], "user": l[1], "time": l[2], "details": l[3]} for l in logs]}

@app.post("/research/upload")
async def upload_research_sample(file: UploadFile = File(...), sample_type: str = Form(...), notes: str = Form(""), annotations: str = Form(...), user: dict = Depends(get_current_user)):
    jpg_filename = f"research_{uuid.uuid4()}.jpg"
    try:
        contents = await file.read()
        temp_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(temp_path, "wb") as f: f.write(contents)
        with Image.open(temp_path) as img:
            img.convert('RGB').save(os.path.join(DATASET_DIR, "images", jpg_filename), "JPEG", quality=95)
            img.convert('RGB').save(os.path.join(UPLOAD_DIR, jpg_filename), "JPEG")
        os.remove(temp_path)
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

    save_yolo_label(jpg_filename.replace(".jpg", ""), annotations)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO research_samples (contributor_id, sample_type, image_url, annotations, notes, date) VALUES (?, ?, ?, ?, ?, datetime('now'))", (user['id'], sample_type, f"/uploads/{jpg_filename}", annotations, notes))
    conn.commit()
    conn.close()
    return {"message": "Success"}

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)