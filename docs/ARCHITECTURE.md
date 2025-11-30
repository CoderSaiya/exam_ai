# System Architecture - ExamAI

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph Client
        A[Web Browser]
    end
    
    subgraph Frontend
        B[Next.js App]
        C[React Components]
        D[API Service]
    end
    
    subgraph Backend
        E[.NET WebAPI]
        F[ExamController]
        G[N8nService]
    end
    
    subgraph Workflow
        H[n8n]
        I[Webhook Node]
        J[Gemini Node]
        K[Parse Node]
    end
    
    subgraph External
        L[Google Gemini API]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> L
    L --> J
    J --> K
    K --> H
    H --> G
    G --> F
    F --> E
    E --> D
    D --> C
    C --> B
    B --> A
```

---

## 📦 Component Details

### Frontend Layer (Next.js)

**Technology Stack:**
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks (useState)

**Key Components:**

#### 1. TopicForm Component
```typescript
// Location: frontend/components/TopicForm.tsx
Purpose: User input form for exam generation
Responsibilities:
- Collect topic, quantity, difficulty
- Validate input
- Call API service
- Display loading state
```

#### 2. QuestionCard Component
```typescript
// Location: frontend/components/QuestionCard.tsx
Purpose: Display individual questions
Responsibilities:
- Render question text
- Display options as radio buttons
- Show correct answer when revealed
- Display explanation
```

#### 3. API Service
```typescript
// Location: frontend/services/api.ts
Purpose: HTTP client for backend
Responsibilities:
- POST /api/exam/generate
- Error handling
- Response parsing
```

**Data Flow:**
```
User Input → Form Validation → API Call → Loading State → Display Results
```

---

### Backend Layer (.NET)

**Technology Stack:**
- **Framework**: ASP.NET Core 8
- **Language**: C# 12
- **Web Server**: Kestrel
- **Serialization**: System.Text.Json

**Architecture Pattern:** Service-Oriented Architecture (SOA)

#### 1. Controller Layer
```csharp
// Location: backend/Controllers/ExamController.cs
Responsibility: HTTP Request handling
```

**Endpoints:**
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/exam/generate` | Generate exam questions |

#### 2. Service Layer
```csharp
// Location: backend/Services/N8nService.cs
Responsibility: Business logic and n8n communication
```

**Methods:**
| Method | Purpose |
|--------|---------|
| `GenerateQuestionsAsync()` | Call n8n webhook and parse response |

**HTTP Client Configuration:**
```csharp
services.AddHttpClient<IN8nService, N8nService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
});
```

#### 3. Model Layer
```csharp
// Location: backend/Models/ExamModels.cs
Classes:
- ExamRequest: Input DTO
- Question: Output DTO
```

---

### Workflow Layer (n8n)

**n8n Workflow Nodes:**

```mermaid
graph LR
    A[Webhook] -->|Request| B[Generate Questions]
    B -->|Gemini Response| C[Parse JSON]
    C -->|Validated| D[Respond]
    
    style A fill:#4CAF50
    style B fill:#2196F3
    style C fill:#FF9800
    style D fill:#9C27B0
```

#### Node 1: Webhook
- **Type**: HTTP Trigger
- **Method**: POST
- **Path**: `/webhook/generate-questions`
- **Input**: `{ topic, numberOfQuestions, difficulty }`

#### Node 2: Generate Questions (Google Gemini)
- **Type**: AI Model
- **Model**: gemini-2.5-pro
- **Parameters**:
  - Temperature: 0 (deterministic)
  - TopP: 0.1 (precision)
  - TopK: 1 (most probable)
- **Prompt**: Dynamic template with few-shot examples

#### Node 3: Parse JSON
- **Type**: Code (JavaScript)
- **Purpose**: 
  - Extract text from Gemini response
  - Remove markdown fences
  - Parse and validate JSON
  - Format for webhook response

#### Node 4: Respond to Webhook
- **Type**: HTTP Response
- **Format**: `{ questions: [...] }`

---

## 🔄 Data Flow Diagram

### Complete Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant N as n8n
    participant G as Gemini

    U->>F: Fill form & submit
    F->>F: Validate input
    F->>B: POST /api/exam/generate
    B->>B: Serialize request
    B->>N: POST /webhook/generate-questions
    N->>N: Extract parameters
    N->>G: Call Gemini API with prompt
    G->>G: Generate questions
    G->>N: Return text response
    N->>N: Parse JSON
    N->>B: Return { questions: [...] }
    B->>B: Deserialize & validate
    B->>F: Return Question[]
    F->>F: Update state
    F->>U: Display questions
