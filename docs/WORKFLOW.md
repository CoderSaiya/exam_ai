# n8n Workflow Guide - ExamAI

## 📖 Overview

Workflow n8n của ExamAI sử dụng Google Gemini API để tạo câu hỏi thi trắc nghiệm tự động. Workflow được thiết kế để:
- Nhận request từ backend API
- Gọi Google Gemini với prompt được tối ưu
- Parse và validate kết quả JSON
- Trả về câu hỏi cho backend

---

## 🔗 Workflow Architecture

```mermaid
graph LR
    A[Webhook] --> B[Generate Questions]
    B --> C[Parse JSON]
    C --> D[Respond to Webhook]
    
    style A fill:#4CAF50
    style B fill:#2196F3
    style C fill:#FF9800
    style D fill:#9C27B0
```

**Nodes:**
1. **Webhook** - Nhận POST request từ backend
2. **Generate Questions** - Gọi Google Gemini API
3. **Parse JSON** - Parse và validate response
4. **Respond to Webhook** - Trả kết quả về backend

---

## ⚙️ Node Configuration

### 1. Webhook Node

**Settings:**
- **HTTP Method**: POST
- **Path**: `generate-questions`
- **Response Mode**: Last Node
- **Webhook URL**: `http://localhost:5678/webhook/generate-questions`

**Expected Input:**
```json
{
  "topic": "World History",
  "numberOfQuestions": 5,
  "difficulty": "Easy"
}
```

---

### 2. Generate Questions Node

**Model Settings:**
- **Model**: `models/gemini-2.5-pro`
- **Temperature**: `0` (deterministic output)
- **Top P**: `0.1` (high precision)
- **Top K**: `1` (most probable token only)
- **Max Output Tokens**: `4096`

**Prompt Template:**

```
You are an EXAM QUESTION GENERATOR. Your ONLY job is to create exam questions about the EXACT topic specified.

═══════════════════════════════════════════════════════════
📌 TOPIC: "{{ $json.body.topic }}"
📊 QUANTITY: {{ $json.body.numberOfQuestions }} questions
📈 DIFFICULTY: {{ $json.body.difficulty }}
═══════════════════════════════════════════════════════════

🚨 CRITICAL RULES:
1. ALL questions MUST be about "{{ $json.body.topic }}" - NO EXCEPTIONS
2. If "{{ $json.body.topic }}" = "World History" → ask about wars, empires, civilizations
3. If "{{ $json.body.topic }}" = "Python" → ask about Python syntax, libraries, code
4. NEVER ask about unrelated topics (DevOps, Docker, etc.) unless that IS the topic

═══════════════════════════════════════════════════════════
📚 EXAMPLES (LEARN FROM THESE):
═══════════════════════════════════════════════════════════

EXAMPLE 1 - Topic: "World History"
✅ CORRECT:
{
  "id": 1,
  "text": "Which empire was known for its extensive road system?",
  "options": ["Roman Empire", "Ottoman Empire", "British Empire", "Mongol Empire"],
  "correctAnswer": "Roman Empire",
  "explanation": "The Roman Empire was famous for its roads."
}

❌ WRONG (This is about software, not history!):
{
  "text": "What is Docker used for?"
}

═══════════════════════════════════════════════════════════
📋 OUTPUT FORMAT (RETURN THIS EXACT STRUCTURE):
═══════════════════════════════════════════════════════════

Return ONLY a JSON array. NO markdown code blocks. NO extra text.

[
  {
    "id": 1,
    "text": "Question about {{ $json.body.topic }}",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "One of A/B/C/D",
    "explanation": "Why this is correct"
  }
]

⚠️ REMEMBER: If you generate even ONE question NOT about "{{ $json.body.topic }}", you FAILED.

Generate {{ $json.body.numberOfQuestions }} questions about "{{ $json.body.topic }}" now:
```

**Why This Prompt Works:**
- ✅ **Clear role definition**: "EXAM QUESTION GENERATOR"
- ✅ **Explicit examples**: Shows correct vs wrong questions
- ✅ **Strict output format**: Demands JSON array only
- ✅ **Multiple validation steps**: Topic check at each question
- ✅ **Few-shot learning**: Concrete examples for AI to learn from

---

### 3. Parse JSON Node

**JavaScript Code:**

```javascript
// Lấy item đầu tiên từ node "Generate Questions"
let input = $input.first().json;

// Trường hợp input là mảng [ { ... } ]
if (Array.isArray(input)) {
  input = input[0];
}

let text = '';

// 1. Đúng format Gemini: content.parts[].text
if (input?.content?.parts && Array.isArray(input.content.parts)) {
  text = input.content.parts
    .map(p => p.text || '')
    .join('\n');
} else if (typeof input.text === 'string') {
  // fallback nếu node trả thẳng text
  text = input.text;
} else {
  // fallback cuối cùng
  text = JSON.stringify(input);
}

text = String(text).trim();

// 2. Bóc phần JSON nếu bị bọc trong ```json ... ```
const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i);
let jsonStr = (fenceMatch ? fenceMatch[1] : text).trim();

// 3. Parse thẳng, KHÔNG unescape thêm gì nữa
let questions;
try {
  questions = JSON.parse(jsonStr);
} catch (e) {
  throw new Error(
    'Failed to parse JSON from Gemini: ' +
    e.message +
    '\nRaw: ' +
    jsonStr.slice(0, 400)
  );
}

// 4. Đảm bảo là mảng
if (!Array.isArray(questions)) {
  throw new Error('Expected an array of questions.');
}

// 5. Trả về 1 item duy nhất chứa mảng questions
return [
  {
    json: {
      questions: questions,
    },
  },
];
```

