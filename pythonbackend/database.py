import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Try to get the Secret from Hugging Face
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Configure the engine
if DATABASE_URL:
    # Fix: SQLAlchemy needs 'postgresql://', but Supabase sometimes gives 'postgres://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Connect to Supabase (PostgreSQL)
    engine = create_engine(DATABASE_URL)
else:
    # Fallback: Use local SQLite if no secret is found (for local testing)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()