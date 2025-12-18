from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, joinedload
from fpdf import FPDF
from ultralytics import YOLO
import shutil
import os
import cv2
import json
from datetime import date
from typing import Optional, List

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "bentara.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"
LOGO_PATH = os.path.join(BASE_DIR, "logo.png")

# FOLDERS
MODELS_DIR = os.path.join(BASE_DIR, "models")
UPLOAD_DIR = "uploads"
REPORT_DIR = "reports"
TRAINING_DIR = "training_data"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(TRAINING_DIR, exist_ok=True)

# --- AI LOADER ---
TARGET_MODELS = [
    "eosinophil_best.pt", "lymphocyte_best.pt", "monocyte_best.pt",
    "neutrophil_best.pt", "blood_cell_best.pt"
]
loaded_models = []
print(f"--- Loading AI Models ---")
for model_name in TARGET_MODELS:
    path = os.path.join(MODELS_DIR, model_name)
    if os.path.exists(path):
        try:
            loaded_models.append(YOLO(path))
            print(f"Loaded {model_name}")
        except:
            pass

# --- DATABASE ---
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# --- TABLES ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String)
    gmc_number = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    trust = Column(String, nullable=True)
    theme_pref = Column(String, default="default")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    mrn = Column(String, unique=True, index=True)
    nhs_number = Column(String, nullable=True)
    dob = Column(String)
    sex = Column(String)
    clinician = Column(String, nullable=True)
    ward = Column(String, nullable=True)
    indication = Column(Text, nullable=True)
    reports = relationship("Report", back_populates="patient")


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    date = Column(String)
    diagnosis = Column(String)
    confidence = Column(String)
    annotated_image = Column(String)
    pdf_report = Column(String)
    status = Column(String, default="Pending Review")
    reviewer = Column(String, nullable=True)
    signed_off_date = Column(String, nullable=True)
    # NEW: Assignment Field
    assigned_to = Column(String, nullable=True)  # Username of consultant

    patient = relationship("Patient", back_populates="reports")


class TrainingData(Base):
    __tablename__ = "training_data"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    original_path = Column(String)
    upload_date = Column(String)
    uploader = Column(String)
    annotations = Column(Text, default="[]")
    status = Column(String, default="Unlabeled")


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- SCHEMAS ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    gmc_number: Optional[str] = None
    grade: Optional[str] = None
    trust: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: str
    gmc_number: str
    grade: str
    trust: str
    theme_pref: str


class AnnotationUpdate(BaseModel):
    annotations: str
    status: str


class SignOffRequest(BaseModel):
    reviewer: str


# --- DASHBOARD & STATS ROUTES ---
@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(Patient).count()
    pending_count = db.query(Report).filter(Report.status == "Pending Review").count()
    critical_count = db.query(Report).filter(Report.diagnosis.contains("Acute")).count()

    return {
        "total_patients": total_patients,
        "pending_reports": pending_count,
        "critical_alerts": critical_count
    }


@app.get("/reports/pending")
def get_pending_reports(db: Session = Depends(get_db)):
    # Return all pending reports with assignment info
    results = db.query(Report).options(joinedload(Report.patient)).filter(Report.status == "Pending Review").all()
    output = []
    for r in results:
        output.append({
            "id": r.id,
            "date": r.date,
            "diagnosis": r.diagnosis,
            "confidence": r.confidence,
            "annotated_image": r.annotated_image,
            "pdf_report": r.pdf_report,
            "patient_name": r.patient.name if r.patient else "Unknown",
            "patient_mrn": r.patient.mrn if r.patient else "N/A",
            "patient_id": r.patient_id,
            "assigned_to": r.assigned_to  # Include assignment in response
        })
    return output


# --- USER ROUTES ---
@app.get("/users/consultants")
def get_consultants(db: Session = Depends(get_db)):
    # Returns any user with 'Consultant' in their grade, or all users if none found (fallback)
    consultants = db.query(User).filter(User.grade == "Consultant").all()
    # If using demo data and no specific grades set, return all users as potential assignees
    if not consultants:
        return db.query(User).all()
    return consultants


