"""
Unit tests for patient endpoints
"""
import pytest
from fastapi import status


def test_get_patients_requires_auth(client):
    """Test that getting patients requires authentication"""
    response = client.get("/patients/")
    # Without auth, should get 401 or 403
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_get_patients_success(client, auth_headers, test_patient):
    """Test successful retrieval of patients"""
    response = client.get("/patients/", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["first_name"] == "John"
    assert data[0]["last_name"] == "Doe"


def test_get_patient_by_id(client, auth_headers, test_patient):
    """Test getting a specific patient by ID"""
    response = client.get(f"/patients/{test_patient.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_patient.id
    assert data["first_name"] == "John"
    assert data["medical_record_number"] == "MRN-TEST-001"


def test_get_patient_not_found(client, auth_headers):
    """Test getting non-existent patient returns 404"""
    response = client.get("/patients/99999", headers=auth_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_patient_success(client, auth_headers):
    """Test successful patient creation"""
    import random
    patient_id = f"MRN-TEST-{random.randint(10000, 99999)}"
    response = client.post(
        "/patients/",
        headers=auth_headers,
        json={
            "first_name": "Jane",
            "last_name": "Smith",
            "date_of_birth": "1985-05-15",
            "patient_id": patient_id,
            "medical_record_number": patient_id,
            "allergies": "Penicillin",
            "medical_history": "Diabetes"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Smith"
    assert data["medical_record_number"] == patient_id
    assert "id" in data


def test_create_patient_requires_auth(client):
    """Test that creating patient requires authentication"""
    response = client.post(
        "/patients/",
        json={
            "first_name": "Test",
            "last_name": "Patient",
            "patient_id": "MRN-TEST-003",
            "medical_record_number": "MRN-TEST-003",
            "date_of_birth": "1990-01-01"
        }
    )
    # Without auth, should get 401 or 403
    assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


def test_update_patient_success(client, auth_headers, test_patient):
    """Test successful patient update"""
    response = client.put(
        f"/patients/{test_patient.id}",
        headers=auth_headers,
        json={
            "first_name": "John",
            "last_name": "Updated",
            "allergies": "Updated allergies"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["last_name"] == "Updated"
    assert data["allergies"] == "Updated allergies"

