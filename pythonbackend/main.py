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
from typing import Optional
from ultralytics import YOLO
from PIL import Image  # Added for JPEG conversion
from collections import Counter

app = FastAPI()

# --- CONFIGURATION ---
UPLOAD_DIR = "uploads"
DATASET_DIR = "dataset"  # New folder for training-ready files
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "labels"), exist_ok=True)
DB_NAME = "bentara.db"

# --- YOLO CLASS MAPPING (For Dataset Generation) ---
# This ensures "Neutrophil" becomes Class ID 0, etc. based on standard ML mapping
CLASS_MAP = {
    "Neutrophil": 0,
    "Lymphocyte": 1,
    "Monocyte": 2,
    "Eosinophil": 3,
    "Basophil": 4,
    "Blast Cell": 5,
    "RBC": 6,
    "Platelet": 7
}

# --- LOAD MULTIPLE YOLO MODELS ---
MODEL_FILES = [
    "eosinophil_best.pt",
    "lymphocyte_best.pt",
    "monocyte_best.pt",
    "neutrophil_best.pt",
    "blood_cell_best.pt"
]

loaded_models = []

print("--- LOADING AI MODELS ---")
for model_file in MODEL_FILES:
    path = os.path.join("models", model_file)
    if os.path.exists(path):
        print(f"✅ Loading: {model_file}")
        try:
            loaded_models.append(YOLO(path))
        except Exception as e:
            print(f"❌ Failed to load {model_file}: {e}")
    else:
        print(f"⚠️ Warning: {model_file} not found in 'models' folder.")

if not loaded_models:
    print("⚠️ No custom models found. Loading generic 'yolov8n.pt' fallback.")
    loaded_models.append(YOLO("yolov8n.pt"))

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

    # 1. Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            password TEXT NOT NULL,
            full_name TEXT,
            role TEXT,
            license_id TEXT
        )
    ''')

    # 2. Patients
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mrn TEXT UNIQUE NOT NULL,
            nhs_number TEXT NOT NULL,
            dob TEXT NOT NULL,
            gender TEXT NOT NULL,
            history TEXT
        )
    ''')

    # 3. Reports
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            date TEXT,
            image_url TEXT,
            diagnosis TEXT,
            confidence TEXT,
            status TEXT DEFAULT 'Pending',
            assigned_to TEXT, 
            sample_type TEXT,
            sample_date TEXT,
            notes TEXT,
            detections TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')

    # 4. Audit Logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER,
            action TEXT,
            performed_by TEXT,
            timestamp TEXT,
            details TEXT
        )
    ''')

    # 5. Research Samples
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS research_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contributor_id INTEGER,
            sample_type TEXT,
            image_url TEXT,
            annotations TEXT,
            notes TEXT,
            date TEXT,
            status TEXT DEFAULT 'Unverified'
        )
    ''')

    conn.commit()
    conn.close()


init_db()


# --- MODELS ---
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

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth")

    return {
        "username": user[0],
        "full_name": user[1],
        "email": user[2],
        "role": user[3],
        "license_id": user[4],
        "id": user[5]
    }


# --- HELPER: YOLO COORDINATE CONVERSION ---
def save_yolo_label(base_filename, annotations_json):
    label_path = os.path.join(DATASET_DIR, "labels", f"{base_filename}.txt")
    try:
        parsed = json.loads(annotations_json)
        # Handle both old list format and new nested dictionary format
        cells = parsed.get("cells", []) if isinstance(parsed, dict) else parsed

        with open(label_path, "w") as f:
            for cell in cells:
                # Extract primary name (e.g. "Neutrophil" from "Neutrophil: Segmented")
                label_name = cell["label"].split(":")[0].strip()
                class_id = CLASS_MAP.get(label_name, 0)

                # YOLO wants: center_x center_y width height (0-1 range)
                # Frontend sends: top-left_x top-left_y width height (0-100 range)
                w = cell["w"] / 100
                h = cell["h"] / 100
                x_center = (cell["x"] / 100) + (w / 2)
                y_center = (cell["y"] / 100) + (h / 2)

                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n")
    except Exception as e:
        print(f"❌ Failed to generate YOLO label: {e}")