**What It Does:**
1. Extracts text from Gemini response (handles multiple formats)
2. Removes markdown code fences if present
3. Parses JSON
4. Validates that result is an array
5. Returns formatted response for backend

---

### 4. Respond to Webhook Node

**Settings:**
- **Options**: Default (no special configuration)

**Output Format:**
```json
{
  "questions": [
    { "id": 1, "text": "...", ... },
    { "id": 2, "text": "...", ... }
  ]
}
```

---

## 🔧 Model Parameters Explained

### Temperature = 0
- **Purpose**: Deterministic output (same input → same output)
- **Effect**: AI always chooses the most probable token
- **Why**: Ensures consistency and reduces randomness

### Top P = 0.1
- **Purpose**: Nucleus sampling with 10% probability mass
- **Effect**: Only considers top 10% most likely tokens
- **Why**: Prevents AI from choosing unlikely/irrelevant words

### Top K = 1
- **Purpose**: Consider only THE most probable token
- **Effect**: Maximum determinism
- **Why**: Forces AI to stick to the most likely path

**Combined Effect:**
These 3 parameters work together to force the AI to:
- Stay strictly on topic
- Generate consistent questions
- Avoid creative deviations

---

## 🧪 Testing the Workflow

### Test 1: Basic Functionality

**Input (via Postman or cURL):**
```bash
curl -X POST http://localhost:5678/webhook/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python Programming",
    "numberOfQuestions": 3,
    "difficulty": "Easy"
  }'
```

**Expected Output:**
```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is the correct way to comment in Python?",
      "options": [
        "# This is a comment",
        "// This is a comment",
        "/* This is a comment */",
        "<!-- This is a comment -->"
      ],
      "correctAnswer": "# This is a comment",
      "explanation": "Python uses # for single-line comments."
    },
    {
      "id": 2,
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    },
    {
      "id": 3,
      "text": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}
```

### Test 2: Topic Relevance

Test with different topics to ensure AI stays on-topic:

```bash
# Test: World History
curl -X POST http://localhost:5678/webhook/generate-questions \
  -d '{"topic":"World History","numberOfQuestions":5,"difficulty":"Medium"}'

# Test: JavaScript
curl -X POST http://localhost:5678/webhook/generate-questions \
  -d '{"topic":"JavaScript","numberOfQuestions":5,"difficulty":"Hard"}'
```

**Verify:**
- ✅ All questions are about the specified topic
- ✅ No questions about unrelated topics (e.g., DevOps for World History)

---

## 🔍 Debugging

### View Execution Data

In n8n:
1. Click on **any node**
2. Click **"Output"** tab
3. View raw JSON data

### Common Debug Points

**After "Generate Questions" node:**
- Check `output.content.parts[0].text` for raw AI response
- Verify it's valid JSON array
- Look for markdown code fences

**After "Parse JSON" node:**
- Check `questions` array length
- Verify each question has all required fields
- Check data types (id = number, options = array, etc.)

---

## 🚫 Common Issues

### Issue 1: Questions are off-topic

**Symptoms:**
- Topic = "World History"
- Questions about DevOps, programming, etc.

**Causes:**
1. Using `gemini-2.0-flash` instead of `gemini-2.5-pro`
2. Temperature > 0
3. TopK > 1

**Fix:**
```json
{
  "modelId": "models/gemini-2.5-pro",
  "options": {
    "temperature": 0,
    "topP": 0.1,
    "top K": 1
  }
}
```

### Issue 2: Parse JSON fails

**Error:**
```
Failed to parse JSON from Gemini: Unexpected token...
```

**Causes:**
1. Gemini returns markdown code fences
2. JSON is malformed
3. Response is not an array

**Fix:**
- Check the "Parse JSON" code handles fence removal
- Verify regex: `/```json\s*([\s\S]*?)```/i`
- Add error logging to see raw response

### Issue 3: Only 1 question returned

**Symptoms:**
- Request: `numberOfQuestions: 5`
- Response: Only 1 question

**Causes:**
1. Prompt doesn't emphasize quantity
2. AI ignores the number parameter

**Fix:**
- Ensure prompt repeats: `"Generate {{ $json.numberOfQuestions }} questions"`
- Check examples show multiple questions

---

## 📊 Performance Optimization

### Current Performance
- **1-5 questions**: 3-5 seconds
- **6-10 questions**: 5-8 seconds
- **11-20 questions**: 8-15 seconds

### Optimization Tips

1. **Use gemini-2.5-pro** instead of 2.0-flash
   - More accurate
   - Better at following instructions

2. **Set maxOutputTokens appropriately**
   - Too low → incomplete responses
   - Too high → slower processing
   - Recommended: 4096

3. **Cache common topics** (future enhancement)
   - Store frequently requested topics
   - Return cached results
   - Reduce API calls

---

## 🔐 Security

### API Key Protection

**DO NOT:**
- ❌ Commit API keys to git
- ❌ Share workflow JSON with credentials
- ❌ Hardcode keys in prompts

**DO:**
- ✅ Use n8n credentials manager
- ✅ Set credentials per environment
- ✅ Rotate keys regularly

### Webhook Security

Consider adding:
- **Authentication**: Header-based auth
- **Rate Limiting**: Limit requests per IP
- **Input Validation**: Check topic length, number range

---

## 📚 Related Documentation

- [Setup Guide](./SETUP.md) - Initial workflow setup
- [API Documentation](./API.md) - Backend API integration
- [Troubleshooting](./TROUBLESHOOTING.md) - Solve common issues
