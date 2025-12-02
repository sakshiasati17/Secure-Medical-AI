"""
Integration tests for end-to-end workflows
"""
import pytest
from fastapi import status


def test_complete_user_workflow(client, db):
    """Test complete workflow: register -> login -> create patient -> create note"""
    import random
    # 1. Register a new user
    workflow_email = f"workflow_{random.randint(10000, 99999)}@test.com"
    register_response = client.post(
        "/auth/register",
        json={
            "email": workflow_email,
            "password": "workflow123",
            "full_name": "Workflow User",
            "role": "doctor"
        }
    )
    assert register_response.status_code == status.HTTP_200_OK
    user_data = register_response.json()
    assert user_data["email"] == workflow_email
    
    # 2. Login with the new user
    login_response = client.post(
        "/auth/login",
        json={
            "email": workflow_email,
            "password": "workflow123"
        }
    )
    assert login_response.status_code == status.HTTP_200_OK
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Set user in client for dependency override
    from api.models.user import User
    user = db.query(User).filter(User.email == workflow_email).first()
    client._set_user(user)
    
    # 3. Create a patient
    patient_id_str = f"MRN-WORKFLOW-{random.randint(10000, 99999)}"
    patient_response = client.post(
        "/patients/",
        headers=headers,
        json={
            "first_name": "Workflow",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01",
            "patient_id": patient_id_str,
            "medical_record_number": patient_id_str,
            "allergies": "None",
            "medical_history": "None"
        }
    )
    assert patient_response.status_code == status.HTTP_200_OK
    patient_data = patient_response.json()
    patient_id = patient_data["id"]
    
    # 4. Create a note for the patient
    note_response = client.post(
        "/notes/",
        headers=headers,
        json={
            "patient_id": patient_id,
            "title": "Workflow Note",
            "content": "This note was created as part of integration testing",
            "note_type": "doctor_note"
        }
    )
    assert note_response.status_code == status.HTTP_200_OK
    note_data = note_response.json()
    assert note_data["patient_id"] == patient_id
    assert note_data["title"] == "Workflow Note"
    
    # 5. Retrieve the note
    get_note_response = client.get(f"/notes/{note_data['id']}", headers=headers)
    assert get_note_response.status_code == status.HTTP_200_OK
    retrieved_note = get_note_response.json()
    assert retrieved_note["id"] == note_data["id"]
    assert retrieved_note["content"] == "This note was created as part of integration testing"


def test_doctor_nurse_role_workflow(client, db):
    """Test workflow with different user roles"""
    import random
    # Create doctor
    doctor_email = f"doctor_{random.randint(10000, 99999)}@workflow.com"
    doctor_register = client.post(
        "/auth/register",
        json={
            "email": doctor_email,
            "password": "doctor123",
            "full_name": "Dr. Workflow",
            "role": "doctor"
        }
    )
    assert doctor_register.status_code == status.HTTP_200_OK
    
    # Create nurse
    nurse_email = f"nurse_{random.randint(10000, 99999)}@workflow.com"
    nurse_register = client.post(
        "/auth/register",
        json={
            "email": nurse_email,
            "password": "nurse123",
            "full_name": "Nurse Workflow",
            "role": "nurse"
        }
    )
    assert nurse_register.status_code == status.HTTP_200_OK
    
    # Login as doctor
    doctor_login = client.post(
        "/auth/login",
        json={"email": doctor_email, "password": "doctor123"}
    )
    assert doctor_login.status_code == status.HTTP_200_OK
    doctor_token = doctor_login.json()["access_token"]
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
    
    # Set doctor user in client
    from api.models.user import User
    doctor_user = db.query(User).filter(User.email == doctor_email).first()
    client._set_user(doctor_user)
    
    # Login as nurse
    nurse_login = client.post(
        "/auth/login",
        json={"email": nurse_email, "password": "nurse123"}
    )
    assert nurse_login.status_code == status.HTTP_200_OK
    nurse_token = nurse_login.json()["access_token"]
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    
    # Both should be able to access patients
    doctor_patients = client.get("/patients/", headers=doctor_headers)
    assert doctor_patients.status_code == status.HTTP_200_OK
    
    # Set nurse user in client
    nurse_user = db.query(User).filter(User.email == nurse_email).first()
    client._set_user(nurse_user)
    nurse_patients = client.get("/patients/", headers=nurse_headers)
    assert nurse_patients.status_code == status.HTTP_200_OK


def test_authentication_token_expiry(client, test_user, auth_headers):
    """Test that authentication is required for protected endpoints"""
    # Clear any user override first to test without auth
    client._set_user(None)
    
    # Try to access protected endpoint without auth (should fail)
    response = client.get("/patients/")
    # Should return 401 or 403 when no user is set
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    
    # Now set user and should be able to access with auth
    client._set_user(test_user)
    response = client.get("/patients/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK


def test_api_health_check(client):
    """Test that health check endpoint works without authentication"""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"

