"""
Unit tests for authentication endpoints
"""
import pytest
from fastapi import status


def test_register_user_success(client, db):
    """Test successful user registration"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "password123",
            "full_name": "New User",
            "role": "doctor"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "doctor"
    assert "id" in data
    assert "hashed_password" not in data  # Password should not be returned


def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email fails"""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",  # Already exists
            "password": "password123",
            "full_name": "Duplicate User",
            "role": "doctor"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_login_invalid_email(client):
    """Test login with non-existent email fails"""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "password123"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect" in response.json()["detail"].lower()


def test_login_invalid_password(client, test_user):
    """Test login with wrong password fails"""
    response = client.post(
        "/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "incorrect" in response.json()["detail"].lower()


def test_login_missing_fields(client):
    """Test login with missing fields fails"""
    response = client.post(
        "/auth/login",
        json={"email": "test@example.com"}  # Missing password
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_register_missing_fields(client):
    """Test registration with missing fields fails"""
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com"}  # Missing other fields
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

