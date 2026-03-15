from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mednotes")

# Clean up DATABASE_URL for Neon compatibility in serverless environments
if DATABASE_URL and "postgresql://" in DATABASE_URL:
    # Some environments have issues with channel_binding=require
    if "channel_binding=require" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
    
    # Ensure it starts with postgresql:// not postgres://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Test connections before using them
    connect_args={"sslmode": "require"} if "neon.tech" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
