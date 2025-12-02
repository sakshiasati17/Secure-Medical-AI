# 🚀 Google Cloud Platform Deployment Guide
## Secure Medical Notes AI - Complete Deployment Instructions

This guide will help you deploy the entire Secure Medical Notes AI application to Google Cloud Platform (GCP), including the React frontend, FastAPI backend, PostgreSQL database, and Redis cache.

---

## 📋 Prerequisites

### 1. GCP Account & Project
- ✅ GCP Project: `securemed-ai` (Project ID: `securemed-ai`)
- ✅ Project Number: `957293469884`
- ✅ Logged in with: `suse7498@colorado.edu`

### 2. Local Tools Required
```bash
# Verify installations
gcloud --version    # Google Cloud SDK
docker --version    # Docker
git --version       # Git
```

### 3. Install Google Cloud SDK (if needed)
```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

---

## 🏗️ Architecture Overview

The deployment uses the following GCP services:

```
┌─────────────────────────────────────────────────────────┐
│                    Internet Users                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Load Balancer (HTTPS)                │
└───────┬──────────────────────────────────┬──────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────┐            ┌──────────────────────┐
│  Cloud Run       │            │  Cloud Run           │
│  (Frontend)      │───────────▶│  (Backend API)       │
│  React + Nginx   │            │  FastAPI + Uvicorn   │
└──────────────────┘            └──────────┬───────────┘
                                           │
                        ┌──────────────────┼──────────────┐
                        ▼                  ▼              ▼
                ┌──────────────┐   ┌─────────────┐  ┌─────────┐
                │  Cloud SQL   │   │ Memorystore │  │ Secret  │
                │  PostgreSQL  │   │   (Redis)   │  │ Manager │
                └──────────────┘   └─────────────┘  └─────────┘
```

### Services Used:
1. **Cloud Run** - Serverless containers for frontend and backend
2. **Cloud SQL** - Managed PostgreSQL database
3. **Secret Manager** - Secure credential storage
4. **Container Registry** - Docker image storage
5. **Cloud Build** - CI/CD pipeline

---

## 🔐 Step 1: Authentication & Setup

### 1.1 Login to GCloud
```bash
# Login with your GCP account
gcloud auth login

# Set the project
gcloud config set project securemed-ai

# Verify project
gcloud config get-value project
```

### 1.2 Enable Application Default Credentials
```bash
gcloud auth application-default login
```

---

## 🎯 Step 2: Quick Deployment (Automated)

### Option A: One-Command Deployment 🚀

```bash
# Make the script executable
chmod +x deploy-gcp.sh

# Run the deployment
./deploy-gcp.sh
```

**This script will:**
- ✅ Enable required GCP APIs
- ✅ Create Cloud SQL PostgreSQL instance
- ✅ Set up Secret Manager for credentials
- ✅ Build and deploy backend API
- ✅ Build and deploy frontend app
- ✅ Display deployment URLs

**Expected Output:**
```
======================================
Deployment Complete!
======================================

Backend API:  https://mednotes-backend-XXXXX-uc.a.run.app
Frontend App: https://mednotes-frontend-XXXXX-uc.a.run.app

API Docs: https://mednotes-backend-XXXXX-uc.a.run.app/docs
======================================
```

---

## 📝 Step 3: Manual Deployment (Step-by-Step)

If you prefer manual control, follow these steps:

### 3.1 Enable Required APIs
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    compute.googleapis.com
```

### 3.2 Create Cloud SQL Instance
```bash
# Create PostgreSQL instance
gcloud sql instances create mednotes-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=$(openssl rand -base64 32)

# Create database
gcloud sql databases create mednotes --instance=mednotes-db

# Create user
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create mednotes_user \
    --instance=mednotes-db \
    --password=$DB_PASSWORD

# Save these credentials!
echo "Database User: mednotes_user"
echo "Database Password: $DB_PASSWORD"
```

