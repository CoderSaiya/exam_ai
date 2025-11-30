# Troubleshooting Guide - ExamAI

## 🔍 Common Issues and Solutions

### Backend Issues

#### ❌ Error: "n8n service unavailable"

**Symptoms:**
```
Error: n8n returned 503: Service Unavailable
```

**Causes:**
1. n8n is not running
2. Webhook URL is incorrect
3. Firewall blocking connection

**Solutions:**

✅ **Check n8n is running:**
```bash
# If using Docker
docker ps | grep n8n

# If using npm
ps aux | grep n8n
```

✅ **Verify webhook URL:**
```bash
# Check appsettings.json
cat backend/appsettings.json | grep WebhookUrl

# Should be:
"WebhookUrl": "http://localhost:5678/webhook/generate-questions"
```

✅ **Test webhook directly:**
```bash
curl -X POST http://localhost:5678/webhook/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test","numberOfQuestions":1,"difficulty":"Easy"}'
```

---

#### ❌ Error: "Invalid Signature" or "Authorization Failed"

**Symptoms:**
```
Error: 401 Unauthorized or 403 Forbidden
```

**Causes:**
1. Google Gemini API key is missing or invalid
2. Credentials not set in n8n workflow

**Solutions:**

✅ **Check API key in n8n:**
1. Open n8n at http://localhost:5678
2. Open workflow
3. Click "Generate Questions" node
4. Click "Credentials" → Check if API key is set
5. Test the credentials

✅ **Regenerate API key:**
1. Go to https://ai.google.dev/
2. Create new API key
3. Update in n8n credentials

---

#### ❌ Error: "Failed to parse questions JSON"

**Symptoms:**
```
Error: Failed to parse n8n response JSON: Unexpected token...
Raw: [truncated response]
```

**Causes:**
1. Gemini returns markdown code fences
2. Response is malformed JSON
3. Parse JSON node has bugs

**Solutions:**

✅ **Check raw response in n8n:**
1. Open n8n workflow
2. Click "Generate Questions" node
3. View "Output" tab
4. Look at `content.parts[0].text`

✅ **Fix Parse JSON node:**
- Ensure it handles ```json fences
- Check regex is correct: `/```json\s*([\s\S]*?)```/i`
- See [WORKFLOW.md](./WORKFLOW.md) for correct code

✅ **Update prompt to prevent fences:**
Add to prompt:
```
Return ONLY a JSON array. NO markdown code blocks. NO extra text.
```

---

### Frontend Issues

#### ❌ Error: "Network Error" or "Cannot connect to server"

**Symptoms:**
- Frontend shows "Error generating questions"
- Console shows `net::ERR_CONNECTION_REFUSED`

**Causes:**
1. Backend is not running
2. Wrong API URL in `.env.local`
3. CORS not configured

**Solutions:**

✅ **Check backend is running:**
```bash
curl http://localhost:5000/health
# Should return: 200 OK
```

✅ **Verify API URL:**
```bash
# Check .env.local
cat frontend/.env.local
# Should have:
NEXT_PUBLIC_API_URL=http://localhost:5000
```

✅ **Check CORS in backend:**
In `Program.cs`:
```csharp
app.UseCors("AllowFrontend");
```

---

#### ❌ Frontend shows "Loading..." forever

**Symptoms:**
- Clicked "Generate Questions"
- Loading spinner never stops
- No error message

**Causes:**
1. Request is hanging
2. Backend/n8n crashed
3. Timeout not set

**Solutions:**

✅ **Check browser console:**
- Press F12
- Go to "Network" tab
- Look for failed requests

✅ **Test backend directly:**
```bash
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test","numberOfQuestions":1,"difficulty":"Easy"}'
```

✅ **Add timeout to frontend:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

fetch(url, {
  signal: controller.signal,
  // ...
});
```

---

### n8n Workflow Issues

#### ❌ Workflow returns off-topic questions

**Symptoms:**
- Request topic: "World History"
- Response questions: About DevOps, programming, etc.

**Causes:**
1. Using wrong model (`gemini-2.0-flash` instead of `gemini-2.5-pro`)
2. Temperature too high
3. Prompt not strong enough

**Solutions:**

✅ **Use gemini-2.5-pro:**
```json
{
  "modelId": {
    "value": "models/gemini-2.5-pro"
  }
}
```

✅ **Set strict parameters:**
```json
{
  "options": {
    "temperature": 0,
    "topP": 0.1,
    "topK": 1
  }
}
```

✅ **Strengthen prompt:**
- Add explicit examples (see [WORKFLOW.md](./WORKFLOW.md))
- Add "NOT ABOUT" section
- Repeat topic name multiple times

---

#### ❌ Workflow returns only 1 question

**Symptoms:**
- Request: `numberOfQuestions: 5`
- Response: Only 1 question

