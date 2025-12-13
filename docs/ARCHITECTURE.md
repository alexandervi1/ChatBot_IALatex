# 🏗️ Documentación de Arquitectura - Chatbot IA Premium V4.1

Esta documentación técnica está diseñada para ayudar a los desarrolladores a entender la estructura, el flujo de datos y el diseño del sistema rápidamente.

> **Nota:** Los diagramas a continuación están escritos en formato **PlantUML**. Puedes renderizarlos usando la extensión "PlantUML" en VS Code o copiando el código en [PlantText](https://www.planttext.com/).

---

## 1. Arquitectura de Alto Nivel (C4 Container)

Describe los contenedores principales y sus interacciones.

```plantuml
@startuml
!theme plain
title Arquitectura del Sistema Chatbot IA Premium V4.1

' Estilos
skinparam componentStyle uml2

actor "Estudiante / Usuario" as User
actor "Administrador" as Admin

package "Frontend (Client Side)" {
    component "Next.js App\n(React 19)" as Frontend {
        [Chat UI]
        [Copilot Editor]
        [Auth Provider]
    }
}

package "Backend (Server Side)" {
    component "API Gateway\n(FastAPI)" as API
    
    component "Core Services" {
        [Search Engine (RAG)] as Search
        [Auth Service] as AuthService
        [Audit Service] as Audit
    }
    
    component "Workers" {
        [Celery Worker] as Worker
    }
}

package "Data & Storage" {
    database "PostgreSQL\n(pgvector)" as DB
    database "Redis Cache" as Cache
}

package "External / AI Layer" {
    cloud "Google Gemini API" as Gemini
    component "Ollama (Local)" as Ollama
}

' Relaciones
User --> Frontend : HTTPS
Admin --> Frontend : HTTPS

Frontend --> API : REST / JSON (JWT)

API --> AuthService : Validate Token
API --> Search : Search Query
API --> Audit : Log Action

Search --> DB : Vector Similarity Search
Search --> Cache : Check/Set Embeddings
Search --> Gemini : Generate Answer
Search --> Ollama : Generate Answer (Local)

Worker ..> DB : Async Tasks (PDF Processing)

@enduml
```

---

## 2. Flujo de Datos: RAG Pipeline (Secuencia)

Detalla paso a paso cómo se procesa una pregunta del usuario hasta obtener una respuesta generada.

```plantuml
@startuml
!theme plain
autonumber
title Secuencia RAG: Pregunta -> Respuesta

actor Usuario
participant "API Endpoint" as API
participant "Search Engine" as Engine
participant "Vector DB" as DB
participant "Cross Encoder" as ReRanker
participant "LLM (Gemini/Ollama)" as AI

Usuario -> API: POST /chat/message\n{query: "¿Qué es IA?"}
activate API

API -> Engine: generate_answer(query)
activate Engine

group Retrieval (Recuperación)
    Engine -> Engine: create_embedding(query)
    
    par Parallel Search
        Engine -> DB: Semantic Search (Cosine Similarity)
        Engine -> DB: Keyword Search (BM25 / ts_rank)
    end
    
    DB --> Engine: Return Top-50 Candidates
end

group Re-Ranking (Refinamiento)
    Engine -> ReRanker: Predict(Query, Candidates)
    ReRanker --> Engine: Relevance Scores
    Engine -> Engine: Filter & Sort (Top-5)
end

group Generation (Generación)
    Engine -> Engine: Construct Prompt (Context + Query)
    Engine -> AI: Stream Response
    activate AI
    AI --> Engine: "La Inteligencia Artificial es..."
    Engine --> API: Stream Chunks
    API --> Usuario: Stream Response
    deactivate AI
end

deactivate Engine
deactivate API
@enduml
```

---

## 3. Modelo de Datos (Entity Relationship)

Esquema de la base de datos PostgreSQL, incluyendo las tablas para usuarios, documentos y vectores.

```plantuml
@startuml
!theme plain
hide circle
skinparam linetype ortho

entity "User" as user {
  *id : SERIAL [PK]
  --
  email : VARCHAR(255) [Unique]
  hashed_password : VARCHAR
  role : VARCHAR(50)
  gemini_api_key : VARCHAR [Encrypted]
  token_usage : INTEGER
}

entity "Document" as doc {
  *id : SERIAL [PK]
  --
  *owner_id : INTEGER [FK]
  filename : VARCHAR
  upload_date : TIMESTAMP
  file_size : INTEGER
}

entity "Chunk" as chunk {
  *id : SERIAL [PK]
  --
  *document_id : INTEGER [FK]
  content : TEXT
  embedding : VECTOR(384)
  chunk_metadata : JSONB
}

entity "Chat" as chat {
  *id : UUID [PK]
  --
  *user_id : INTEGER [FK]
  title : VARCHAR
  created_at : TIMESTAMP
}

entity "Message" as msg {
  *id : SERIAL [PK]
  --
  *chat_id : UUID [FK]
  role : VARCHAR(20) [user/ai]
  content : TEXT
  sources : JSONB
}

entity "RefreshToken" as token {
  *id : SERIAL [PK]
  --
  *user_id : INTEGER [FK]
  token_hash : VARCHAR
  expires_at : TIMESTAMP
  family_id : UUID
}

user ||..o{ doc : "owns"
user ||..o{ chat : "has"
user ||..o{ token : "has"

doc ||..o{ chunk : "contains"
chat ||..o{ msg : "contains"

@enduml
```

---

## 4. Diseño de Clases Backend (Simplificado)

Muestra las clases y servicios principales del backend para entender la lógica de negocio.

```plantuml
@startuml
!theme plain
title Diagrama de Clases Backend (Core Services)

class SearchEngine {
  - reranker : CrossEncoder
  + hybrid_search(query: str) : List[Chunk]
  + generate_answer(query: str, context: str) : Stream
  + generate_copilot_answer(instruction: str) : Stream
}

class PDFProcessor {
  + process_pdf(file: UploadFile) : List[Chunk]
  - clean_text(text: str) : str
  - create_chunks(text: str) : List[str]
}

class AuthService {
  + authenticate_user(email, password) : User
  + create_access_token(data: dict) : str
  + rotate_refresh_token(token: str) : str
}

class SecurityMiddleware {
  + dispatch(request, call_next) : Response
  - add_security_headers(response)
}

class ProviderFactory {
  {static} + get_provider(name: str) : AIProvider
}

interface AIProvider {
  + generate_stream(prompt: str) : AsyncGenerator
}

SearchEngine ..> ProviderFactory : uses
ProviderFactory --> AIProvider : creates
SearchEngine --> cross_encoder : uses
API_Router --> SearchEngine : injects
API_Router --> AuthService : injects

@enduml
```
