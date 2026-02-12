from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
import shutil
import os
import uuid
import json
from typing import Optional, List
from ultralytics import YOLO
from collections import Counter
import datetime

# --- IMPORT DATABASE CONNECTION ---
from database import engine, SessionLocal, Base

app = FastAPI()

# --- CLOUD CONFIGURATION ---
UPLOAD_DIR = "/tmp/uploads"
DATASET_DIR = "/tmp/dataset"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(DATASET_DIR, "labels"), exist_ok=True)

# --- DATABASE MODELS (SQLAlchemy) ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String)
    password = Column(String)
    full_name = Column(String)
    role = Column(String)
    license_id = Column(String)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mrn = Column(String, unique=True, index=True)
    nhs_number = Column(String)
    dob = Column(String)
    gender = Column(String)
    history = Column(Text)

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    date = Column(DateTime(timezone=True), server_default=func.now())
    image_url = Column(String)
    diagnosis = Column(String)
    confidence = Column(String)
    status = Column(String, default='Pending')
    assigned_to = Column(String)
    sample_type = Column(String)
    sample_date = Column(String)
    notes = Column(Text)
    detections = Column(Text)

class ResearchSample(Base):
    __tablename__ = "research_samples"
    id = Column(Integer, primary_key=True, index=True)
    contributor_name = Column(String)
    sample_type = Column(String)
    image_url = Column(String)
    notes = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default='Unverified')

# --- CREATE TABLES ---
Base.metadata.create_all(bind=engine)

# --- DB DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- YOLO CONFIG ---
CLASS_MAP = {
    "Neutrophil": 0, "Lymphocyte": 1, "Monocyte": 2, "Eosinophil": 3,
    "Basophil": 4, "Blast Cell": 5, "RBC": 6, "Platelet": 7
}

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

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- PYDANTIC SCHEMAS ---
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

class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = ""

# --- AUTH HELPER ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Bentara Cloud Backend Running", "db_type": "PostgreSQL (Supabase)"}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "license_id": current_user.license_id,
        "id": current_user.id
    }

@app.post("/token")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        ((User.username == username) | (User.email == username)) & (User.password == password)
    ).first()
    
    if user:
        return {
            "access_token": user.username, 
            "token_type": "bearer", 
            "user": {"username": user.username, "full_name": user.full_name, "role": user.role}
        }
    raise HTTPException(status_code=400, detail="Invalid credentials")

@app.post("/register")
def register_user(user: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = User(
        username=user.username,
        password=user.password,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        license_id=user.license_id
    )
    db.add(new_user)
    db.commit()
    return {"message": "Success"}

@app.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Patient).count()
    pending = db.query(Report).filter(Report.status == 'Pending').count()
    critical = db.query(Report).filter(Report.diagnosis.contains('Acute')).count()
    return {"total_patients": total, "pending_reports": pending, "critical_alerts": critical}