**Causes:**
1. Parse JSON returns wrong format
2. Prompt doesn't emphasize quantity
3. Model ignores instruction

**Solutions:**

✅ **Fix Parse JSON return:**
Should return:
```javascript
return [
  {
    json: {
      questions: questions, // Array of all questions
    },
  },
];
```

NOT:
```javascript
return questions.map(q => ({ json: q })); // ❌ Wrong!
```

✅ **Emphasize quantity in prompt:**
```
Generate EXACTLY {{ $json.numberOfQuestions }} questions
```

---

#### ❌ Workflow execution fails

**Error in n8n:**
```
Workflow execution failed: Error in node 'Generate Questions'
```

**Causes:**
1. API key quota exceeded
2. Gemini API is down
3. Invalid model name

**Solutions:**

✅ **Check API quota:**
- Go to https://console.cloud.google.com/
- Check Gemini API usage
- Wait for quota reset or upgrade plan

✅ **Check Gemini API status:**
- Visit https://status.cloud.google.com/
- Look for Gemini AI incidents

✅ **Verify model name:**
```
models/gemini-2.5-pro ✅ Correct
models/gemini-pro ❌ Wrong (old version)
gemini-2.5-pro ❌ Wrong (missing "models/")
```

---

### Docker Issues

#### ❌ Error: "Port already in use"

**Symptoms:**
```
Error: bind: address already in use
```

**Causes:**
- Port 5000, 3000, or 5678 is occupied

**Solutions:**

✅ **Find and kill process:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

✅ **Change port in docker-compose:**
```yaml
services:
  backend:
    ports:
      - "5001:5000" # Use 5001 instead
```

---

#### ❌ Error: "Cannot connect to n8n from backend"

**Symptoms:**
```
Error: getaddrinfo ENOTFOUND localhost
```

**Causes:**
- Services in Docker can't use `localhost`

**Solutions:**

✅ **Use Docker service names:**
```json
{
  "N8n": {
    "WebhookUrl": "http://n8n:5678/webhook/generate-questions"
  }
}
```

✅ **Or use host.docker.internal:**
```json
{
  "N8n": {
    "WebhookUrl": "http://host.docker.internal:5678/webhook/generate-questions"
  }
}
```

---

## 🐛 Debugging Tips

### Enable Verbose Logging

**Backend (appsettings.json):**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
```

**Frontend (next.config.ts):**
```typescript
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};
```

**n8n:**
Set environment variable:
```bash
N8N_LOG_LEVEL=debug
```

---

### Inspect Network Requests

**Browser DevTools:**
1. Press F12
2. Go to "Network" tab
3. Filter by "Fetch/XHR"
4. Click on request
5. View "Payload" and "Response"

**cURL with verbose:**
```bash
curl -v -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test","numberOfQuestions":1,"difficulty":"Easy"}'
```

---

## 📊 Performance Issues

### Slow Response Times

**Symptoms:**
- Requests take > 30 seconds
- Timeout errors

**Causes:**
1. Too many questions requested
2. Gemini API slow
3. Network latency

**Solutions:**

✅ **Limit questions per request:**
```typescript
// In frontend validation
if (numberOfQuestions > 10) {
  alert("Maximum 10 questions per request");
  return;
}
```

✅ **Add loading indicator:**
```typescript
const [loading, setLoading] = useState(false);
// Show progress: "Generating question 1/5..."
```

✅ **Use faster model:**
- `gemini-2.5-flash` (faster but less accurate)
- `gemini-2.5-pro` (slower but more accurate)

---

## 🆘 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check logs (backend, frontend, n8n)
3. ✅ Test each component separately
4. ✅ Try with minimal example

### Where to Get Help

- **GitHub Issues**: [github.com/CoderSaiya/exam_ai/issues](https://github.com/CoderSaiya/exam_ai/issues)
- **Discussions**: [github.com/CoderSaiya/exam_ai/discussions](https://github.com/CoderSaiya/exam_ai/discussions)

### When Reporting Issues

Include:
- ✅ Error message (full stack trace)
- ✅ Steps to reproduce
- ✅ OS and versions (.NET, Node.js, Docker)
- ✅ Log files
- ✅ What you've already tried

Example:
```
**Environment:**
- OS: Windows 11
- .NET: 8.0.0
- Node.js: 20.10.0
- Docker: 24.0.6

**Issue:**
Getting "Failed to parse JSON" error

**Steps to reproduce:**
1. Start all services with docker-compose
2. Call API with topic "Python"
3. Error occurs

**Logs:**
[Attach backend/n8n logs]

**What I tried:**
- Checked API key ✅
- Restarted services ✅
- Tested webhook directly ❌ (same error)
```

---

## 📚 Related Documentation

- [Setup Guide](./SETUP.md) - Initial setup instructions
- [API Documentation](./API.md) - API reference
- [Workflow Guide](./WORKFLOW.md) - n8n workflow details
