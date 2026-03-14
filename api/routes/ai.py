from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import asyncio
import os

from api.db.database import get_db
from api.models.user import User
from api.models.patient import Patient
from api.models.note import Note
from api.deps import get_current_active_user
from api.agents.summarization_agent import SummarizationAgent
from api.agents.risk_agent import RiskAssessmentAgent
from api.services.cloud_tasks_service import create_ai_summarization_task, create_risk_assessment_task
from api.services.ai_service import MedicalAIService

router = APIRouter(prefix="/ai", tags=["ai"])

# Initialize agents
summarization_agent = SummarizationAgent()
risk_agent = RiskAssessmentAgent()
ai_service = MedicalAIService()

@router.post("/summarize/{note_id}")
async def summarize_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        # Get note
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        # If Cloud Tasks are disabled, run synchronously for the demo
        if os.getenv("SKIP_CLOUD_TASKS") == "true":
            patient = db.query(Patient).filter(Patient.id == note.patient_id).first()
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")
            
            result = summarization_agent.process_note(note, patient, db)
            return {
                "message": "Note summarized synchronously (Cloud Tasks skipped)",
                "note_id": note_id,
                "status": "completed",
                "summary": result.get("summary")
            }

        # Create background task for AI processing (GCP mode)
        task_name = create_ai_summarization_task(note_id)
        
        return {
            "message": "Note summarization task queued",
            "note_id": note_id,
            "task_id": task_name,
            "status": "processing"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing AI task: {str(e)}")

@router.post("/summarize/{note_id}/sync")
async def summarize_note_sync(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate AI summary for a specific note (synchronous)"""
    try:
        # Get note and patient
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        patient = db.query(Patient).filter(Patient.id == note.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Process note with AI
        result = summarization_agent.process_note(note, patient, db)
        
        if result["success"]:
            return {
                "message": "Note summarized successfully",
                "summary": result["summary"],
                "risk_level": result["risk_level"],
                "recommendations": result["recommendations"],
                "tags": result["tags"]
            }
        else:
            raise HTTPException(status_code=500, detail=f"AI processing failed: {result['error']}")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing note: {str(e)}")

@router.get("/risk-report/{patient_id}")
async def get_patient_risk_report(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive risk report for a patient"""
    try:
        risk_report = risk_agent.generate_patient_risk_report(patient_id, db)
        
        if "error" in risk_report:
            raise HTTPException(status_code=404, detail=risk_report["error"])
        
        return risk_report
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating risk report: {str(e)}")

@router.get("/high-risk-patients")
async def get_high_risk_patients(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of high-risk patients"""
    try:
        high_risk_patients = risk_agent.get_high_risk_patients(db, limit)
        return {
            "high_risk_patients": high_risk_patients,
            "count": len(high_risk_patients)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching high-risk patients: {str(e)}")

@router.post("/batch-summarize")
async def batch_summarize_notes(
    request_data: Dict[str, List[int]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Batch process multiple notes for AI summarization"""
    try:
        note_ids = request_data.get("note_ids", [])
        results = []
        
        for note_id in note_ids:
            note = db.query(Note).filter(Note.id == note_id).first()
            if note:
                patient = db.query(Patient).filter(Patient.id == note.patient_id).first()
                if patient:
                    result = summarization_agent.process_note(note, patient, db)
                    results.append({
                        "note_id": note_id,
                        "success": result["success"],
                        "summary": result.get("summary"),
                        "risk_level": result.get("risk_level"),
                        "error": result.get("error")
                    })
        
        return {
            "message": f"Processed {len(results)} notes",
            "results": results
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch processing: {str(e)}")

@router.get("/ai-status")
async def get_ai_status():
    """Check AI service status and configuration"""
    try:
        # Test AI service availability
        return {
            "status": "operational" if ai_service.enabled else "disabled",
            "openai_configured": bool(ai_service.enabled and hasattr(ai_service, 'openai_api_key') and ai_service.openai_api_key),
            "models_available": ai_service.enabled,
            "vector_store_ready": ai_service.enabled and ai_service.vectorstore is not None
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "openai_configured": False,
            "models_available": False,
            "vector_store_ready": False
        }

@router.post("/patient-summary/{patient_id}")
async def get_patient_summary(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate a concise 3-4 line summary for a patient from recent notes.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Pull recent notes for context
    recent_notes = (
        db.query(Note)
        .filter(Note.patient_id == patient_id)
        .order_by(Note.created_at.desc())
        .limit(10)
        .all()
    )
    note_texts = [n.content or "" for n in recent_notes if n.content]

    summary_text = ai_service.generate_patient_summary(
        patient_name=f"{patient.first_name} {patient.last_name}",
        notes=note_texts
    )

    return {"patient_id": patient_id, "summary": summary_text}

@router.get("/patient-timeline/{patient_id}")
async def get_patient_timeline_with_ai(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive patient visit history with AI-generated timeline summary"""
    try:
        from api.services.ai_service import MedicalAIService
        
        # Fetch patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Fetch all notes ordered by date
        notes = db.query(Note).filter(
            Note.patient_id == patient_id
        ).order_by(Note.created_at.desc()).all()
        
        # Fetch all appointments
        appointments = db.query(Appointment).filter(
            Appointment.patient_id == patient_id
        ).order_by(Appointment.start_time.desc()).all()
        
        # Build timeline data
        timeline_items = []
        for note in notes:
            timeline_items.append({
                "type": "note",
                "id": note.id,
                "date": note.created_at.isoformat(),
                "title": note.title,
                "content": note.content,
                "summary": note.summary,
                "risk_level": note.risk_level,
                "author": note.author_name
            })
        
        for apt in appointments:
            timeline_items.append({
                "type": "appointment",
                "id": apt.id,
                "date": apt.start_time.isoformat(),
                "title": apt.title,
                "reason": apt.reason,
                "status": apt.status
            })
        
        # Sort by date
        timeline_items.sort(key=lambda x: x["date"], reverse=True)
        
        # Generate AI summary of patient journey
        ai_service = MedicalAIService()
        if ai_service.enabled:
            # Build context for AI
            patient_info = f"""
Patient: {patient.first_name} {patient.last_name}
DOB: {patient.date_of_birth}
MRN: {patient.medical_record_number}
Allergies: {patient.allergies or 'None'}
Medical History: {patient.medical_history or 'None'}

Total Visits: {len(notes)}
Total Appointments: {len(appointments)}
            """
            
            # Summarize recent notes
            recent_notes_summary = "\n\n".join([
                f"{note.created_at.strftime('%Y-%m-%d')}: {note.title}\n{note.content[:300]}..."
                for note in notes[:10]  # Last 10 notes
            ])
            
            prompt = f"""As a medical AI assistant, analyze this patient's complete medical timeline and provide:

1. **Patient Journey Summary**: A comprehensive overview of the patient's medical journey
2. **Key Medical Events**: Significant diagnoses, treatments, or changes in condition
3. **Risk Trends**: How the patient's risk level has changed over time
4. **Current Status**: Patient's current health status based on recent visits
5. **Recommendations**: Suggested follow-ups or areas requiring attention

{patient_info}

Recent Visit Summaries:
{recent_notes_summary}

Provide a structured, professional medical summary."""
            
            try:
                ai_summary = ai_service._call_openai(prompt, max_tokens=800)
            except Exception as e:
                ai_summary = f"AI summary unavailable: {str(e)}"
        else:
            ai_summary = "AI service not configured"
        
        # Calculate statistics
        risk_distribution = {}
        for note in notes:
            if note.risk_level:
                risk_distribution[note.risk_level] = risk_distribution.get(note.risk_level, 0) + 1
        
        return {
            "patient": {
                "id": patient.id,
                "name": f"{patient.first_name} {patient.last_name}",
                "mrn": patient.medical_record_number,
                "dob": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
                "allergies": patient.allergies,
                "medical_history": patient.medical_history
            },
            "timeline": timeline_items,
            "ai_summary": ai_summary,
            "statistics": {
                "total_visits": len(notes),
                "total_appointments": len(appointments),
                "risk_distribution": risk_distribution,
                "last_visit": notes[0].created_at.isoformat() if notes else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating patient timeline: {str(e)}")
