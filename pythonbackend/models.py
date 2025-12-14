# models.py
from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class PatientCreateFull(BaseModel):
    name: str
    dob: Optional[str] = None
    sex: Optional[str] = None
    mrn: Optional[str] = None
    nhs_number: Optional[str] = None
    clinician: Optional[str] = None
    stain: Optional[str] = None
    zoom: Optional[str] = None
    indication: Optional[str] = None
    ward: Optional[str] = None
    sample_date: Optional[str] = None

class PatientUpdateFull(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[str] = None
    mrn: Optional[str] = None
    nhs_number: Optional[str] = None
    clinician: Optional[str] = None
    stain: Optional[str] = None
    zoom: Optional[str] = None
    indication: Optional[str] = None
    ward: Optional[str] = None
    sample_date: Optional[str] = None

class SettingsUpdate(BaseModel):
    show_clinician: bool