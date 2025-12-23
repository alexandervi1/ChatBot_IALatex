# AGENT_CONTEXT.md - Chatbot IA Premium V4.1

> **Contexto para Agentes de IA:** Este archivo contiene toda la información técnica, arquitectónica y de negocio necesaria para trabajar en el proyecto "Chatbot IA Premium". Úsalo como tu "Verdad Fuente" (Source of Truth).

---

## 1. Identidad del Proyecto
**Nombre:** Chatbot IA Premium V4.1 (RAG Académico)
**Propósito:** Asistente conversacional avanzado capaz de responder preguntas sobre documentos PDF (inicialmente libros de IA) utilizando una arquitectura RAG (Retrieval-Augmented Generation) con búsqueda híbrida y re-ranking.
**Estado Actual:** Producción / V4.1 (Estable, Seguro, Dockerizado).

---

## 2. Tech Stack (Pila Tecnológica)

### Frontend
- **Framework:** Next.js 15 (App Router).
- **Lenguaje:** TypeScript.
- **UI:** Tailwind CSS + Radix UI + Lucide Icons.
- **Estado:** React Context (AuthContext, ChatContext).
- **Renderizado de Chat:** Streaming de texto + Markdown + LaTeX (KaTeX).
- **Core:** React 19.

### Backend
- **Framework:** FastAPI (Python 3.11+).
- **Asincronía:** Uso extensivo de `async/await`.
- **ORM:** SQLAlchemy 2.0 (AsyncSession).
- **Seguridad:** JWT (Auth), Fernet (API Keys), BCrypt (Passwords).

### Datos e IA
- **Base de Datos:** PostgreSQL 16 + extensión `pgvector`.
- **Cache:** Redis 7 (Rate Limiting + Embeddings Cache).
- **Embeddings:** `sentence-transformers/all-MiniLM-L6-v2` (Local, Dim: 384).
- **Re-Ranking:** `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- **LLM Providers:**
    - Google Gemini (Principal).
    - Anthropic / OpenAI (Integrados).

### Infraestructura
- **Docker:** `docker-compose.yml` orquesta 5 servicios (Frontend, Backend, DB, Cache).
- **Deploy:** Coolify (Self-hosted) o Servidores VPS.

---

## 3. Arquitectura del Sistema

### Pipeline RAG (Retrieval-Augmented Generation)
El corazón del sistema reside en `backend/app/services/search_engine.py`:

1.  **Ingesta:** PDF -> Texto -> RecursiveChunking (1000 chars) -> Vectorización.
2.  **Retrieval Híbrido:**
    *   *Semántico:* `pgvector` (Similitud Coseno) busca conceptos.
    *   *Keyword:* `BM25` (o similar) busca términos exactos.
3.  **Re-Ranking:** Los Top-50 candidatos pasan por un modelo *Cross-Encoder* que re-ordena por relevancia real pregunta-contexto.
4.  **Generación:** Se envían los Top-5 chunks al LLM con un "System Prompt" estricto para evitar alucinaciones.

### Base de Datos (Esquema Clave)
*   **Users:** `id`, `email`, `role`, `api_key_encrypted` (Fernet).
*   **Documents:** `id`, `owner_id` (Aislamiento), `filename`.
*   **Chunks:** `id`, `document_id`, `embedding` (VECTOR 384), `content`.
*   **Chats/Messages:** Historial persistente.

---

## 4. Estándares de Código y Reglas

### Backend (Python)
*   **Inyección de Dependencias:** Usar `Depends()` para servicios (`get_db`, `get_current_user`, `get_search_engine`).
*   **Manejo de Errores:** Nunca devolver 500 crudos. Usar `HTTPException` con detalles.
*   **Tipado:** Todo debe tener Type Hints (`def funcion(a: int) -> str:`).
*   **Logs:** Usar `logger` configurado, nunca `print()`.

### Frontend (React)
*   **Componentes:** Pequeños, atomicos, en `src/components`.
*   **Client vs Server:** Usar `"use client"` solo cuando sea necesario (interactividad).
*   **Errores:** Envolver zonas críticas con `<ErrorBoundary>`.

### Seguridad (CRÍTICO)
*   **JWT:** Nunca exponer el `JWT_SECRET_KEY`. Validar longitud mínima de 32 chars.
*   **Rate Limiting:** Activo por defecto en todos los endpoints (`@limiter.limit`).
*   **Auditoría:** Acciones sensibles (borrar docs, reset password) deben registrarse en `AuditService`.

---

## 5. Comandos de Desarrollo

```bash
# Levantar todo
docker-compose up -d --build

# Backend Logs
docker-compose logs -f backend

# Migraciones BD
docker-compose exec backend alembic upgrade head

# Test Backend
docker-compose exec backend pytest
```

---

## 6. Módulos Clave (Mapa de Archivos)

*   `backend/app/routers/chat.py`: Endpoint principal de chat y RAG.
*   `backend/app/services/search_engine.py`: Lógica de búsqueda híbrida.
*   `backend/app/services/auth_service.py`: Login, Registro y JWT.
*   `backend/database/connection.py`: Configuración de Pool de SQLAlchemy.
*   `frontend-react/src/components/chat/copilot-editor.tsx`: Editor con capacidades de IA.

---

> **Nota para el Agente:** Si vas a realizar cambios, primero verifica `task.md` para ver el estado actual y asegúrate de no romper la compatibilidad con el esquema de base de datos `pgvector` existente.