```

**Timing Breakdown:**
1. User Input → Frontend: < 1ms
2. Frontend → Backend: 50-100ms
3. Backend → n8n: 20-50ms
4. n8n → Gemini: 50-100ms
5. Gemini Processing: 2-10 seconds (varies by question count)
6. Response path: 100-200ms
7. **Total**: 3-15 seconds

---

## 🗄️ Data Models

### Request Model (Frontend → Backend)
```typescript
interface ExamRequest {
  topic: string;          // 1-200 characters
  numberOfQuestions: number; // 1-20
  difficulty: 'Easy' | 'Medium' | 'Hard';
}
```

### Question Model (Backend → Frontend)
```typescript
interface Question {
  id: number;
  text: string;
  options: string[];      // Always 4 options
  correctAnswer: string;  // Must match one option
  explanation: string;
}
```

### Workflow Data (n8n Internal)
```json
{
  "body": {
    "topic": "World History",
    "numberOfQuestions": 5,
    "difficulty": "Easy"
  }
}
```

### Gemini Response (Raw)
```json
{
  "content": {
    "parts": [
      {
        "text": "[{\"id\":1,\"text \":\"...\",\"options\":[...],\"correctAnswer\":\"...\",\"explanation\":\"...\"}]"
      }
    ]
  }
}
```

---

## 🔒 Security Architecture

### Frontend Security
- **XSS Prevention**: React auto-escaping
- **CSRF**: Not applicable (stateless API)
- **Input Validation**: Client-side validation before API call

### Backend Security
- **CORS**: Configured for localhost:3000
- **Input Validation**: Model binding validation
- **Error Handling**: Sanitized error messages (no stack traces in production)

### n8n Security
- **API Key Storage**: n8n credentials manager
- **Webhook Security**: Consider adding authentication header
- **Rate Limiting**: Configure in n8n or reverse proxy

### External Services
- **Gemini API**: API key in environment variables
- **HTTPS**: Use in production for all external calls

---

## 📊 Scalability Considerations

### Current Limitations
- **Concurrent Requests**: Limited by n8n single-thread execution
- **Rate Limits**: Google Gemini API quotas
- **No Caching**: Every request hits Gemini

### Scaling Strategy

#### Horizontal Scaling
```mermaid
graph TB
    LB[Load Balancer]
    B1[Backend 1]
    B2[Backend 2]
    B3[Backend 3]
    N1[n8n Worker 1]
    N2[n8n Worker 2]
    
    LB --> B1
    LB --> B2
    LB --> B3
    B1 --> N1
    B2 --> N1
    B3 --> N2
    B1 --> N2
    B2 --> N2
    B3 --> N1
```

#### Caching Layer
```
Frontend → Backend → Redis Cache → n8n → Gemini
                        ↓
                   [Cache Hit: Return cached questions]
```

**Recommended Caching Strategy:**
- **Key**: `hash(topic + numberOfQuestions + difficulty)`
- **TTL**: 24 hours
- **Cache**: Redis or in-memory cache

---

## 🔧 Configuration Management

### Environment-Specific Configs

| Environment | Frontend | Backend | n8n |
|-------------|----------|---------|-----|
| **Development** | localhost:3000 | localhost:5000 | localhost:5678 |
| **Production** | example.com | api.example.com | n8n.example.com |

### Configuration Files

**Frontend:**
```
.env.local          # Local development
.env.production     # Production build
```

**Backend:**
```
appsettings.json            # Default
appsettings.Development.json # Dev overrides
appsettings.Production.json  # Prod settings
```

**n8n:**
```
docker/.env         # Docker Compose environment
```

---

## 📈 Monitoring & Logging

### Recommended Monitoring

**Frontend:**
- **Tool**: Vercel Analytics or Google Analytics
- **Metrics**: Page load time, API call success rate

**Backend:**
- **Tool**: Application Insights or Seq
- **Metrics**: Request duration, error rate, n8n call latency

**n8n:**
- **Built-in**: Execution history in UI
- **External**: Prometheus + Grafana

### Logging Structure

```csharp
// Backend logging
logger.LogInformation("Generating {Count} questions for topic: {Topic}", 
    request.NumberOfQuestions, 
    request.Topic);

logger.LogError(ex, "Failed to call n8n webhook: {Url}", webhookUrl);
```

---

## 🚀 Deployment Architecture

### Recommended Production Setup

```mermaid
graph TB
    subgraph "Cloud Provider (Azure/AWS)"
        subgraph "Frontend"
            CDN[CDN/CloudFront]
            STATIC[Static Hosting]
        end
        
        subgraph "Backend"
            ALB[Application Load Balancer]
            API1[API Instance 1]
            API2[API Instance 2]
        end
        
        subgraph "Workflow"
            N8N[n8n Container]
        end
        
        subgraph "External"
            GEMINI[Google Gemini API]
        end
    end
    
    CDN --> STATIC
    STATIC --> ALB
    ALB --> API1
    ALB --> API2
    API1 --> N8N
    API2 --> N8N
    N8N --> GEMINI
```

---

## 📚 References

- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [Workflow Guide](./WORKFLOW.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
