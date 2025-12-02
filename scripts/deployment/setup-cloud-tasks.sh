#!/bin/bash

# Setup Google Cloud Tasks for background job processing
# This replaces Celery worker on Cloud Run

PROJECT_ID="securemed-ai"
REGION="us-central1"
QUEUE_NAME="mednotes-tasks"

echo "Setting up Google Cloud Tasks..."

# Enable Cloud Tasks API
echo "Enabling Cloud Tasks API..."
gcloud services enable cloudtasks.googleapis.com --project=$PROJECT_ID

# Create the queue
echo "Creating Cloud Tasks queue: $QUEUE_NAME"
gcloud tasks queues create $QUEUE_NAME \
  --location=$REGION \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=10 \
  --project=$PROJECT_ID \
  || echo "Queue may already exist"

# Describe the queue
echo "Queue details:"
gcloud tasks queues describe $QUEUE_NAME \
  --location=$REGION \
  --project=$PROJECT_ID

echo "Cloud Tasks setup complete!"
echo "Queue: $QUEUE_NAME"
echo "Location: $REGION"
