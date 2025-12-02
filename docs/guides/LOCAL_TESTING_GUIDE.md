# 🧪 Local Testing Guide

## ✅ Note Viewing Fix Applied

### What Was Fixed:
1. **Doctor Dashboard (ClinicalNotesTab)**: When clicking a note, now fetches full note content if missing
2. **Nurse Dashboard**: When clicking a note, now fetches full note content if missing
3. Both dashboards now properly display note content in the detail modal

### Changes Made:
- Both `handleViewNote` and `handleViewNurseNote` functions now call `api.getNote(note.id)` to fetch full note details
- Full content, summary, risk_level, and recommendations are properly populated
- Note detail modal will always show the complete note content

---

## 🚀 Start the Application Locally

### 1. Start Backend (Terminal 1)
```bash
cd /Users/sukritisehgal/secure-med-notes-ai
source .venv/bin/activate
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend URL**: http://localhost:8000

**API Docs**: http://localhost:8000/docs (Interactive Swagger UI)

### 2. Start Frontend (Terminal 2)
```bash
cd /Users/sukritisehgal/secure-med-notes-ai/frontend
npm run dev
```

**Frontend URL**: http://localhost:5173

---

## 🔑 Login Credentials

Check the file: `/Users/sukritisehgal/secure-med-notes-ai/LOGIN_CREDENTIALS.txt`

**Default Test Users**:
- **Doctor**: 
  - Email: `doctor@example.com`
  - Password: `doctor123`
  
- **Nurse**:
  - Email: `nurse@example.com`
  - Password: `nurse123`

---

## 🧪 Test Note Viewing Fix

### For Doctor:
1. Open http://localhost:5173 in your browser
2. Login as doctor (doctor@example.com / doctor123)
3. Go to **"Clinical Notes"** tab
4. Click on any note in the **Notes Library**
5. ✅ **Verify**: The modal opens and shows:
   - Note title, patient name, author, date
   - AI Summary (if available) with risk level
   - **Full note content** (not "No content available")

### For Nurse:
1. Login as nurse (nurse@example.com / nurse123)
2. On the main dashboard, scroll to **"Recent Notes"** section
3. Click on any note
4. ✅ **Verify**: The modal opens and shows:
   - Note title, patient name, author, date
   - AI Summary (if available)
   - **Full note content** (not "No content available")

---

## 🎯 Test All AI Features

### 1. AI Note Summarization
- **Doctor**: Go to Clinical Notes → Click "Generate with AI" → Enter chief complaint → See AI-generated note
- **Nurse**: Click "Add Note with AI" button → Fill form → See AI-generated nursing note

### 2. Patient Timeline with AI
- Go to **"AI & Analytics"** tab
- Click **"Patient Timeline"** button
- Select any patient from the grid
- ✅ **Verify**: 
  - AI-generated patient journey summary appears
  - Complete timeline of visits and appointments
  - Risk levels displayed for each note

### 3. High-Risk Patients
- In **"AI & Analytics"** tab
- Click **"High-Risk Patients"** button
- Click **"Refresh"** to analyze
- ✅ **Verify**: List of high-risk patients with risk scores

### 4. AI Summary Dashboard
- In **"AI & Analytics"** tab
- Default **"AI Summary"** view shows:
  - Number of AI-analyzed notes
  - High-risk cases count
  - Recent AI-analyzed notes with summaries
  - Patient visit history grid

---

## 🔍 Debugging Tips

### Check Backend Logs:
```bash
# In the terminal where backend is running, watch for:
# - API calls: GET /notes/{id}
# - AI calls: POST /ai/summarize/{note_id}/sync
# - Timeline calls: GET /ai/patient-timeline/{patient_id}
```

### Check Frontend Console:
- Open browser DevTools (F12)
- Go to Console tab
- Look for any errors or API call failures

### Test API Directly:
Open http://localhost:8000/docs and try:
- `GET /notes/{note_id}` - Should return full note with content
- `GET /notes` - Should return list of notes with content field
- `POST /ai/summarize/{note_id}/sync` - Test AI summarization
- `GET /ai/patient-timeline/{patient_id}` - Test patient timeline

---

## 🌐 Production URLs (Already Deployed)

**Backend**: https://mednotes-backend-957293469884.us-central1.run.app

**Frontend**: https://mednotes-frontend-957293469884.us-central1.run.app

**Health Check**: https://mednotes-backend-957293469884.us-central1.run.app/health

---

## 📊 Database Connection

**PostgreSQL Cloud SQL**:
- Host: 34.132.36.69
- Database: mednotes
- Port: 5432

**Redis Memorystore**:
- Host: 10.66.24.147
- Port: 6379

---

## ✅ Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login as doctor
- [ ] Can login as nurse
- [ ] Doctor: Click note in Notes Library → Modal shows full content ✅
- [ ] Nurse: Click note in Recent Notes → Modal shows full content ✅
- [ ] AI Summary generates successfully
- [ ] Patient Timeline displays with AI summary
- [ ] High-Risk Patients loads correctly
- [ ] All AI & Analytics tabs work

---

## 🎉 Success Indicators

### ✅ Note Viewing Working:
- Clicking any note opens a modal
- Modal displays full note content (not "No content available")
- AI summary section shows if available
- Risk level badge displays correctly
- Recommendations show if available

### ✅ AI Features Working:
- OpenAI API key is configured in .env
- AI note generation works (doctor & nurse)
- Patient timeline generates AI summary
- High-risk patient analysis works
- All AI endpoints respond successfully

---

## 🆘 Common Issues

### Issue: "No content available" still showing
**Solution**: Check that `api.getNote(note.id)` is being called and returns content field

### Issue: AI Summary not generating
**Solution**: Verify OpenAI API key in .env file: `OPENAI_API_KEY=sk-...`

### Issue: Backend connection error
**Solution**: 
1. Check backend is running on port 8000
2. Verify VITE_API_BASE_URL in frontend/.env
3. Check CORS settings in backend

### Issue: Database connection error
**Solution**: Verify PostgreSQL credentials in .env and Cloud SQL proxy is running

---

## 🚀 Ready to Deploy?

After local testing is successful:

```bash
# Deploy backend
cd /Users/sukritisehgal/secure-med-notes-ai
gcloud builds submit --config cloudbuild-backend.yaml --project=securemed-ai

# Deploy frontend
gcloud builds submit --config cloudbuild-frontend.yaml --project=securemed-ai
```

---

**Happy Testing! 🎉**

**Primary Local Testing URL**: http://localhost:5173
