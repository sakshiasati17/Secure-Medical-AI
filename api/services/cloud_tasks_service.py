"""
Google Cloud Tasks integration for background job processing.
Replaces Celery for Cloud Run environment.
"""
import os
import datetime
from typing import Optional, Dict, Any
import json

try:
    from google.cloud import tasks_v2
    from google.protobuf import timestamp_pb2
    GCP_TASKS_AVAILABLE = True
except ImportError:
    GCP_TASKS_AVAILABLE = False
    print("⚠️ Google Cloud Tasks library not installed. Background tasks will be disabled.")

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "securemed-ai")
LOCATION = os.getenv("GCP_REGION", "us-central1")
QUEUE_NAME = "mednotes-tasks"

def get_tasks_client():
    """Get Cloud Tasks client."""
    if not GCP_TASKS_AVAILABLE:
        return None
    try:
        return tasks_v2.CloudTasksClient()
    except Exception as e:
        print(f"Warning: Could not initialize Cloud Tasks client: {e}")
        return None

def create_task(
    endpoint: str,
    payload: Dict[Any, Any],
    schedule_time: Optional[datetime.datetime] = None,
    task_name: Optional[str] = None
) -> str:
    """
    Create a Cloud Task.
    
    Args:
        endpoint: API endpoint to call (e.g., '/ai/process-note')
        payload: JSON payload to send
        schedule_time: Optional time to schedule the task
        task_name: Optional custom task name
        
    Returns:
        Task name/ID
    """
    client = get_tasks_client()
    if not client or os.getenv("SKIP_CLOUD_TASKS") == "true":
        print(f"Skipping task creation for {endpoint} (Cloud Tasks disabled or client failed)")
        return "local-task-id"
    
    # Construct the queue path
    try:
        parent = client.queue_path(PROJECT_ID, LOCATION, QUEUE_NAME)
    except Exception as e:
        print(f"Error constructing queue path: {e}")
        return "error-task-id"
    
    # Get backend URL from environment
    backend_url = os.getenv("BACKEND_URL", "https://mednotes-backend-957293469884.us-central1.run.app")
    url = f"{backend_url}{endpoint}"
    
    # Construct the task
    task = {
        "http_request": {
            "http_method": tasks_v2.HttpMethod.POST if GCP_TASKS_AVAILABLE else "POST",
            "url": url,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": json.dumps(payload).encode(),
        }
    }
    
    # Add authentication for Cloud Run
    task["http_request"]["oidc_token"] = {
        "service_account_email": f"{PROJECT_ID}@appspot.gserviceaccount.com"
    }
    
    # Schedule task if time provided
    if schedule_time and GCP_TASKS_AVAILABLE:
        timestamp = timestamp_pb2.Timestamp()
        timestamp.FromDatetime(schedule_time)
        task["schedule_time"] = timestamp
    
    # Create the task
    try:
        response = client.create_task(request={"parent": parent, "task": task})
        return response.name
    except Exception as e:
        print(f"Error creating task: {e}")
        return f"error-{endpoint.replace('/', '-')}"

def create_ai_summarization_task(note_id: int) -> str:
    """Create a task to summarize a clinical note."""
    return create_task(
        endpoint="/ai/tasks/summarize",
        payload={"note_id": note_id}
    )

def create_risk_assessment_task(patient_id: int) -> str:
    """Create a task to assess patient risk."""
    return create_task(
        endpoint="/ai/tasks/risk-assessment",
        payload={"patient_id": patient_id}
    )

def ensure_queue_exists():
    """Ensure the Cloud Tasks queue exists."""
    if os.getenv("SKIP_CLOUD_TASKS") == "true":
        print("Skipping Cloud Tasks queue check (SKIP_CLOUD_TASKS=true)")
        return

    client = get_tasks_client()
    if not client:
        return

    try:
        parent = client.common_location_path(PROJECT_ID, LOCATION)
        queue_name = client.queue_path(PROJECT_ID, LOCATION, QUEUE_NAME)
        
        try:
            client.get_queue(name=queue_name)
            print(f"Queue {QUEUE_NAME} already exists")
        except Exception:
            # Create the queue
            queue = {
                "name": queue_name,
                "rate_limits": {
                    "max_dispatches_per_second": 10,
                    "max_concurrent_dispatches": 10,
                },
            }
            client.create_queue(request={"parent": parent, "queue": queue})
            print(f"Created queue {QUEUE_NAME}")
    except Exception as e:
        print(f"Warning: Could not ensure Cloud Tasks queue exists: {e}")
