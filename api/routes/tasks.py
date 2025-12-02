"""
Task endpoints for Cloud Tasks to call.
These replace Celery tasks.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from api.db.database import get_db
from api.models.note import Note
from api.models.patient import Patient
from api.agents.summarization_agent import SummarizationAgent
from api.agents.risk_agent import RiskAssessmentAgent

router = APIRouter(prefix="/ai/tasks", tags=["background-tasks"])

class SummarizeTaskRequest(BaseModel):
    note_id: int

class RiskAssessmentTaskRequest(BaseModel):
    patient_id: int

@router.post("/summarize")
async def process_summarization_task(
    request: SummarizeTaskRequest,
    db: Session = Depends(get_db)
):
    """
    Process a note summarization task.
    Called by Cloud Tasks.
    """
    note = db.query(Note).filter(Note.id == request.note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    try:
        # Get patient for context
        patient = db.query(Patient).filter(Patient.id == note.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Perform AI summarization using agent
        agent = SummarizationAgent()
        result = agent.process_note(note, patient, db)
        
        # Results are already saved in process_note, just commit
        db.commit()
        
        return {
            "status": "success",
            "note_id": note.id,
            "summary": note.summary,
            "risk_level": note.risk_level
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/risk-assessment")
async def process_risk_assessment_task(
    request: RiskAssessmentTaskRequest,
    db: Session = Depends(get_db)
):
    """
    Process a patient risk assessment task.
    Called by Cloud Tasks.
    """
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        # Perform risk assessment using agent
        agent = RiskAssessmentAgent()
        risk_report = agent.generate_patient_risk_report(patient.id, db)
        
        if "error" in risk_report:
            raise HTTPException(status_code=404, detail=risk_report["error"])
        
        return {
            "status": "success",
            "patient_id": patient.id,
            "risk_level": risk_report.get("risk_level"),
            "risk_factors": risk_report.get("risk_factors", []),
            "recommendations": risk_report.get("recommendations", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
