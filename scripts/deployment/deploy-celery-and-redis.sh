#!/bin/bash

# Deploy Celery Worker and Update Backend with Redis
# Run this script after Celery worker build completes

set -e

echo "🚀 Deploying Celery Worker to Cloud Run..."
gcloud run deploy mednotes-worker \
  --image gcr.io/securemed-ai/mednotes-worker \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-secrets=DATABASE_URL=database-url:latest,REDIS_URL=redis-url:latest,OPENAI_API_KEY=openai-api-key:latest,SECRET_KEY=secret-key:latest \
  --set-env-vars=ENVIRONMENT=production \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --project securemed-ai

echo "✅ Celery Worker deployed successfully!"

echo ""
echo "🔄 Updating Backend with Redis URL..."
gcloud run services update mednotes-backend \
  --update-secrets=REDIS_URL=redis-url:latest \
  --region us-central1 \
  --project securemed-ai

echo "✅ Backend updated with Redis URL!"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Services Status:"
gcloud run services list --project=securemed-ai --region=us-central1

echo ""
echo "🌐 Your Application URLs:"
echo "Frontend: https://mednotes-frontend-957293469884.us-central1.run.app"
echo "Backend: https://mednotes-backend-957293469884.us-central1.run.app"
echo ""
echo "✨ Sign-Up Feature: Now live with login/sign-up toggle!"
echo "🎯 Celery Worker: Ready for background task processing!"