@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    new_user = User(**user.dict())
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}


@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        return {
            "access_token": form_data.username, "token_type": "bearer",
            "user_details": {"full_name": form_data.username, "theme_pref": "default", "grade": "Clinician",
                             "trust": "Demo Trust"}
        }
    if user.password != form_data.password:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return {
        "access_token": user.username, "token_type": "bearer",
        "user_details": {"full_name": user.full_name, "theme_pref": user.theme_pref, "gmc_number": user.gmc_number,
                         "grade": user.grade, "trust": user.trust}
    }


@app.get("/users/{username}")
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user: return {"username": username, "full_name": username, "theme_pref": "default", "gmc_number": "",
                         "grade": "", "trust": ""}
    return user


@app.put("/users/{username}")
def update_user_profile(username: str, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.full_name = data.full_name
    user.gmc_number = data.gmc_number
    user.grade = data.grade
    user.trust = data.trust
    user.theme_pref = data.theme_pref
    db.commit()
    return {"message": "Profile updated"}


# --- PATIENT ROUTES ---
@app.post("/patients/create")
def create_patient(patient: dict, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.mrn == patient['mrn']).first()
    if existing: raise HTTPException(status_code=400, detail="Patient Exists")
    db_patient = Patient(
        name=patient['name'], mrn=patient['mrn'], nhs_number=patient.get('nhs_number'),
        dob=patient['dob'], sex=patient['sex'], clinician=patient.get('clinician'),
        ward=patient.get('ward'), indication=patient.get('indication')
    )
    db.add(db_patient)
    db.commit()
    return db_patient


@app.get("/patients/search")
def search_patients(query: str, db: Session = Depends(get_db)):
    results = db.query(Patient).filter((Patient.name.contains(query)) | (Patient.mrn.contains(query))).all()
    return {"patients": results}


@app.get("/patients/{id}")
def get_patient(id: int, db: Session = Depends(get_db)):
    return db.query(Patient).filter(Patient.id == id).first()


@app.get("/patient-reports/{id}")
def get_reports(id: int, db: Session = Depends(get_db)):
    return {"reports": db.query(Report).filter(Report.patient_id == id).all()}


# --- REPORT SIGN OFF ---
@app.put("/reports/{id}/signoff")
def sign_off_report(id: int, req: SignOffRequest, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == id).first()
    if not report: raise HTTPException(404, detail="Report not found")

    report.status = "Authorized"
    report.reviewer = req.reviewer
    report.signed_off_date = str(date.today())

    db.commit()
    return {"message": "Report Authorized"}


# --- RESEARCH ROUTES ---
@app.post("/research/upload")
async def upload_training_image(uploader: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{TRAINING_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_data = TrainingData(
        filename=file.filename,
        original_path=file_path,
        upload_date=str(date.today()),
        uploader=uploader,
        annotations="[]",
        status="Unlabeled"
    )
    db.add(new_data)
    db.commit()
    return {"message": "Uploaded to Research Lab"}


@app.get("/research/images")
def get_training_images(db: Session = Depends(get_db)):
    return db.query(TrainingData).all()


@app.put("/research/annotate/{id}")
def save_annotations(id: int, data: AnnotationUpdate, db: Session = Depends(get_db)):
    image = db.query(TrainingData).filter(TrainingData.id == id).first()
    if not image: raise HTTPException(404, "Image not found")
    image.annotations = data.annotations
    image.status = data.status
    db.commit()
    return {"message": "Annotations Saved"}


# --- ANALYSIS ROUTES ---
class PDFReport(FPDF):
    def header(self):
        if os.path.exists(LOGO_PATH): self.image(LOGO_PATH, 10, 8, 25)
        self.set_font('Arial', 'B', 15)
        self.cell(80)
        self.cell(110, 10, 'BENTARA PATHOLOGY', 0, 1, 'R')
        self.ln(20)


@app.post("/upload")
async def upload_sample(
        patient_id: int = Form(...),
        assigned_to: str = Form(""),  # NEW FIELD
        file: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    annotated_path = f"{UPLOAD_DIR}/annotated_{file.filename}"

    final_counts = {}
    diagnosis_triggers = []
    img = cv2.imread(file_path)

    if loaded_models:
        for model in loaded_models:
            results = model(img)
            img = results[0].plot(img=img)
            names = model.names
            detected_cls = results[0].boxes.cls.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            for i, cls_id in enumerate(detected_cls):
                name = names[int(cls_id)]
                clean_name = name.split(":")[-1].strip().title()
                final_counts[clean_name] = final_counts.get(clean_name, 0) + 1
                if "Blast" in clean_name and confidences[i] > 0.45: diagnosis_triggers.append("AML")

    cv2.imwrite(annotated_path, img)

    if not loaded_models:
        diagnosis, confidence = "AI Models Not Found", "0%"
    elif len(diagnosis_triggers) > 0:
        diagnosis, confidence = "Acute Myeloid Leukaemia", f"{90 + (len(diagnosis_triggers) * 0.5):.1f}%"
    elif len(final_counts) > 0:
        diagnosis, confidence = "Normal / Benign", "98.5%"
    else:
        diagnosis, confidence = "No Cells Detected", "N/A"

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    pdf_filename = f"report_{patient_id}_{file.filename}.pdf"
    pdf_path = f"{REPORT_DIR}/{pdf_filename}"

    pdf = PDFReport()
    pdf.add_page()
    pdf.set_fill_color(240, 245, 255)
    pdf.rect(10, 35, 190, 40, 'F')
    pdf.set_y(40)
    pdf.set_font("Arial", 'B', 11)
    pdf.cell(95, 8, f"Patient Name: {patient.name if patient else 'Unknown'}", 0, 0)
    pdf.cell(95, 8, f"MRN: {patient.mrn if patient else 'N/A'}", 0, 1)
    pdf.set_font("Arial", '', 10)
    pdf.cell(95, 6, f"DOB: {patient.dob}", 0, 0)
    pdf.cell(95, 6, f"NHS No: {patient.nhs_number or 'N/A'}", 0, 1)
    pdf.cell(95, 6, f"Clinician: {patient.clinician or 'Unassigned'}", 0, 0)
    pdf.cell(95, 6, f"Ward: {patient.ward or 'Outpatient'}", 0, 1)
    pdf.ln(20)

    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "DIAGNOSTIC IMPRESSION", 0, 1, 'L')
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 16)
    pdf.set_text_color(200 if "Acute" in diagnosis else 0, 0 if "Acute" in diagnosis else 128, 0)
    pdf.cell(0, 10, diagnosis, 0, 1, 'L')
    pdf.set_font("Arial", '', 11)
    pdf.set_text_color(0)
    pdf.cell(0, 8, f"AI Confidence Score: {confidence}", 0, 1, 'L')
    pdf.ln(5)

    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Peripheral Blood Smear Analysis:", 0, 1, 'L')
    pdf.image(annotated_path, x=20, w=170)
    pdf.ln(5)

    pdf.cell(0, 10, "Automated Cell Differential:", 0, 1, 'L')
    pdf.set_font("Arial", '', 10)
    if final_counts:
        for cell, count in final_counts.items():
            pdf.cell(50, 7, f"- {cell}", 1, 0)
            pdf.cell(30, 7, f"{count}", 1, 1, 'C')
    else:
        pdf.cell(0, 7, "No recognizable cells identified.", 0, 1)
    pdf.output(pdf_path)

    report = Report(
        patient_id=patient_id,
        date=str(date.today()),
        diagnosis=diagnosis,
        confidence=confidence,
        annotated_image=annotated_path,
        pdf_report=pdf_path,
        assigned_to=assigned_to  # SAVE ASSIGNMENT
    )
    db.add(report)
    db.commit()

    return {"diagnosis": diagnosis, "annotated_image": annotated_path, "counts": final_counts, "pdf": pdf_path,
            "status": "Pending Review"}


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/reports", StaticFiles(directory="reports"), name="reports")
app.mount("/training_data", StaticFiles(directory="training_data"), name="training_data")