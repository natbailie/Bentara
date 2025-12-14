# database.py
import sqlite3
from pathlib import Path

DB_PATH = Path("reports.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()

    # Users
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    # Settings
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            show_clinician INTEGER DEFAULT 1
        )
    """)
    cur.execute("INSERT OR IGNORE INTO settings (id, show_clinician) VALUES (1, 1)")

    # Patients - extended fields (Option C)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dob TEXT,
            sex TEXT,
            mrn TEXT,
            nhs_number TEXT,
            clinician TEXT,
            stain TEXT,
            zoom TEXT,
            indication TEXT,
            ward TEXT,
            sample_date TEXT
        )
    """)

    # Reports
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            report_date TEXT NOT NULL,
            pdf_path TEXT NOT NULL,
            annotated_image_path TEXT NOT NULL,
            eosinophils INTEGER,
            neutrophils INTEGER,
            lymphocytes INTEGER,
            monocytes INTEGER,
            rbcs INTEGER,
            wbcs INTEGER,
            diagnosis TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    """)

    conn.commit()
    conn.close()