# API Documentation - ExamAI

## Base URL
```
http://localhost:5000
```

---

## 📝 Endpoints

### Generate Questions

Generate exam questions using AI based on topic, quantity, and difficulty.

#### Request

```http
POST /api/exam/generate
Content-Type: application/json
```

**Body:**
```json
{
  "topic": "string",
  "numberOfQuestions": "integer",
  "difficulty": "string"
}
```

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `topic` | string | ✅ Yes | Subject or topic for questions | Min: 1 char, Max: 200 chars |
| `numberOfQuestions` | integer | ✅ Yes | Number of questions to generate | Min: 1, Max: 20 |
| `difficulty` | string | ✅ Yes | Question difficulty level | "Easy", "Medium", or "Hard" |

#### Response

**Success (200 OK)**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "Which empire controlled most of Europe in 27 BC?",
      "options": [
        "Roman Empire",
        "Ottoman Empire",
        "British Empire",
        "Mongol Empire"
      ],
      "correctAnswer": "Roman Empire",
      "explanation": "The Roman Empire began in 27 BC and controlled most of Europe for centuries."
    },
    {
      "id": 2,
      "text": "When did World War II end?",
      "options": [
        "1943",
        "1944",
        "1945",
        "1946"
      ],
      "correctAnswer": "1945",
      "explanation": "World War II ended in 1945 with Germany surrendering in May and Japan in September."
    }
  ]
}
```

**Error Responses:**

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 Bad Request | Invalid input parameters | `{ "error": "Invalid request: ..." }` |
| 500 Internal Server Error | n8n workflow error or AI failure | `{ "error": "Failed to generate questions: ..." }` |
| 503 Service Unavailable | n8n service is down | `{ "error": "n8n service unavailable" }` |

---

## 📖 Examples

### Example 1: Generate Easy Questions

**Request:**
```bash
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python Programming",
    "numberOfQuestions": 5,
    "difficulty": "Easy"
  }'
```

**Response:**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is the correct way to print 'Hello World' in Python?",
      "options": [
        "print('Hello World')",
        "echo 'Hello World'",
        "console.log('Hello World')",
        "printf('Hello World')"
      ],
      "correctAnswer": "print('Hello World')",
      "explanation": "In Python, the built-in print() function is used to output text."
    }
  ]
}
```

### Example 2: Generate Hard Questions

**Request:**
```bash
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Data Structures and Algorithms",
    "numberOfQuestions": 10,
    "difficulty": "Hard"
  }'
```

### Example 3: Vietnamese Topic

**Request:**
```bash
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Lịch sử Việt Nam",
    "numberOfQuestions": 8,
    "difficulty": "Medium"
  }'
```

---

## 🔍 Request Models

### ExamRequest

```csharp
public class ExamRequest
{
    public string Topic { get; set; }
    public int NumberOfQuestions { get; set; }
    public string Difficulty { get; set; }
}
```

**Validation Rules:**
- `Topic`: Required, length 1-200 characters
- `NumberOfQuestions`: Required, range 1-20
- `Difficulty`: Required, must be "Easy", "Medium", or "Hard" (case-insensitive)

---

## 📦 Response Models

### Question

```csharp
public class Question
{
    public int Id { get; set; }
    public string Text { get; set; }
    public List<string> Options { get; set; }
    public string CorrectAnswer { get; set; }
    public string Explanation { get; set; }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Sequential question number (1-indexed) |
| `text` | string | The question text |
| `options` | string[] | Array of 4 answer options (A, B, C, D) |
| `correctAnswer` | string | The correct answer (must match one option exactly) |
| `explanation` | string | Explanation of why the answer is correct |

---

## ⚙️ Configuration

### Backend (appsettings.json)

```json
{
  "N8n": {
    "WebhookUrl": "http://localhost:5678/webhook/generate-questions"
  }
}
```

### Environment Variables

```env
ASPNETCORE_URLS=http://localhost:5000
ASPNETCORE_ENVIRONMENT=Development
```

---

## 🔒 Security Considerations

### CORS

The API allows requests from:
- `http://localhost:3000` (Frontend)
- Configure additional origins in `Program.cs`

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

### Rate Limiting

> **Note**: Currently no rate limiting is implemented. Consider adding rate limiting for production use.

Recommended libraries:
- **AspNetCoreRateLimit**
- **Microsoft.AspNetCore.RateLimiting** (.NET 7+)

---

## 📊 Performance

### Response Times

| Number of Questions  | Avg Response Time | Max Response Time |
|---------------------|-------------------|-------------------|
| 1-5 questions       | 3-5 seconds       | 8 seconds         |
| 6-10 questions      | 5-8 seconds       | 12 seconds        |
| 11-20 questions     | 8-15 seconds      | 20 seconds        |

> **Note**: Response time depends on:
> - Google Gemini API latency
> - n8n processing time
> - Network conditions

### Caching

Currently no caching is implemented. For production:
- Consider caching common topics
- Use Redis or in-memory cache
- Cache for 1-24 hours depending on use case

---

## 🧪 Testing

### Manual Testing with cURL

```bash
# Test 1: Valid request
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Math","numberOfQuestions":3,"difficulty":"Easy"}'

# Test 2: Invalid difficulty
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Math","numberOfQuestions":3,"difficulty":"VeryHard"}'

# Test 3: Too many questions
curl -X POST http://localhost:5000/api/exam/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Math","numberOfQuestions":50,"difficulty":"Easy"}'
```

### Testing with Postman

1. Import collection from `backend/ExamAI.API.http`
2. Select "Generate Questions" request
3. Modify body parameters
4. Click "Send"

---

## 🐛 Common Errors

### 400 Bad Request
```json
{
  "error": "Invalid request: numberOfQuestions must be between 1 and 20"
}
```
**Fix**: Ensure `numberOfQuestions` is within valid range.

### 500 Internal Server Error
```json
{
  "error": "n8n returned 500: Workflow execution failed"
}
```
**Fix**: Check n8n workflow is active and credentials are configured.

### 503 Service Unavailable
```json
{
  "error": "n8n service unavailable"
}
```
**Fix**: Ensure n8n is running and webhook URL is correct.

---

## 📚 Related Documentation

- [Setup Guide](./SETUP.md) - How to set up the API
- [Workflow Guide](./WORKFLOW.md) - Configure n8n workflow
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
