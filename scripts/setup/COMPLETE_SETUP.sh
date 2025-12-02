#!/bin/bash

# Complete Setup Script - Runs Everything
set -e

echo "🏥 Secure Medical Notes AI - Complete Setup"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Docker
echo -e "${BLUE}Step 1: Starting Docker services...${NC}"
docker compose up -d
echo -e "${GREEN}✅ Docker services running${NC}"
echo ""

# Step 2: Check if we need to seed
echo -e "${BLUE}Step 2: Checking database...${NC}"
if [ ! -f "mednotes.db" ]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    python api/seed_more_data.py
fi
echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Step 3: Install React dependencies
echo -e "${BLUE}Step 3: Installing React dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}Dependencies already installed${NC}"
fi
cd ..
echo -e "${GREEN}✅ React dependencies ready${NC}"
echo ""

# Step 4: Start FastAPI
echo -e "${BLUE}Step 4: Starting FastAPI backend...${NC}"
echo -e "${YELLOW}Starting on port 8000...${NC}"
source .venv/bin/activate && python -m uvicorn api.main:app --reload --port 8000 &
FASTAPI_PID=$!
echo -e "${GREEN}✅ FastAPI started (PID: $FASTAPI_PID)${NC}"
echo ""

# Wait for FastAPI to start
echo -e "${YELLOW}Waiting for FastAPI to be ready...${NC}"
sleep 5

# Step 5: Start React
echo -e "${BLUE}Step 5: Starting React app...${NC}"
cd frontend
npm run dev &
REACT_PID=$!
cd ..
echo -e "${GREEN}✅ React app started (PID: $REACT_PID)${NC}"
echo ""

echo -e "${GREEN}=============================================="
echo "🎉 All services started successfully!"
echo "=============================================="
echo ""
echo "Access points:"
echo "  React UI:    http://localhost:3000"
echo "  FastAPI:     http://localhost:8000"
echo "  API Docs:    http://localhost:8000/docs"
echo ""
echo "Demo Credentials:"
echo "  👨‍⚕️ Doctor: dr.williams@hospital.com / password123"
echo "  👩‍⚕️ Nurse:  nurse.davis@hospital.com / password123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "=============================================="
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $FASTAPI_PID $REACT_PID; docker compose down; exit 0" INT
wait
