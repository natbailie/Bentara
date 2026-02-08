import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- DEBUG LOGGING ---
def log(msg):
    print(f"\n[DATABASE SETUP] {msg}\n", flush=True)

# 1. Get the Secret
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    log("✅ Found DATABASE_URL environment variable.")
    
    # Fix: SQLAlchemy needs 'postgresql://', Supabase gives 'postgres://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # TEST THE CONNECTION IMMEDIATELY
        with engine.connect() as connection:
            log("🚀 CONNECTION SUCCESSFUL! Connected to Supabase PostgreSQL.")
            
    except Exception as e:
        log(f"❌ CONNECTION FAILED! Error details: {e}")
        log("⚠️  Falling back to TEMPORARY SQLite. DATA WILL BE LOST ON RESTART.")
        
        # Fallback to SQLite so the app doesn't crash, but data is not safe
        SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
        )
else:
    log("⚠️  DATABASE_URL secret is MISSING or None.")
    log("⚠️  Falling back to TEMPORARY SQLite. DATA WILL BE LOST ON RESTART.")
    
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