### 3.3 Set Up Secret Manager
```bash
# Create database URL secret
echo -n "postgresql://mednotes_user:YOUR_PASSWORD@/mednotes?host=/cloudsql/securemed-ai:us-central1:mednotes-db" | \
    gcloud secrets create database-url --data-file=-

# Create application secret key
openssl rand -base64 32 | gcloud secrets create secret-key --data-file=-

# Create OpenAI API key secret (if you have one)
echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create openai-api-key --data-file=-

# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding securemed-ai \
    --member="serviceAccount:957293469884-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3.4 Deploy Backend API
```bash
# Build backend Docker image
gcloud builds submit --tag gcr.io/securemed-ai/mednotes-backend \
    -f Dockerfile.backend .

# Deploy to Cloud Run
gcloud run deploy mednotes-backend \
    --image gcr.io/securemed-ai/mednotes-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --add-cloudsql-instances securemed-ai:us-central1:mednotes-db \
    --set-env-vars "ENVIRONMENT=production,PORT=8080" \
    --set-secrets "DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest,OPENAI_API_KEY=openai-api-key:latest" \
    --memory 1Gi \
    --cpu 2 \
    --min-instances 0 \
    --max-instances 10

# Get backend URL
BACKEND_URL=$(gcloud run services describe mednotes-backend \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)')

echo "Backend deployed at: $BACKEND_URL"
```

### 3.5 Deploy Frontend
```bash
# Update frontend environment variable
cat > frontend/.env.production << EOF
VITE_API_BASE_URL=$BACKEND_URL
EOF

# Build frontend Docker image
cd frontend
gcloud builds submit --tag gcr.io/securemed-ai/mednotes-frontend .

# Deploy to Cloud Run
gcloud run deploy mednotes-frontend \
    --image gcr.io/securemed-ai/mednotes-frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe mednotes-frontend \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)')

echo "Frontend deployed at: $FRONTEND_URL"
cd ..
```

### 3.6 Run Database Migrations
```bash
# Connect to Cloud SQL
gcloud sql connect mednotes-db --user=mednotes_user

# In the SQL shell, verify connection
\l

# Exit SQL shell
\q

# Run migrations via Cloud SQL Proxy (if needed)
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Start proxy in background
./cloud-sql-proxy securemed-ai:us-central1:mednotes-db &

# Run migrations from local
# Update DATABASE_URL temporarily
export DATABASE_URL="postgresql://mednotes_user:PASSWORD@localhost:5432/mednotes"
python -c "from api.db.database import engine, Base; from api.models import user, patient, note, audit, appointment; Base.metadata.create_all(bind=engine)"
python api/seed_more_data.py
```

---

## 🔧 Step 4: Configuration & Testing

### 4.1 Update CORS Settings
Edit `api/main.py` to add your frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mednotes-frontend-XXXXX-uc.a.run.app",
        "http://localhost:5173",  # Keep for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend:
```bash
gcloud builds submit --tag gcr.io/securemed-ai/mednotes-backend -f Dockerfile.backend .
gcloud run deploy mednotes-backend --image gcr.io/securemed-ai/mednotes-backend --region us-central1
```

### 4.2 Test Deployment
```bash
# Test backend health
curl https://mednotes-backend-XXXXX-uc.a.run.app/health

# Test API docs
open https://mednotes-backend-XXXXX-uc.a.run.app/docs

# Test frontend
open https://mednotes-frontend-XXXXX-uc.a.run.app
```

### 4.3 Verify Database Connection
```bash
# Check Cloud Run logs
gcloud run services logs read mednotes-backend --region us-central1 --limit 50

# Check for database connection errors
gcloud run services logs read mednotes-backend --region us-central1 --filter="database"
```

---

## 💰 Step 5: Cost Optimization

### 5.1 Set Up Budget Alerts
```bash
# Create budget alert
gcloud billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="MedNotes Monthly Budget" \
    --budget-amount=50USD

# View current costs
gcloud billing projects describe securemed-ai
```

### 5.2 Optimize Cloud Run Settings
```bash
# Update to use min-instances=0 for dev (already done in deployment)
# This ensures you only pay when app is in use

# For production, consider min-instances=1 to reduce cold starts
gcloud run services update mednotes-backend \
    --region us-central1 \
    --min-instances 1
