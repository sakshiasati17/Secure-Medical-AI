"""
Unit tests for notes endpoints
"""
import pytest
from fastapi import status


def test_get_notes_requires_auth(client):
    """Test that getting notes requires authentication"""
    response = client.get("/notes/")
    # Without auth, should get 401 or 403
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_create_note_success(client, auth_headers, test_patient, test_user):
    """Test successful note creation"""
    response = client.post(
        "/notes/",
        headers=auth_headers,
        json={
            "patient_id": test_patient.id,
            "title": "Test Note",
            "content": "This is a test clinical note",
            "note_type": "doctor_note"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Note"
    assert data["content"] == "This is a test clinical note"
    assert data["patient_id"] == test_patient.id
    assert "id" in data
    assert "created_at" in data


def test_get_notes_success(client, auth_headers, test_patient, test_user):
    """Test successful retrieval of notes"""
    # First create a note
    client.post(
        "/notes/",
        headers=auth_headers,
        json={
            "patient_id": test_patient.id,
            "title": "Test Note",
            "content": "Test content",
            "note_type": "doctor_note"
        }
    )
    
    # Then retrieve notes
    response = client.get("/notes/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_note_by_id(client, auth_headers, test_patient, test_user):
    """Test getting a specific note by ID"""
    # Create a note first
    create_response = client.post(
        "/notes/",
        headers=auth_headers,
        json={
            "patient_id": test_patient.id,
            "title": "Specific Note",
            "content": "Specific content",
            "note_type": "doctor_note"
        }
    )
    note_id = create_response.json()["id"]
    
    # Get the note
    response = client.get(f"/notes/{note_id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == note_id
    assert data["title"] == "Specific Note"


def test_get_note_not_found(client, auth_headers):
    """Test getting non-existent note returns 404"""
    response = client.get("/notes/99999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_note_requires_auth(client, test_patient):
    """Test that creating note requires authentication"""
    response = client.post(
        "/notes/",
        json={
            "patient_id": test_patient.id,
            "title": "Test",
            "content": "Test content",
            "note_type": "doctor_note"
        }
    )
    # Without auth, should get 401 or 403
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_update_note_success(client, auth_headers, test_patient, test_user):
    """Test successful note update"""
    # Create a note first
    create_response = client.post(
        "/notes/",
        headers=auth_headers,
        json={
            "patient_id": test_patient.id,
            "title": "Original Title",
            "content": "Original content",
            "note_type": "doctor_note"
        }
    )
    note_id = create_response.json()["id"]
    
    # Update the note
    response = client.put(
        f"/notes/{note_id}",
        headers=auth_headers,
        json={
            "title": "Updated Title",
            "content": "Updated content"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["content"] == "Updated content"

