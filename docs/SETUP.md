# Setup Guide - ExamAI

## 📋 Prerequisites

### Required Software
- **.NET 8 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **n8n** (chạy qua Docker hoặc npm)

### Required API Keys
- **Google Gemini API Key** - [Get one here](https://ai.google.dev/)

---

## 🚀 Method 1: Docker Compose (Recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/CoderSaiya/exam_ai.git
cd exam_ai
```

### Step 2: Configure Environment
```bash
cd docker
cp .env.example .env
```

Edit `docker/.env`:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# n8n Configuration
N8N_PORT=5678
N8N_WEBHOOK_URL=http://localhost:5678

# Backend Configuration
BACKEND_PORT=5000

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 3: Start Services
```bash
docker compose up -d
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- n8n: http://localhost:5678

### Step 4: Import n8n Workflow
1. Open n8n at http://localhost:5678
2. Click **"Import from File"**
3. Select `n8n/workflow.json`
4. Click **"Save"** to activate workflow

### Step 5: Configure Credentials in n8n
1. Open the imported workflow
2. Click on **"Generate Questions"** node
3. Click **"Credentials"** → **"Create New"**
4. Name: `Google Gemini API`
5. API Key: Paste your Gemini API key
6. Click **"Save"**

### Step 6: Activate Workflow
Click the **"Active"** toggle in n8n to enable the workflow.

---

## 🔧 Method 2: Manual Setup

### Backend Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Update appsettings.json
cat > appsettings.json <<EOF
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "N8n": {
    "WebhookUrl": "http://localhost:5678/webhook/generate-questions"
  }
}
EOF

# Run backend
dotnet run
```

Backend will start at: http://localhost:5000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF

# Run frontend
npm run dev
```

Frontend will start at: http://localhost:3000

### n8n Setup

#### Option A: Run with Docker
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Option B: Run with npm
```bash
npm install -g n8n
n8n start
```

Then import workflow as described in Docker method above.

---

## ✅ Verification

### 1. Check Backend Health
```bash
curl http://localhost:5000/health
# Expected: 200 OK
```

### 2. Check n8n Workflow
```bash
curl -X POST http://localhost:5678/webhook/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test",
    "numberOfQuestions": 1,
    "difficulty": "Easy"
  }'
```

Expected response:
```json
{
  "questions": [
    {
      "id": 1,
      "text": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
```

### 3. Test End-to-End
```bash
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "World History",
    "numberOfQuestions": 5,
    "difficulty": "Easy"
  }'
```

### 4. Check Frontend
1. Open http://localhost:3000
2. Fill in the form:
   - Topic: "Python Programming"
   - Number: 5
   - Difficulty: Medium
3. Click "Generate Questions"
4. Questions should appear within 10 seconds

---

## 🐛 Troubleshooting

### n8n workflow returns 404
- **Cause**: Workflow not activated or webhook path incorrect
- **Fix**: 
  1. Check workflow is "Active" in n8n
  2. Verify webhook path in `appsettings.json`

### "Invalid API Key" error
- **Cause**: Gemini API key not configured or invalid
- **Fix**: 
  1. Check API key in n8n credentials
  2. Verify key is valid at https://ai.google.dev/

### Frontend cannot connect to backend
- **Cause**: CORS or wrong API URL
- **Fix**:
  1. Check `NEXT_PUBLIC_API_URL` in `.env.local`
  2. Verify backend has CORS enabled in `Program.cs`

### Questions are off-topic
- **Cause**: AI model parameters or prompt issue
- **Fix**:
  1. Check workflow uses `gemini-2.5-pro` (not 2.0-flash)
  2. Verify temperature=0, topP=0.1, topK=1
  3. See [WORKFLOW.md](./WORKFLOW.md) for prompt tuning

---

## 🔄 Updating

### Pull Latest Changes
```bash
git pull origin main
```

### Rebuild Docker Images
```bash
cd docker
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Update Dependencies

**Backend:**
```bash
cd backend
dotnet restore
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## 🛑 Stopping Services

### Docker Compose
```bash
cd docker
docker compose down
```

### Manual
- **Backend**: Press `Ctrl+C` in terminal
- **Frontend**: Press `Ctrl+C` in terminal
- **n8n**: `docker stop n8n` or `Ctrl+C`

---

## 📚 Next Steps

- [API Documentation](./API.md) - Learn about API endpoints
- [Workflow Guide](./WORKFLOW.md) - Customize n8n workflow
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
