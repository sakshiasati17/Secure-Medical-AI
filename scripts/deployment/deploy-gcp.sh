#!/bin/bash

# GCP Deployment Script for Secure Medical Notes AI
# This script deploys the entire application to Google Cloud Platform

set -e  # Exit on error

# Configuration
PROJECT_ID="securemed-ai"
REGION="us-central1"
BACKEND_SERVICE="mednotes-backend"
FRONTEND_SERVICE="mednotes-frontend"
DB_INSTANCE="mednotes-db"
DB_NAME="mednotes"
DB_USER="mednotes_user"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================"
echo "Secure Med Notes AI - GCP Deployment"
echo "======================================${NC}"

# Step 1: Set project
echo -e "\n${YELLOW}Step 1: Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo -e "\n${YELLOW}Step 2: Enabling required GCP APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# Step 3: Create Cloud SQL instance (if not exists)
echo -e "\n${YELLOW}Step 3: Checking Cloud SQL instance...${NC}"
if gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID 2>/dev/null; then
    echo "Cloud SQL instance already exists"
else
    echo "Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$(openssl rand -base64 32) \
        --backup-start-time=03:00

    echo "Creating database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE

    echo "Creating database user..."
    DB_PASSWORD=$(openssl rand -base64 32)
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE \
        --password=$DB_PASSWORD

    echo -e "${GREEN}Database credentials:${NC}"
    echo "User: $DB_USER"
    echo "Password: $DB_PASSWORD"
    echo -e "${RED}SAVE THESE CREDENTIALS!${NC}"
fi

# Step 4: Create Secret Manager secrets
echo -e "\n${YELLOW}Step 4: Setting up Secret Manager...${NC}"
if ! gcloud secrets describe database-url --project=$PROJECT_ID 2>/dev/null; then
    echo "Creating database URL secret..."
    echo -n "postgresql://$DB_USER:PASSWORD@/mednotes?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE" | \
        gcloud secrets create database-url --data-file=-
fi

if ! gcloud secrets describe secret-key --project=$PROJECT_ID 2>/dev/null; then
    echo "Creating secret key..."
    openssl rand -base64 32 | gcloud secrets create secret-key --data-file=-
fi

# Step 5: Build and deploy backend
echo -e "\n${YELLOW}Step 5: Building and deploying backend API...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
    --project=$PROJECT_ID \
    -f Dockerfile.backend .

echo "Deploying backend to Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE \
    --set-env-vars "ENVIRONMENT=production,PORT=8080" \
    --set-secrets "DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest" \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --project=$PROJECT_ID

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

echo -e "${GREEN}Backend deployed at: $BACKEND_URL${NC}"

# Step 6: Update frontend environment variable
echo -e "\n${YELLOW}Step 6: Updating frontend API URL...${NC}"
cat > frontend/.env.production << EOF
VITE_API_URL=$BACKEND_URL
EOF

# Step 7: Build and deploy frontend
echo -e "\n${YELLOW}Step 7: Building and deploying frontend...${NC}"
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
    --project=$PROJECT_ID

echo "Deploying frontend to Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE \
    --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --max-instances 10 \
    --project=$PROJECT_ID

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)' \
    --project=$PROJECT_ID)

cd ..

echo -e "\n${GREEN}======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Backend API:  $BACKEND_URL"
echo "Frontend App: $FRONTEND_URL"
echo ""
echo "API Docs: $BACKEND_URL/docs"
echo "=====================================${NC}"

# Step 8: Run database migrations
echo -e "\n${YELLOW}Step 8: Running database migrations...${NC}"
echo "Note: You may need to run migrations manually using Cloud SQL Proxy"
echo "Command: gcloud sql connect $DB_INSTANCE --user=$DB_USER"