@app.post("/patients/register")
def register_patient(patient: PatientRequest, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.mrn == patient.mrn).first()
    if existing:
        raise HTTPException(status_code=400, detail="MRN already exists")
    
    new_patient = Patient(
        name=patient.name,
        mrn=patient.mrn,
        nhs_number=patient.nhs_number,
        dob=patient.dob,
        gender=patient.gender,
        history=patient.history
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return {"id": new_patient.id}

@app.get("/patients")
def get_patients(db: Session = Depends(get_db)):
    return db.query(Patient).order_by(Patient.id.desc()).all()

@app.get("/patients/{patient_id}")
def get_patient_details(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    reports = db.query(Report).filter(Report.patient_id == patient_id).all()
    
    return {
        "id": patient.id,
        "name": patient.name,
        "mrn": patient.mrn,
        "nhs_number": patient.nhs_number,
        "dob": patient.dob,
        "gender": patient.gender,
        "history": patient.history,
        "reports": [{
            "id": r.id, 
            "date": str(r.date), 
            "diagnosis": r.diagnosis, 
            "confidence": r.confidence, 
            "status": r.status, 
            "image_url": r.image_url,
            "assigned_to": r.assigned_to
        } for r in reports]
    }

@app.post("/upload")
async def upload_slide(
    file: UploadFile = File(...), 
    patient_id: int = Form(...), 
    notes: str = Form(""),
    sample_type: str = Form("Peripheral Blood Smear"), 
    sample_date: str = Form(...),
    assigned_to_id: str = Form(...), 
    db: Session = Depends(get_db)
):
    consultant = db.query(User).filter((User.username == assigned_to_id) | (User.license_id == assigned_to_id)).first()
    if not consultant:
        raise HTTPException(status_code=400, detail="Consultant not found")

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
                detected_objects.append({
                    "x": (x1/img_w)*100, 
                    "y": (y1/img_h)*100, 
                    "w": ((x2-x1)/img_w)*100, 
                    "h": ((y2-y1)/img_h)*100, 
                    "label": label, 
                    "score": f"{int(conf*100)}%"
                })
                class_names.append(label)
                highest_conf = max(highest_conf, conf)

    diagnosis = Counter(class_names).most_common(1)[0][0] if class_names else "No Abnormalities Detected"
    
    new_report = Report(
        patient_id=patient_id,
        image_url=f"/uploads/{filename}",
        diagnosis=diagnosis,
        confidence=f"{int(highest_conf * 100)}%",
        assigned_to=consultant.username,
        notes=notes,
        sample_type=sample_type,
        sample_date=sample_date,
        detections=json.dumps(detected_objects),
        status='Pending'
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return {"report_id": new_report.id, "diagnosis": diagnosis, "image_url": f"/uploads/{filename}"}

@app.get("/reports/pending")
def get_pending_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch reports assigned to the current user with status 'Pending'"""
    
    # Debug: If admin, show all pending (Optional helper)
    if current_user.role == "Admin":
         reports = db.query(Report).join(Patient).filter(Report.status == 'Pending').all()
    else:
         reports = db.query(Report).join(Patient).filter(
             (Report.status == 'Pending') & (Report.assigned_to == current_user.username)
         ).all()

    return [{
        "id": r.id, 
        "patient_name": r.patient.name if r.patient else "Unknown",
        "patient_mrn": r.patient.mrn if r.patient else "N/A",
        "date": str(r.date), 
        "diagnosis": r.diagnosis, 
        "confidence": r.confidence, 
        "assigned_to": r.assigned_to,
        "image_url": r.image_url
    } for r in reports]

@app.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    patient = db.query(Patient).filter(Patient.id == report.patient_id).first()
    consultant = db.query(User).filter(User.username == report.assigned_to).first()
    
    return {
        "id": report.id,
        "date": str(report.date),
        "diagnosis": report.diagnosis,
        "confidence": report.confidence,
        "status": report.status,
        "image_url": report.image_url,
        "notes": report.notes,
        "sample_type": report.sample_type,
        "sample_date": report.sample_date,
        "detections": json.loads(report.detections) if report.detections else [],
        "patient": {
            "name": patient.name if patient else "Unknown",
            "mrn": patient.mrn if patient else "N/A",
            "nhs_number": patient.nhs_number if patient else "N/A"
        },
        "consultant": {
            "name": consultant.full_name if consultant else report.assigned_to,
            "role": consultant.role if consultant else "Clinician"
        }
    }

@app.put("/reports/{report_id}/status")
def update_report_status(report_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    """Authorize or Reject a report"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = update.status
    if update.notes:
        report.notes = (report.notes or "") + f"\n[Update]: {update.notes}"
    
    db.commit()
    return {"message": "Status updated successfully", "new_status": report.status}

# --- RESEARCH ENDPOINTS ---

@app.post("/research/upload")
async def upload_research_sample(
    file: UploadFile = File(...),
    notes: str = Form(""),
    sample_type: str = Form("Unspecified"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = f"research_{uuid.uuid4()}.jpg"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_sample = ResearchSample(
        contributor_name=current_user.full_name,
        sample_type=sample_type,
        image_url=f"/uploads/{filename}",
        notes=notes
    )
    db.add(new_sample)
    db.commit()
    db.refresh(new_sample)
    return {"id": new_sample.id, "message": "Research sample stored in Supabase"}

@app.get("/research/samples")
def get_research_samples(db: Session = Depends(get_db)):
    return db.query(ResearchSample).order_by(ResearchSample.id.desc()).all()

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
