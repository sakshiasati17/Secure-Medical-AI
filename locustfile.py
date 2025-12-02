"""
Locust load testing configuration for Secure Medical Notes AI
"""
from locust import HttpUser, task, between
import random
import json


class MedicalNotesUser(HttpUser):
    """Simulates a user interacting with the medical notes API"""
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a simulated user starts"""
        # Register a new user for this test session
        self.email = f"loadtest_{random.randint(1000, 9999)}@test.com"
        self.password = "loadtest123"
        
        # Register
        register_response = self.client.post(
            "/auth/register",
            json={
                "email": self.email,
                "password": self.password,
                "full_name": f"Load Test User {random.randint(1, 1000)}",
                "role": "doctor"
            }
        )
        
        # Login
        login_response = self.client.post(
            "/auth/login",
            json={
                "email": self.email,
                "password": self.password
            }
        )
        
        if login_response.status_code == 200:
            self.token = login_response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def get_patients(self):
        """Get list of patients (most common operation)"""
        if self.token:
            self.client.get("/patients/", headers=self.headers)
    
    @task(2)
    def get_notes(self):
        """Get list of notes"""
        if self.token:
            self.client.get("/notes/", headers=self.headers)
    
    @task(1)
    def create_note(self):
        """Create a new clinical note"""
        if self.token:
            # First get patients to use a real patient ID
            patients_response = self.client.get("/patients/", headers=self.headers)
            if patients_response.status_code == 200:
                patients = patients_response.json()
                if patients:
                    patient_id = patients[0]["id"]
                    self.client.post(
                        "/notes/",
                        headers=self.headers,
                        json={
                            "patient_id": patient_id,
                            "title": f"Load Test Note {random.randint(1, 10000)}",
                            "content": "This is a load test note created during performance testing.",
                            "note_type": "doctor_note"
                        }
                    )
    
    @task(1)
    def get_health(self):
        """Check health endpoint (no auth required)"""
        self.client.get("/health")
    
    @task(1)
    def get_appointments(self):
        """Get appointments"""
        if self.token:
            self.client.get("/appointments/", headers=self.headers)


class ReadOnlyUser(HttpUser):
    """Simulates read-only operations (like viewing dashboards)"""
    wait_time = between(0.5, 2)
    weight = 2  # More read-only users than write users
    
    def on_start(self):
        """Login as existing user"""
        # Use a test account (assuming it exists)
        login_response = self.client.post(
            "/auth/login",
            json={
                "email": "dr.williams@hospital.com",
                "password": "password123"
            }
        )
        
        if login_response.status_code == 200:
            self.token = login_response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(5)
    def get_patients(self):
        """Frequently view patients"""
        if self.token:
            self.client.get("/patients/", headers=self.headers)
    
    @task(3)
    def get_notes(self):
        """View notes"""
        if self.token:
            self.client.get("/notes/", headers=self.headers)
    
    @task(1)
    def get_appointments(self):
        """View appointments"""
        if self.token:
            self.client.get("/appointments/", headers=self.headers)

