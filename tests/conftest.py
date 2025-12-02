"""
Pytest configuration and fixtures for testing
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import tempfile
from dotenv import load_dotenv

# Set test database URL before importing app
import tempfile
TEST_DB_FILE = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
TEST_DB_FILE.close()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE.name}"

from api.main import app
from api.db.database import Base, get_db, engine
from api.models import user, patient, note, appointment, audit
from api.deps import get_password_hash

# Override the engine with test database
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_FILE.name}"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    # Drop all tables first to ensure clean state
    Base.metadata.drop_all(bind=test_engine)
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database override"""
    from api.deps import get_current_user, get_current_active_user
    
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    # Override database dependency to use test database
    app.dependency_overrides[get_db] = override_get_db
    
    # Store current user for auth override (will be set by auth_headers fixture)
    current_test_user = [None]  # Use list to allow modification
    
    def override_get_current_user():
        return current_test_user[0]
    
    def override_get_current_active_user():
        user = current_test_user[0]
        if not user or not user.is_active:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    
    with TestClient(app) as test_client:
        # Store current_user setter in test_client
        test_client._set_user = lambda u: current_test_user.__setitem__(0, u)
        yield test_client
    
    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create a test user"""
    from api.models.user import User, UserRole
    
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        role=UserRole.DOCTOR.value,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_doctor(db):
    """Create a test doctor user"""
    from api.models.user import User, UserRole
    
    doctor = User(
        email="doctor@test.com",
        hashed_password=get_password_hash("doctor123"),
        full_name="Dr. Test",
        role=UserRole.DOCTOR.value,
        is_active=True
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@pytest.fixture
def test_nurse(db):
    """Create a test nurse user"""
    from api.models.user import User, UserRole
    
    nurse = User(
        email="nurse@test.com",
        hashed_password=get_password_hash("nurse123"),
        full_name="Nurse Test",
        role=UserRole.NURSE.value,
        is_active=True
    )
    db.add(nurse)
    db.commit()
    db.refresh(nurse)
    return nurse


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for test user - sets user in client"""
    # Set the current user in the client for dependency override
    client._set_user(test_user)
    # Return headers (though they won't be validated in tests)
    return {"Authorization": f"Bearer test-token"}


@pytest.fixture
def test_patient(db):
    """Create a test patient"""
    from api.models.patient import Patient
    from datetime import date
    
    patient = Patient(
        patient_id="MRN-TEST-001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1990, 1, 1),
        medical_record_number="MRN-TEST-001",
        allergies="None",
        medical_history="Hypertension"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

