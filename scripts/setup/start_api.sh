#!/bin/bash
cd /Users/sukritisehgal/secure-med-notes-ai
source venv/bin/activate
echo "🚀 Starting API Server on http://localhost:8000"
uvicorn api.main:app --reload --port 8000