# --- ENDPOINTS ---

@app.post("/register")
def register_user(user: RegisterRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, full_name, email, role, license_id) VALUES (?, ?, ?, ?, ?, ?)",
            (user.username, user.password, user.full_name, user.email, user.role, user.license_id))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    conn.close()
    return {"message": "User registered", "username": user.username}


@app.post("/token")
def login(username: str = Form(...), password: str = Form(...)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?",
                   (username, username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        return {"access_token": user[1], "token_type": "bearer",
                "user": {"username": user[1], "full_name": user[4], "role": user[5]}}
    else:
        raise HTTPException(status_code=400, detail="Invalid credentials")


@app.get("/users/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.put("/users/update")
def update_user_profile(profile: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE users 
        SET full_name = ?, email = ?, role = ?, license_id = ?
        WHERE username = ?
    """, (profile.full_name, profile.email, profile.role, profile.license_id, current_user['username']))

    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}


@app.post("/users/change-password")
def change_password(payload: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT password FROM users WHERE username = ?", (current_user['username'],))
    stored_password = cursor.fetchone()[0]

    if stored_password != payload.current_password:
        conn.close()
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (payload.new_password, current_user['username']))
    conn.commit()
    conn.close()

    return {"message": "Password updated successfully."}


@app.get("/dashboard/stats")
def get_stats():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM patients")
    total_patients = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM reports WHERE status='Pending'")
    pending = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM reports WHERE diagnosis LIKE '%Acute%'")
    critical = cursor.fetchone()[0]
    conn.close()
    return {"total_patients": total_patients, "pending_reports": pending, "critical_alerts": critical}


@app.post("/patients/register")
def register_patient(patient: PatientRequest):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO patients (name, mrn, nhs_number, dob, gender, history) VALUES (?, ?, ?, ?, ?, ?)",
                       (patient.name, patient.mrn, patient.nhs_number, patient.dob, patient.gender, patient.history))
        conn.commit()
        pid = cursor.lastrowid
    except sqlite3.IntegrityError as e:
        conn.close()
        if "UNIQUE constraint failed" in str(e): raise HTTPException(status_code=400, detail="MRN already exists")
        raise HTTPException(status_code=500, detail=f"Database Error: {e}")
    conn.close()
    return {"id": pid}


@app.get("/patients")
def get_patients():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    patients = []
    for row in rows:
        patients.append(
            {
                "id": row[0],
                "name": row[1],
                "mrn": row[2],
                "nhs_number": row[3],
                "dob": row[4],
                "gender": row[5],
                "history": row[6]
            }
        )
    return patients


@app.post("/upload")
async def upload_slide(
        file: UploadFile = File(...),
        patient_id: int = Form(...),
        notes: str = Form(""),
        sample_type: str = Form("Peripheral Blood Smear"),
        sample_date: str = Form(...),
        assigned_to_id: str = Form(...),
        user: dict = Depends(get_current_user)
):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # 1. Verify Consultant
    cursor.execute("SELECT username FROM users WHERE username = ? OR license_id = ?", (assigned_to_id, assigned_to_id))
    consultant = cursor.fetchone()

    if not consultant:
        conn.close()
        raise HTTPException(status_code=400, detail="Consultant ID not found in system")

    consultant_username = consultant[0]

    # 2. Save File
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. RUN INFERENCE ON ALL MODELS
    detected_objects = []
    class_names = []
    highest_conf = 0.0

    for model in loaded_models:
        results = model(file_path)

        for result in results:
            img_h, img_w = result.orig_shape

            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                label = model.names[cls]

                x_pct = (x1 / img_w) * 100
                y_pct = (y1 / img_h) * 100
                w_pct = ((x2 - x1) / img_w) * 100
                h_pct = ((y2 - y1) / img_h) * 100

                detected_objects.append({
                    "x": x_pct,
                    "y": y_pct,
                    "w": w_pct,
                    "h": h_pct,
                    "label": label,
                    "score": f"{int(conf * 100)}%"
                })

                class_names.append(label)
                if conf > highest_conf:
                    highest_conf = conf

    if class_names:
        most_common = Counter(class_names).most_common(1)
        diagnosis = most_common[0][0]
        confidence = f"{int(highest_conf * 100)}%"
    else:
        diagnosis = "No Abnormalities Detected"
        confidence = "100%"

    detections_json = json.dumps(detected_objects)

    cursor.execute("""
        INSERT INTO reports (patient_id, date, image_url, diagnosis, confidence, assigned_to, notes, sample_type, sample_date, detections) 
        VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)
    """, (patient_id, f"/uploads/{filename}", diagnosis, confidence, consultant_username, notes, sample_type,
          sample_date, detections_json))

    conn.commit()
    report_id = cursor.lastrowid
    conn.close()

    return {
        "report_id": report_id,
        "diagnosis": diagnosis,
        "confidence": confidence,
        "image_url": f"/uploads/{filename}",
        "assigned_to": consultant_username
    }


@app.get("/reports/pending")
def get_pending_reports(user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.id, p.name, p.mrn, r.date, r.diagnosis, r.confidence, r.assigned_to, r.image_url, r.patient_id, r.sample_type, r.sample_date
        FROM reports r
        JOIN patients p ON r.patient_id = p.id
        WHERE r.status = 'Pending' AND r.assigned_to = ?
    """, (user['username'],))
    rows = cursor.fetchall()
    conn.close()

    reports = []
    for row in rows:
        reports.append({
            "id": row[0],
            "patient_name": row[1],
            "patient_mrn": row[2],
            "date": row[3],
            "diagnosis": row[4],
            "confidence": row[5],
            "assigned_to": row[6],
            "image_url": row[7],
            "patient_id": row[8],
            "sample_type": row[9],
            "sample_date": row[10]
        })
    return reports


@app.post("/reports/{report_id}/signoff")
def sign_off_report(report_id: int, user: dict = Depends(get_current_user)):
    if "Consultant" not in user['role'] and "Pathologist" not in user['role']:
        raise HTTPException(status_code=403, detail="Unauthorized: Only Consultants can sign off reports.")

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("UPDATE reports SET status = 'Authorized' WHERE id = ?", (report_id,))

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    details = f"Authorized by {user['full_name']} ({user['role']})"
    cursor.execute(
        "INSERT INTO audit_logs (report_id, action, performed_by, timestamp, details) VALUES (?, ?, ?, ?, ?)",
        (report_id, "AUTHORIZED", user['username'], timestamp, details))

    conn.commit()
    conn.close()
    return {"message": "Report authorized and audited."}


@app.get("/patients/{patient_id}")
def get_patient_details(patient_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = cursor.fetchone()
    if not patient: raise HTTPException(status_code=404)

    cursor.execute("""
        SELECT id, date, diagnosis, confidence, status, image_url, assigned_to, sample_type, sample_date 
        FROM reports WHERE patient_id = ? ORDER BY id DESC
    """, (patient_id,))
    reports_rows = cursor.fetchall()
    conn.close()

    reports = []
    for r in reports_rows:
        reports.append({
            "id": r[0], "date": r[1], "diagnosis": r[2], "confidence": r[3], "status": r[4],
            "image_url": r[5], "assigned_to": r[6], "sample_type": r[7], "sample_date": r[8]
        })

    return {
        "id": patient[0], "name": patient[1], "mrn": patient[2], "nhs_number": patient[3],
        "dob": patient[4], "gender": patient[5], "history": patient[6], "reports": reports
    }


@app.get("/reports/{report_id}")
def get_single_report(report_id: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT r.id, r.date, r.diagnosis, r.confidence, r.status, r.image_url, r.notes, r.sample_type, r.sample_date, 
               p.name, p.mrn, p.nhs_number, p.dob, p.gender, u.full_name, u.role, r.detections
        FROM reports r
        JOIN patients p ON r.patient_id = p.id
        LEFT JOIN users u ON r.assigned_to = u.username
        WHERE r.id = ?
    """, (report_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    cursor.execute("SELECT action, performed_by, timestamp, details FROM audit_logs WHERE report_id = ?", (report_id,))
    logs = cursor.fetchall()
    audit_trail = [{"action": l[0], "user": l[1], "time": l[2], "details": l[3]} for l in logs]

    conn.close()

    try:
        detections = json.loads(row[16]) if row[16] else []
    except:
        detections = []

    return {
        "id": row[0], "date": row[1], "diagnosis": row[2], "confidence": row[3], "status": row[4],
        "image_url": row[5], "notes": row[6], "sample_type": row[7], "sample_date": row[8],
        "patient": {"name": row[9], "mrn": row[10], "nhs_number": row[11], "dob": row[12], "gender": row[13]},
        "consultant": {"name": row[14], "role": row[15]},
        "detections": detections,
        "audit_trail": audit_trail
    }


# --- RESEARCH ENDPOINTS ---

@app.post("/research/upload")
async def upload_research_sample(
        file: UploadFile = File(...),
        sample_type: str = Form(...),
        notes: str = Form(""),
        annotations: str = Form(...),
        user: dict = Depends(get_current_user)
):
    # 1. Standardize base ID and filename
    base_id = str(uuid.uuid4())
    base_name = f"research_{base_id}"
    jpg_filename = f"{base_name}.jpg"

    # 2. Process Image: Standardize to RGB JPEG for ML training
    try:
        contents = await file.read()
        # Save temp file
        temp_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(temp_path, "wb") as f:
            f.write(contents)

        with Image.open(temp_path) as img:
            rgb_img = img.convert('RGB')
            # Save for Training Dataset
            rgb_img.save(os.path.join(DATASET_DIR, "images", jpg_filename), "JPEG", quality=95)
            # Save for App UI Gallery preview
            rgb_img.save(os.path.join(UPLOAD_DIR, jpg_filename), "JPEG")

        os.remove(temp_path)  # Cleanup temp original file
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {e}")

    # 3. Create YOLO formatted label file (.txt)
    save_yolo_label(base_name, annotations)

    # 4. Save metadata to Database
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    user_id = user['id']

    cursor.execute("""
        INSERT INTO research_samples (contributor_id, sample_type, image_url, annotations, notes, date)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    """, (user_id, sample_type, f"/uploads/{jpg_filename}", annotations, notes))

    conn.commit()
    conn.close()

    return {"message": "Contribution saved and processed for training dataset"}


@app.get("/research/gallery")
def get_research_gallery(sample_type: Optional[str] = None):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    query = "SELECT r.id, r.sample_type, r.image_url, r.annotations, u.full_name, r.date FROM research_samples r LEFT JOIN users u ON r.contributor_id = u.id"
    params = []

    if sample_type:
        query += " WHERE r.sample_type = ?"
        params.append(sample_type)

    # Default sort newest first
    query += " ORDER BY r.date DESC"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()

    gallery = []
    for r in rows:
        try:
            # Parse the JSON annotation string
            parsed_ann = json.loads(r[3])

            # Handle both old list-only format and new nested dictionary format
            if isinstance(parsed_ann, dict) and 'cells' in parsed_ann:
                box_count = len(parsed_ann['cells'])
            else:
                box_count = len(parsed_ann)
        except Exception as e:
            print(f"Error parsing sample {r[0]}: {e}")
            box_count = 0

        gallery.append({
            "id": r[0],
            "type": r[1],
            "image_url": r[2],
            "annotations": r[3],
            "contributor": r[4] if r[4] else "Anonymous",
            "date": r[5],
            "box_count": box_count
        })

    return gallery


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)