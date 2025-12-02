"""
Summarization Agent for medical notes using LangChain
"""
from typing import Dict, List, Optional
from api.services.ai_service import MedicalAIService
from api.models.note import Note
from api.models.patient import Patient
from sqlalchemy.orm import Session

class SummarizationAgent:
    def __init__(self):
        self.ai_service = MedicalAIService()
    
    def process_note(self, note: Note, patient: Patient, db: Session) -> Dict[str, str]:
        """
        Process a note and generate AI-powered summary and analysis
        """
        try:
            # Get patient context
            patient_context = self._build_patient_context(patient, db)
            
            # Generate summary
            if hasattr(self.ai_service, "summarize_note"):
                summary_result = self.ai_service.summarize_note(
                    note_content=note.content,
                    note_type=note.note_type.value,
                    patient_context=patient_context
                )
            else:
                # Defensive fallback for older AI service implementations
                summary_result = self.ai_service.summarize_medical_note(
                    note_content=note.content,
                    note_type=note.note_type.value,
                    patient_history=None
                )
            
            # Assess risk
            patient_history = self._get_patient_history(patient.id, db)
            if hasattr(self.ai_service, "assess_risk"):
                risk_result = self.ai_service.assess_risk(
                    note_content=note.content,
                    patient_history=patient_history
                )
            else:
                risk_result = self.ai_service.assess_patient_risk(
                    note_content=note.content,
                    patient_history=patient_history
                )
            
            # Generate nurse recommendations if it's a nurse note
            nurse_recommendations = {}
            if note.note_type.value == "nurse_note":
                if hasattr(self.ai_service, "generate_nurse_recommendations"):
                    nurse_recommendations = self.ai_service.generate_nurse_recommendations(
                        note_content=note.content,
                        patient_context=patient_context
                    )
                else:
                    nurse_recommendations = {}
            
            # Update note with AI results
            note.summary = summary_result["summary"]
            note.risk_level = _normalize_risk_level(risk_result.get("risk_level"))
            
            # Combine recommendations
            all_recommendations = []
            if summary_result.get("recommendations"):
                all_recommendations.append(f"Clinical: {summary_result['recommendations']}")
            if risk_result.get("recommendations"):
                all_recommendations.append(f"Risk Management: {risk_result['recommendations']}")
            if nurse_recommendations.get("nursing_actions"):
                all_recommendations.append(f"Nursing: {nurse_recommendations['nursing_actions']}")
            
            note.recommendations = "\n\n".join(all_recommendations) if all_recommendations else None
            
            # Create tags from key findings
            tags = self._extract_tags(summary_result, risk_result)
            note.tags = ",".join(tags) if tags else None
            
            db.commit()
            
            return {
                "success": True,
                "summary": summary_result["summary"],
                "risk_level": risk_result["risk_level"],
                "recommendations": note.recommendations,
                "tags": tags,
                "nurse_recommendations": nurse_recommendations
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "summary": None,
                "risk_level": "UNKNOWN",
                "recommendations": None,
                "tags": [],
                "nurse_recommendations": {}
            }
    
    def _build_patient_context(self, patient: Patient, db: Session) -> str:
        """Build comprehensive patient context"""
        context_parts = [
            f"Patient: {patient.first_name} {patient.last_name}",
            f"DOB: {patient.date_of_birth}",
            f"MRN: {patient.medical_record_number}"
        ]
        
        if patient.allergies:
            context_parts.append(f"Allergies: {patient.allergies}")
        
        if patient.medical_history:
            context_parts.append(f"Medical History: {patient.medical_history}")
        
        return "\n".join(context_parts)
    
    def _get_patient_history(self, patient_id: int, db: Session) -> List[str]:
        """Get recent patient history for context"""
        recent_notes = db.query(Note).filter(
            Note.patient_id == patient_id
        ).order_by(Note.created_at.desc()).limit(5).all()
        
        return [f"{note.title}: {note.content[:200]}..." for note in recent_notes]
    
    def _extract_tags(self, summary_result: Dict, risk_result: Dict) -> List[str]:
        """Extract relevant tags from AI analysis"""
        tags = []
        
        # Extract from summary
        if summary_result.get("key_findings"):
            # Simple keyword extraction (in production, use more sophisticated NLP)
            keywords = ["hypertension", "diabetes", "infection", "pain", "fever", "cough", "shortness of breath"]
            for keyword in keywords:
                if keyword.lower() in summary_result["key_findings"].lower():
                    tags.append(keyword.title())
        
        # Add risk level as tag
        if risk_result.get("risk_level"):
            tags.append(f"Risk-{risk_result['risk_level']}")
        
        return list(set(tags))  # Remove duplicates
def _normalize_risk_level(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    lowered = value.lower()
    if lowered in {"high", "medium", "low"}:
        return lowered
    return lowered