```

### 5.3 Use Cloud SQL Scheduled Backups
```bash
# Enable automated backups (already enabled in setup)
gcloud sql instances patch mednotes-db \
    --backup-start-time=03:00 \
    --retained-backups-count=7
```

---

## 🔍 Step 6: Monitoring & Logging

### 6.1 View Logs
```bash
# Backend logs
gcloud run services logs read mednotes-backend --region us-central1 --limit 100

# Frontend logs
gcloud run services logs read mednotes-frontend --region us-central1 --limit 100

# Cloud SQL logs
gcloud sql operations list --instance mednotes-db
```

### 6.2 Monitor Performance
```bash
# Open Cloud Console Monitoring
open "https://console.cloud.google.com/monitoring?project=securemed-ai"

# View Cloud Run metrics
gcloud run services describe mednotes-backend --region us-central1
```

---

## 🔄 Step 7: CI/CD Setup (Optional)

### 7.1 Set Up Cloud Build Triggers
```bash
# Connect GitHub repository
gcloud beta builds triggers create github \
    --repo-name=Secure-Medical-AI \
    --repo-owner=sukritisehgal-28 \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

### 7.2 Test CI/CD
```bash
# Push to main branch triggers automatic deployment
git add .
git commit -m "Deploy to GCP"
git push origin main

# Monitor build
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Verify Cloud SQL connection name
gcloud sql instances describe mednotes-db --format="value(connectionName)"

# Check Cloud Run has correct instance connection
gcloud run services describe mednotes-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"

# Test database connection
gcloud sql connect mednotes-db --user=mednotes_user
```

#### 2. CORS Errors
- Update `allow_origins` in `api/main.py`
- Redeploy backend
- Clear browser cache

#### 3. Build Failures
```bash
# View build logs
gcloud builds list --limit=10
gcloud builds log BUILD_ID

# Common fix: increase timeout
gcloud builds submit --timeout=20m --tag gcr.io/securemed-ai/mednotes-backend
```

#### 4. Cloud Run Memory Issues
```bash
# Increase memory allocation
gcloud run services update mednotes-backend \
    --region us-central1 \
    --memory 2Gi
```

---

## 📊 Estimated Costs

**Monthly Costs (with dev/low traffic):**
- Cloud Run: ~$0-5 (with min-instances=0)
- Cloud SQL (db-f1-micro): ~$7-10
- Container Registry: ~$0.10
- Secret Manager: ~$0.06
- **Total: ~$7-15/month** 💵

**For production with moderate traffic:**
- Cloud Run: ~$20-50
- Cloud SQL (db-g1-small): ~$25-35
- **Total: ~$45-85/month** 💵

---

## ✅ Deployment Checklist

- [ ] GCloud CLI installed and authenticated
- [ ] Project set to `securemed-ai`
- [ ] All APIs enabled
- [ ] Cloud SQL instance created
- [ ] Database and user created
- [ ] Secrets stored in Secret Manager
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Cloud Run
- [ ] CORS configuration updated
- [ ] Database migrations run
- [ ] Test data seeded
- [ ] Application tested end-to-end
- [ ] Budget alerts configured
- [ ] Monitoring set up

---

## 🎉 Post-Deployment

### Access Your Application
- **Frontend:** https://mednotes-frontend-XXXXX-uc.a.run.app
- **Backend API:** https://mednotes-backend-XXXXX-uc.a.run.app
- **API Docs:** https://mednotes-backend-XXXXX-uc.a.run.app/docs

### Demo Credentials
Use the seeded credentials from `LOGIN_CREDENTIALS.txt`:
- Doctor: dr.williams@hospital.com / password123
- Nurse: nurse.davis@hospital.com / password123

---

## 📞 Support

For issues or questions:
- Check Cloud Console: https://console.cloud.google.com/home/dashboard?project=securemed-ai
- View logs: `gcloud run services logs read SERVICE_NAME --region us-central1`
- GitHub Issues: https://github.com/sukritisehgal-28/Secure-Medical-AI/issues

---

**🚀 Your Secure Medical Notes AI is now live on Google Cloud Platform!**
