# 🏗️ Secure Medical AI - System Architecture

Complete architectural documentation for the Secure Medical AI platform - a full-stack healthcare documentation system with AI-powered clinical insights.

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Architecture Diagram](#-architecture-diagram)
3. [Technology Stack](#-technology-stack)
4. [Component Details](#-component-details)
5. [Data Flow](#-data-flow)
6. [Security Architecture](#-security-architecture)
7. [API Architecture](#-api-architecture)
8. [Database Schema](#-database-schema)
9. [Deployment Architecture](#-deployment-architecture)
10. [Development Workflow](#-development-workflow)

---

## 🎯 System Overview

### Purpose
AI-powered clinical documentation platform that enables healthcare teams to:
- Create and manage patient medical records
- Generate AI summaries of clinical notes
- Assess patient risk levels automatically
- Track vitals, medications, and care tasks
- Collaborate across doctor and nurse roles

### Key Features
- **AI Summarization**: Auto-generate concise summaries from clinical notes
- **Risk Assessment**: AI-powered patient risk scoring
- **Role-Based Access**: Separate workspaces for doctors and nurses
- **Real-time Data**: Live patient vitals and medication tracking
- **HIPAA Compliance**: Secure authentication, audit logging, encryption-ready

### Deployment Status
✅ **Production-Ready and Deployed on Google Cloud Platform**
- **Frontend**: Cloud Run (React + Nginx) - https://mednotes-frontend-957293469884.us-central1.run.app
- **Backend**: Cloud Run (FastAPI) - https://mednotes-backend-957293469884.us-central1.run.app
- **Database**: Cloud SQL PostgreSQL
- **Cache**: Memorystore Redis
- **Secrets**: Google Secret Manager
- **Background Tasks**: Cloud Tasks

---

## 🏛️ Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│                                                                       │
│  ┌──────────────────┐              ┌──────────────────┐            │
│  │  Doctor Browser  │              │  Nurse Browser   │            │
│  │   (React SPA)    │              │   (React SPA)    │            │
│  └────────┬─────────┘              └────────┬─────────┘            │
│           │                                  │                       │
│           └──────────────┬───────────────────┘                       │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │ HTTPS/REST API
                           │ JWT Bearer Token
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                                  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            React 18.3 + TypeScript + Vite                     │  │
│  │                    (Port 3000)                                │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │  │
│  │  │   Doctor    │  │    Nurse    │  │     Shared       │    │  │
│  │  │  Dashboard  │  │  Dashboard  │  │   Components     │    │  │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘    │  │
│  │                                                               │  │
│  │  Components:                                                  │  │
│  │  • DoctorDashboard.tsx  • NurseDashboard.tsx                │  │
│  │  • PatientsTab.tsx      • Login.tsx                          │  │
│  │  • ClinicalNotesTab.tsx • CalendarTab.tsx                    │  │
│  │                                                               │  │
│  │  Services:                                                    │  │
│  │  • api.ts (API client with JWT management)                   │  │
│  │                                                               │  │
│  │  UI Libraries:                                                │  │
│  │  • Framer Motion (animations)                                │  │
│  │  • Radix UI (48 accessible components)                       │  │
│  │  • Lucide React (icons)                                      │  │
│  │  • Tailwind CSS (styling)                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTP/JSON
                         │ Authorization: Bearer {token}
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER (API)                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              FastAPI + Uvicorn (Port 8000)                    │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                               │  │
│  │  Routes (/api/routes/):                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌───────┐  ┌──────────────┐   │  │
│  │  │   auth   │  │ patients │  │ notes │  │ ai / appts   │   │  │
│  │  └────┬─────┘  └────┬─────┘  └───┬───┘  └──────┬───────┘   │  │
│  │       │             │             │              │            │  │
│  │       └─────────────┴─────────────┴──────────────┘            │  │
│  │                          │                                    │  │
│  │       Middleware & Security:                                  │  │
│  │       ┌────────────────────────────────────────┐              │  │
│  │       │ • JWT Authentication (python-jose)    │              │  │
│  │       │ • RBAC (Doctor/Nurse/Admin)          │              │  │
│  │       │ • Pydantic Validation                │              │  │
│  │       │ • CORS Configuration                 │              │  │
│  │       │ • Password Hashing (bcrypt)          │              │  │
│  │       └────────────────┬───────────────────────┘              │  │
│  │                        │                                      │  │
│  │  Dependencies (deps.py):                                      │  │
│  │  • get_db() - Database session                               │  │
│  │  • get_current_user() - JWT verification                     │  │
│  │  • verify_role() - Role-based access                         │  │
│  │                                                               │  │
│  └───────────────────────┼───────────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                                  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   AI Services    │  │  Auth Services   │  │  Data Services  │  │
│  │  (/api/agents/)  │  │                  │  │                 │  │
│  ├──────────────────┤  ├──────────────────┤  ├─────────────────┤  │
│  │ • Summarization  │  │ • JWT creation   │  │ • Patient CRUD  │  │
│  │ • Risk Analysis  │  │ • Password hash  │  │ • Note CRUD     │  │
│  │ • Embeddings     │  │ • Token verify   │  │ • Audit logs    │  │
│  └────────┬─────────┘  └──────────────────┘  └─────────────────┘  │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LangChain Framework                        │  │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐  │  │
│  │  │ Summarization  │  │   Risk Agent     │  │   Prompts   │  │  │
│  │  │    Agent       │  │   (GPT-4)        │  │  Templates  │  │  │
│  │  └────────┬───────┘  └────────┬─────────┘  └─────────────┘  │  │
│  │           │                   │                              │  │
│  │           └───────────────────┘                              │  │
│  │                      │                                        │  │
│  │                      ▼                                        │  │
│  │           ┌──────────────────────┐                           │  │
│  │           │   OpenAI API         │                           │  │
│  │           │  • GPT-4 Turbo       │                           │  │
│  │           │  • Embeddings API    │                           │  │
│  │           └──────────────────────┘                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                       │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   PostgreSQL    │  │    Redis     │  │   FAISS Vector DB      │ │
│  │   (Port 5434)   │  │  (Port 6379) │  │     (In-Memory)        │ │
│  ├─────────────────┤  ├──────────────┤  ├────────────────────────┤ │
│  │                 │  │              │  │                        │ │
│  │  Tables:        │  │  Usage:      │  │  Purpose:              │ │
│  │  • users        │  │  • Sessions  │  │  • Semantic search     │ │
│  │  • patients     │  │  • Cache     │  │  • Note embeddings     │ │
│  │  • notes        │  │  • Pub/Sub   │  │  • Similarity matching │ │
│  │  • appointments │  │              │  │                        │ │
│  │  • audit_logs   │  │              │  │                        │ │
│  │                 │  │              │  │                        │ │
│  │  ORM:           │  │  Client:     │  │  Framework:            │ │
│  │  SQLAlchemy     │  │  redis-py    │  │  FAISS (Facebook AI)   │ │
│  └─────────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                       │
│  Docker Containers (docker-compose.yml):                             │
│  • postgres:15                                                        │
│  • redis:7-alpine                                                     │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend (React SPA)
```
Technology          Version     Purpose
─────────────────────────────────────────────────────────────────
React               18.3.1      UI framework
TypeScript          ^5.x        Type safety
Vite                6.3.5       Build tool & dev server
Framer Motion       *           Animations & transitions
Tailwind CSS        ^3.x        Utility-first styling
Radix UI            ^1.x        Accessible UI components (48 components)
Lucide React        ^0.487      Icon library
React Hook Form     ^7.55       Form handling
Recharts            ^2.15       Data visualization
```

### Backend (FastAPI)
```
Technology          Version     Purpose
─────────────────────────────────────────────────────────────────
FastAPI             ^0.104      Modern API framework
Uvicorn             ^0.24       ASGI server
Pydantic            ^2.5        Data validation
SQLAlchemy          ^2.0        ORM for database
Alembic             ^1.12       Database migrations
Python-Jose         ^3.3        JWT tokens
Passlib[bcrypt]     ^1.7        Password hashing
Python-Dotenv       ^1.0        Environment variables
```

### AI/ML Stack
```
Technology          Version     Purpose
─────────────────────────────────────────────────────────────────
OpenAI              ^1.3        GPT-4 API access
LangChain           ^0.0.340    AI workflow orchestration
LangChain-OpenAI    ^0.0.2      OpenAI integration
FAISS               ^1.7        Vector similarity search
```

### Data Layer
```
Technology          Version     Purpose
─────────────────────────────────────────────────────────────────
PostgreSQL          15          Primary relational database
Redis               7-alpine    Caching & session management
FAISS               ^1.7        Vector embeddings storage
```

### DevOps
```
Technology          Version     Purpose
─────────────────────────────────────────────────────────────────
Docker              24+         Containerization
Docker Compose      2.x         Multi-container orchestration
Git                 2.x         Version control
```

---

## 🧩 Component Details

### Frontend Components (`/frontend/src/components/`)

#### Authentication
- **Login.tsx**: JWT-based login with role detection

#### Doctor Portal
- **DoctorDashboard.tsx**: Main doctor workspace
  - Dashboard tab: Stats, recent notes, high-risk patients
  - Patients tab: Patient intelligence workspace
  - Clinical Notes tab: AI-powered note creation
  - AI & Analytics tab: Risk assessment dashboard
  - Calendar tab: Appointment scheduling

#### Nurse Portal
- **NurseDashboard.tsx**: Main nurse workspace
  - Dashboard tab: Assigned patients, vitals, timeline
  - My Patients tab: Room assignments
  - Vitals tab: BP, temperature, heart rate monitoring
  - Medications tab: MAR (Medication Administration Record)
  - Schedule tab: Shift calendar

#### Shared Components
- **PatientsTab.tsx**: Patient search and management
- **ClinicalNotesTab.tsx**: Note creation with AI
- **CalendarTab.tsx**: Appointment scheduling
- Landing page components (Hero, Benefits, Testimonials)

#### UI Library (`/frontend/src/components/ui/`)
- 48 Radix UI components for accessibility
- Button, Card, Dialog, Dropdown, etc.

---

### Backend Components (`/api/`)

#### Routes (`/api/routes/`)
```
auth.py           POST /auth/login, /auth/signup
patients.py       GET/POST /patients/, GET /patients/{id}
notes.py          GET/POST /notes/, GET /notes/{id}
ai.py             POST /ai/summarize/{id}, GET /ai/risk-report/{id}
appointments.py   GET/POST /appointments/
```

#### Models (`/api/models/`)
```
user.py           User model (SQLAlchemy)
patient.py        Patient model
note.py           Note model
audit.py          AuditLog model
appointment.py    Appointment model
```

#### Schemas (`/api/schemas/`)
```
user.py           UserCreate, UserResponse (Pydantic)
patient.py        PatientCreate, PatientResponse
note.py           NoteCreate, NoteResponse
```

#### Agents (`/api/agents/`)
```
summarization_agent.py    AI note summarization
risk_agent.py             Patient risk assessment
```

#### Services (`/api/services/`)
```
ai_service.py             OpenAI integration
auth_service.py           JWT & password handling
```

---

## 🔄 Data Flow

### 1. User Authentication Flow
```
User enters credentials
    ↓
React Login.tsx calls api.login()
    ↓
POST /auth/login (FastAPI)
    ↓
Verify password (bcrypt)
    ↓
Generate JWT token (python-jose)
    ↓
Return { access_token, token_type }
    ↓
Store token in LocalStorage
    ↓
Redirect to role-based dashboard
```

### 2. Patient Data Retrieval Flow
```
User opens Patients tab
    ↓
React calls api.getPatients()
    ↓
GET /patients/ with Authorization header
    ↓
FastAPI verifies JWT
    ↓
Query PostgreSQL (SQLAlchemy)
    ↓
Return JSON array of patients
    ↓
React renders patient cards
```

### 3. AI Note Summarization Flow
```
Doctor creates clinical note
    ↓
POST /notes/ with note content
    ↓
Save note to PostgreSQL
    ↓
Return note_id
    ↓
Doctor clicks "Summarize with AI"
    ↓
POST /ai/summarize/{note_id}
    ↓
Fetch note from database
    ↓
LangChain prepares prompt
    ↓
OpenAI GPT-4 generates summary
    ↓
Generate embeddings (OpenAI)
    ↓
Store embeddings in FAISS
    ↓
Update note.summary in PostgreSQL
    ↓
Return summary to frontend
    ↓
Display summary in UI
```

### 4. Risk Assessment Flow
```
Request risk report for patient
    ↓
GET /ai/risk-report/{patient_id}
    ↓
Fetch patient + all notes
    ↓
LangChain Risk Agent analyzes
    ↓
GPT-4 assesses risk level
    ↓
Generate recommendations
    ↓
Return risk report JSON
    ↓
Display in dashboard
```

---

## 🔐 Security Architecture

### Authentication & Authorization

#### JWT Token Flow
```
1. User logs in → Receive JWT
2. Store JWT in LocalStorage
3. Include in Authorization header: Bearer {token}
4. Backend verifies signature + expiration
5. Extract user_id and role from payload
6. Grant access based on role
```

#### Role-Based Access Control (RBAC)
```
Role        Access
─────────────────────────────────────────────
Doctor      • All patients
            • Create/edit clinical notes
            • AI analytics
            • Risk reports
            • Appointments

Nurse       • Assigned patients
            • Vitals entry
            • Medication tracking
            • Task management
            • Limited note access

Admin       • User management
            • System configuration
            • Audit logs
```

### Password Security
- **Hashing**: bcrypt with salt
- **Storage**: Never store plaintext
- **Validation**: Minimum length, complexity rules

### Data Security
- **Encryption at rest**: PostgreSQL encryption (can enable)
- **Encryption in transit**: HTTPS/TLS
- **Audit logging**: All data access logged
- **Session management**: Redis-backed sessions

### HIPAA Compliance Considerations
- ✅ Authentication & Authorization
- ✅ Audit trails
- ✅ Role-based access
- ✅ Encryption-ready architecture
- ⚠️ **TODO**: Enable TLS/SSL certificates
- ⚠️ **TODO**: Implement data encryption at rest
- ⚠️ **TODO**: Add session timeout policies

---

## 📡 API Architecture

### REST API Design

#### Base URL
```
Development:  http://localhost:8000
Production:   https://api.yourdomain.com
```

#### Endpoints

**Authentication**
```
POST   /auth/signup       Create new user
POST   /auth/login        Get JWT token
GET    /auth/me           Get current user
```

**Patients**
```
GET    /patients/         List all patients (filtered by role)
GET    /patients/{id}     Get patient details
POST   /patients/         Create new patient
PUT    /patients/{id}     Update patient
DELETE /patients/{id}     Delete patient (admin only)
```

**Notes**
```
GET    /notes/            List notes (filtered by user)
GET    /notes/{id}        Get note details
POST   /notes/            Create clinical note
PUT    /notes/{id}        Update note
DELETE /notes/{id}        Delete note
```

**AI Services**
```
POST   /ai/summarize/{note_id}        Generate summary
GET    /ai/risk-report/{patient_id}   Generate risk report
GET    /ai/high-risk-patients         List high-risk patients
POST   /ai/batch-summarize            Batch summarization
GET    /ai/status                     Check AI service health
```

**Appointments**
```
GET    /appointments/     List appointments
POST   /appointments/     Create appointment
PUT    /appointments/{id} Update appointment
DELETE /appointments/{id} Cancel appointment
```

#### Response Format
```json
Success (200-201):
{
  "id": 1,
  "data": {...},
  "message": "Success"
}

Error (400-500):
{
  "detail": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'doctor', 'nurse', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Patients Table
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    medical_record_number VARCHAR(50) UNIQUE,
    allergies TEXT,
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Notes Table
```sql
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    content TEXT NOT NULL,
    summary TEXT,
    note_type VARCHAR(50),  -- 'doctor_note', 'nurse_note', etc.
    risk_level VARCHAR(20),  -- 'LOW', 'MEDIUM', 'HIGH'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    appointment_date TIMESTAMP NOT NULL,
    duration INTEGER,  -- minutes
    status VARCHAR(50),  -- 'scheduled', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),  -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    resource_type VARCHAR(50),  -- 'patient', 'note', etc.
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Relationships
```
users (1) ────< (many) notes
users (1) ────< (many) appointments
patients (1) ──< (many) notes
patients (1) ──< (many) appointments
```

---

## 🚀 Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────┐
│  Developer Machine (macOS/Linux)        │
│                                          │
│  ┌────────────────┐  ┌────────────────┐ │
│  │  React Dev     │  │  FastAPI Dev   │ │
│  │  (Port 3000)   │  │  (Port 8000)   │ │
│  │  npm run dev   │  │  uvicorn --    │ │
│  │                │  │    reload      │ │
│  └────────────────┘  └────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Docker Containers                 │ │
│  │  • PostgreSQL (Port 5434)          │ │
│  │  • Redis (Port 6379)               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Production Environment (✅ Deployed on Google Cloud Platform)
```
┌─────────────────────────────────────────────────────────┐
│              Google Cloud Platform (GCP)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Cloud Run Services                        │  │
│  │                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐   │  │
│  │  │  Frontend        │  │  Backend API      │   │  │
│  │  │  (React + Nginx) │  │  (FastAPI)        │   │  │
│  │  │  ✅ Deployed     │  │  ✅ Deployed      │   │  │
│  │  └────────┬─────────┘  └────────┬─────────┘   │  │
│  └───────────┼──────────────────────┼──────────────┘  │
│              │                      │                  │
│              ▼                      ▼                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Cloud SQL (PostgreSQL)                    │  │
│  │         ✅ Deployed @ 34.132.36.69                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Memorystore (Redis)                      │  │
│  │         ✅ Deployed @ 10.66.24.147:6379          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Cloud Tasks                               │  │
│  │         ✅ Background task processing             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Secret Manager                           │  │
│  │         ✅ Stores: DB URL, API keys, secrets     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│              │                                          │
│              ▼                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         External Services                        │  │
│  │         • OpenAI API (GPT-4)                     │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

🌐 Live URLs:
• Frontend: https://mednotes-frontend-957293469884.us-central1.run.app
• Backend:  https://mednotes-backend-957293469884.us-central1.run.app
• API Docs:  https://mednotes-backend-957293469884.us-central1.run.app/docs
```

### Docker Compose (Development)
```yaml
services:
  postgres:
    image: postgres:15
    ports: ["5434:5432"]
    environment:
      POSTGRES_USER: meduser
      POSTGRES_PASSWORD: medpass123
      POSTGRES_DB: secure_med_notes

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

---

## 👨‍💻 Development Workflow

### Setup & Installation

#### 1. Clone Repository
```bash
git clone https://github.com/sukritisehgal-28/Secure-Medical-AI.git
cd Secure-Medical-AI
```

#### 2. Backend Setup
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
```

#### 3. Start Infrastructure
```bash
# Start PostgreSQL + Redis
docker compose up -d

# Create database tables
python -c "from api.db.database import engine, Base; from api.models import user, patient, note, audit; Base.metadata.create_all(bind=engine)"

# Seed sample data
python api/seed_more_data.py
```

#### 4. Start Backend
```bash
uvicorn api.main:app --reload --port 8000
```

#### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

#### 6. Access Application
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- API: http://localhost:8000

### Development Commands

#### Backend
```bash
# Run API server
uvicorn api.main:app --reload --port 8000

# Run tests
pytest

# Database migration
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Seed data
python api/seed_more_data.py
```

#### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
tsc --noEmit

# Linting
eslint src/
```

#### Docker
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild
docker compose up -d --build
```

---

## 📊 System Metrics

### Performance Targets
- API response time: < 200ms (p95)
- Frontend load time: < 2s
- AI summarization: < 5s per note
- Database queries: < 50ms

### Scalability
- Concurrent users: 100+ (current setup)
- Notes per day: 10,000+
- Database size: 100GB+
- Horizontal scaling ready (stateless API)

### Monitoring (Recommended)
- **Application**: Sentry, DataDog
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack or CloudWatch
- **Uptime**: Pingdom, UptimeRobot

---

## 🎯 Future Architecture Enhancements

### Planned Improvements
1. **Microservices**: Split AI services into separate containers
2. **Enhanced Monitoring**: Add Prometheus/Grafana for advanced metrics
3. **Caching Layer**: Redis caching for frequent queries
4. **CDN**: CloudFront for static assets
5. **WebSockets**: Real-time updates for collaborative features
6. **GraphQL**: Alternative API layer for complex queries

### Security Enhancements
1. **MFA**: Multi-factor authentication
2. **SSO**: SAML/OAuth integration
3. **Encryption**: Field-level encryption for sensitive data
4. **Rate Limiting**: API throttling
5. **WAF**: Web Application Firewall

---

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/)
- [LangChain Documentation](https://python.langchain.com/)

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Maintainers**: Sakshi Asati, Sukriti Sehgal
