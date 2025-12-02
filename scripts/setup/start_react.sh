#!/bin/bash

# 🚀 Quick Start Script for React Frontend
# This script helps you start the React application with the FastAPI backend

set -e  # Exit on error

echo "🏥 Secure Medical Notes AI - React Frontend Startup"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Check Docker
echo -e "${YELLOW}📦 Step 1: Checking Docker services...${NC}"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting Docker services (PostgreSQL + Redis)...${NC}"
    docker compose up -d
    echo -e "${GREEN}✅ Docker services started${NC}"
fi
echo ""

# Step 2: Check if FastAPI is running
echo -e "${YELLOW}🔌 Step 2: Checking FastAPI backend...${NC}"
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ FastAPI is running on port 8000${NC}"
else
    echo -e "${RED}❌ FastAPI is NOT running${NC}"
    echo -e "${YELLOW}Please start FastAPI in a separate terminal:${NC}"
    echo "   uvicorn api.main:app --reload --port 8000"
    echo ""
    read -p "Press Enter once FastAPI is running..."
fi
echo ""

# Step 3: Check Node.js installation
echo -e "${YELLOW}📦 Step 3: Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
echo ""

# Step 4: Navigate to React directory
echo -e "${YELLOW}📁 Step 4: Navigating to React app directory...${NC}"
cd "Design Premium Landing Page"
echo -e "${GREEN}✅ In React app directory${NC}"
echo ""

# Step 5: Check if node_modules exists
echo -e "${YELLOW}📦 Step 5: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing npm dependencies (this may take a few minutes)...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
echo ""

# Step 6: Check .env file
echo -e "${YELLOW}⚙️  Step 6: Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi
echo ""

# Step 7: Start development server
echo -e "${GREEN}🎉 All checks passed! Starting React development server...${NC}"
echo ""
echo -e "${YELLOW}The app will open automatically at http://localhost:3000${NC}"
echo ""
echo "Demo Credentials:"
echo "  👨‍⚕️ Doctor:"
echo "     Email: dr.williams@hospital.com"
echo "     Password: password123"
echo ""
echo "  👩‍⚕️ Nurse:"
echo "     Email: nurse.davis@hospital.com"
echo "     Password: password123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo "=================================================="
echo ""

# Start the dev server
npm run dev
