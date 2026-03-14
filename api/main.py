import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.db.database import engine, Base
from api.routes import auth, patients, notes, ai, appointments, tasks
from api.services.cloud_tasks_service import ensure_queue_exists

# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Ensure Cloud Tasks queue exists (skip in local dev via SKIP_CLOUD_TASKS=true)
    if os.getenv("SKIP_CLOUD_TASKS", "false").lower() != "true":
        try:
            ensure_queue_exists()
        except Exception as e:
            print(f"Warning: Could not ensure Cloud Tasks queue exists: {e}")
    yield

app = FastAPI(
    title="Secure Medical Notes API",
    description="A secure, AI-powered clinical documentation platform for healthcare teams",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(appointments.router)
app.include_router(tasks.router)

@app.get("/")
def healthcheck():
    return {"status": "ok", "message": "Secure Medical Notes API is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}
