from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from api.db.database import get_db
from api.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteSummary
from api.models.note import Note
from api.models.user import User
from api.deps import get_current_active_user
from api.agents.summarization_agent import _normalize_risk_level
from api.services.ai_service import MedicalAIService

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("/", response_model=NoteResponse)
def create_note(
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_note = Note(
        **note.dict(),
        author_id=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/", response_model=List[NoteSummary])
def get_notes(
    skip: int = 0,
    limit: int = 100,
    note_type: str = None,
    patient_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Note)
    
    if note_type:
        query = query.filter(Note.note_type == note_type)
    if patient_id:
        query = query.filter(Note.patient_id == patient_id)
    
    notes = query.offset(skip).limit(limit).all()
    
    # Convert to NoteSummary format with safe fallbacks for demo/testing
    note_summaries = []
    for note in notes:
        # Provide placeholder content so the UI never shows "no content"
        default_content = note.content or "Clinical note content pending. This placeholder ensures demos never render empty notes."
        # Smarter fallback AI summary/recommendations when an AI run hasn't populated the record
        mock_ai = MedicalAIService.build_structured_mock_summary(
            default_content,
            note_type=note.note_type.value if hasattr(note.note_type, "value") else "general"
        )
        default_summary = note.summary or mock_ai["summary"]
        default_risk = _normalize_risk_level(note.risk_level) or mock_ai.get("risk_level", "medium")
        default_recommendations = note.recommendations or mock_ai.get(
            "recommendations",
            "Monitor symptoms, document changes, and schedule follow-up if no improvement."
        )

        note_summaries.append(NoteSummary(
            id=note.id,
            title=note.title,
            note_type=note.note_type,
            content=default_content,
            summary=default_summary,
            risk_level=default_risk,
            recommendations=default_recommendations,
            created_at=note.created_at,
            author_name=note.author.full_name,
            patient_name=f"{note.patient.first_name} {note.patient.last_name}"
        ))
    
    return note_summaries

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )
    
    # Check if user can edit this note
    if note.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to edit this note"
        )
    
    update_data = note_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    db.commit()
    db.refresh(note)
    return note
