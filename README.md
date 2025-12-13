# 🤖 Chatbot IA Premium V4.1.1

Sistema avanzado de chatbot con IA que combina **búsqueda semántica RAG**, **generación de respuestas con múltiples proveedores de IA**, y un **editor LaTeX inteligente** con copiloto. Optimizado para eficiencia con formato **TOON** que reduce el uso de tokens en un 30-60%.

![Version](https://img.shields.io/badge/version-4.1.1-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Tests](https://img.shields.io/badge/tests-60+-brightgreen)

---

## 🐳 Inicio Rápido con Docker (Recomendado)

¡Levanta todo el sistema (Frontend, Backend, Base de Datos, Redis, Workers, Ollama) en minutos!

1.  **Clonar el repositorio**
    ```bash
    git clone <url-del-repo>
    cd chatbot-ia-premium-V4.1
    ```

2.  **Configurar variables de entorno**
    Crea un archivo `.env` en la raíz:
    ```env
    POSTGRES_USER=admin
    POSTGRES_PASSWORD=tu_password_seguro
    POSTGRES_DB=chatbot_db
    JWT_SECRET_KEY=tu_clave_jwt_de_32_caracteres_minimo
    ENCRYPTION_KEY=tu_clave_encriptacion_api_keys
    CORS_ORIGINS=http://localhost:3000
    ```

3.  **Ejecutar Docker Compose**
    ```bash
    docker-compose up --build -d
    ```

4.  **Ejecutar migraciones de base de datos**
    ```bash
    docker-compose exec backend alembic upgrade head
    ```

5.  **Acceder a la Aplicación**
    - 🖥️ **Frontend**: [http://localhost:3000](http://localhost:3000)
    - ⚙️ **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

6.  **(Opcional) Descargar modelos locales para uso sin API**
    ```bash
    docker exec chatbot_ollama ollama pull llama3.2:3b
    ```

---

## 🆕 Novedades v4.1

### 🔐 Seguridad Mejorada
- **Encriptación de API Keys**: Las claves se almacenan encriptadas con Fernet (AES-128-CBC + PBKDF2)
- **Refresh Tokens con Rotación**: Access tokens de 30 min + refresh tokens de 7 días
- **Detección de Reutilización**: Si un refresh token se usa más de una vez, se revocan todas las sesiones
- **Auditoría Completa**: Registro de acciones sensibles (login, cambios de rol, eliminaciones)
- **Rate Limiting Inteligente**: Límites diferenciados por usuario (anónimo/autenticado/admin)

### 🛠️ Infraestructura
- **Alembic**: Migraciones de base de datos versionadas
- **Logging Estructurado**: JSON en producción, coloreado en desarrollo
- **OpenAPI Mejorada**: Documentación completa con tags y ejemplos
- **Connection Pooling**: Pool de conexiones optimizado con pre-ping
- **Error Handling Centralizado**: Respuestas de error consistentes

### ⚡ Frontend Optimizado
- **Componentes Modulares**: chat-layout y copilot-editor divididos en componentes reutilizables
- **Custom Hooks**: Lógica extraída a hooks como `useChatState`
- **Auto-Refresh de Tokens**: Renovación automática antes de expirar
- **Error Boundaries**: Captura de errores con UI de fallback amigable

---

## 🤖 Proveedores de IA Soportados

| Proveedor | Modelos | ¿Necesita API Key? |
|-----------|---------|-------------------|
| **Google Gemini** | gemini-2.5-flash, gemini-1.5-pro | ✅ [Obtener Key](https://aistudio.google.com/app/apikey) |
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | ✅ [Obtener Key](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | claude-3-5-sonnet, claude-3-haiku | ✅ [Obtener Key](https://console.anthropic.com/settings/keys) |
| **Local (Ollama)** | llama3.2:3b, llama3.1:8b, mistral:7b | ❌ Gratis - Corre localmente |

### 🏠 Modelo Local (Sin API Key)

El modo local usa **Ollama** para ejecutar modelos de IA directamente en tu servidor:

- 🆓 **Gratis**: Sin costos de API
- 🔒 **Privado**: Los datos nunca salen de tu servidor
- ♾️ **Sin límites**: Sin restricciones de tokens

**Requisitos:** RAM 8GB+ | CPU 4+ cores | GPU opcional (8GB+ VRAM)

---

## ✨ Características Principales

### 🔍 Sistema RAG Avanzado
- **Búsqueda Híbrida**: Semántica (embeddings) + Palabras clave (PostgreSQL FTS)
- **Re-ranking Inteligente**: CrossEncoder para mejorar relevancia
- **Embeddings**: Modelo `all-MiniLM-L6-v2` optimizado
- **Filtrado por Fuentes**: Búsqueda en documentos seleccionados

### 💬 Chat Inteligente & Multi-Proveedor
- **4 Proveedores de IA**: Gemini, OpenAI, Anthropic o Local
- **Preguntas Sugeridas**: Generación automática al cargar documentos
- **Formato TOON**: Reduce consumo de tokens en **30-60%**
- **Búsqueda de Imágenes**: Incluye imágenes de internet en respuestas

### 📝 Editor LaTeX con Copiloto (IDE Premium)
- **Monaco Editor**: El mismo motor que VS Code
- **Acciones Contextuales IA**: Clic derecho para mejorar, traducir o corregir
- **9 Plantillas Profesionales**: Artículos, tesis, CV, cartas, informes
- **Compilación en Tiempo Real**: Vista previa PDF instantánea

### 👤 Gestión de Usuarios
- **JWT + Refresh Tokens**: Autenticación segura con rotación
- **Panel de Administración**: Gestión de roles, usuarios, documentos
- **API Keys Encriptadas**: Almacenamiento seguro con Fernet
- **Auditoría**: Log de todas las acciones sensibles

### 🎨 Sistema de Temas Premium
- **6 Temas**: Oscuro, Claro, Rojo Pasión, Alto Contraste, Matrix, Vintage

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (3000)                  │
│                      Next.js 15                     │
└───────────────────────────┬─────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────┐
│                    Backend (8000)                   │
│                      FastAPI                        │
└──────┬────────────┬────────────┬────────────┬───────┘
       │            │            │            │
   ┌───▼───┐   ┌────▼────┐  ┌────▼────┐  ┌───▼────┐
   │  DB   │   │  Redis  │  │ Celery  │  │ Ollama │
   │ 5432  │   │  6379   │  │ Worker  │  │ 11434  │
   └───────┘   └─────────┘  └─────────┘  └────────┘
   PostgreSQL                              LLM Local
   + pgvector
```

### Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── dependencies.py      # Singleton injection (SearchEngine, Embeddings)
│   ├── exception_handlers.py # Error handling centralizado
│   ├── rate_limiter.py      # Rate limiting por usuario/rol
│   ├── routers/             # Endpoints (auth, chat, docs, admin)
│   └── schemas.py           # Pydantic models
├── services/
│   ├── ai_providers.py      # Abstracción multi-proveedor
│   ├── auth_service.py      # JWT + Refresh tokens
│   ├── audit_service.py     # Auditoría de acciones
│   └── search_engine.py     # Motor de búsqueda RAG
├── database/
│   └── models.py            # SQLAlchemy models
├── utils/
│   ├── encryption.py        # Encriptación Fernet
│   └── toon_encoder.py      # Formato TOON
├── alembic/                 # Migraciones de BD
└── tests/                   # Tests unitarios (60+)

frontend-react/
├── src/
│   ├── app/                 # App Router (Pages)
│   ├── components/
│   │   ├── chat/            # Chat + Header + Layout
│   │   ├── copilot/         # Editor + Dialogs + Preview
│   │   └── ui/              # Shadcn/UI + ErrorBoundary
│   ├── context/
│   │   └── auth-context.tsx # Auth + Refresh tokens
│   └── lib/
│       ├── api-client.ts    # Cliente API tipado
│       └── hooks/           # Custom hooks
```

---

## 🔧 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `POSTGRES_USER` | Usuario PostgreSQL | ✅ |
| `POSTGRES_PASSWORD` | Password PostgreSQL | ✅ |
| `POSTGRES_DB` | Nombre de la BD | ✅ |
| `JWT_SECRET_KEY` | Clave para firmar JWTs | ✅ |
| `ENCRYPTION_KEY` | Clave para encriptar API keys | ✅ |
| `CORS_ORIGINS` | Orígenes permitidos | ✅ |
| `GEMINI_API_KEY` | API key por defecto (opcional) | ❌ |
| `ENVIRONMENT` | `production` para logs JSON | ❌ |
| `DB_POOL_SIZE` | Conexiones base del pool (default: 10) | ❌ |
| `DB_MAX_OVERFLOW` | Conexiones extra bajo carga (default: 20) | ❌ |
| `DB_POOL_TIMEOUT` | Timeout para obtener conexión (default: 30s) | ❌ |

---

## 🚀 Instalación Manual (Desarrollo)

### Requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (con extensión `vector`)
- Redis

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configurar .env
alembic upgrade head  # Ejecutar migraciones
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# En otra terminal
celery -A celery_worker.celery_app worker --loglevel=info
```

### Frontend
```bash
cd frontend-react
npm install
npm run dev
```

---

## 📖 Uso

### 1. Configurar Proveedor de IA
1. Registra una cuenta o inicia sesión
2. Selecciona tu proveedor (Gemini, OpenAI, Anthropic o Local)
3. Ingresa tu API key siguiendo las instrucciones

### 2. Cargar Documentos
- Sube archivos PDF, TXT o DOCX
- El sistema procesa y genera embeddings automáticamente
- Verás preguntas sugeridas al terminar

### 3. Chat con tus Datos
- Pregunta sobre el contenido de tus documentos
- Usa filtros para limitar la búsqueda a archivos específicos

### 4. Modo Copiloto (LaTeX)
- Cambia a la pestaña "Copiloto"
- Usa clic derecho para invocar asistencia IA
- Compila y previsualiza en tiempo real

---

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

Tests incluidos (**60+ tests**):

| Archivo | Propósito | Tests |
|---------|-----------|-------|
| `test_ai_providers.py` | Proveedores de IA | ~15 |
| `test_search_engine.py` | Motor de búsqueda RAG | ~12 |
| `test_auth.py` | Autenticación y tokens | ~10 |
| `test_encryption.py` | Encriptación de API keys | 18 |
| `test_audit_service.py` | Auditoría de acciones | 20+ |
| `test_chat.py` | Endpoints de chat | ~8 |
| `test_pdf_processor.py` | Procesamiento de PDFs | ~5 |

---

## 🔐 Seguridad

### Tokens
- **Access Token**: 30 minutos de duración
- **Refresh Token**: 7 días, se rota en cada uso
- **Detección de robo**: Reutilización revoca toda la familia de tokens

### Encriptación
- **API Keys**: Fernet (AES-128-CBC) con PBKDF2 y 480,000 iteraciones
- **Passwords**: BCrypt con salt automático

### Auditoría
Todas estas acciones quedan registradas:
- Login/Logout
- Cambios de API key
- Modificaciones de usuarios por admin
- Eliminación de documentos

---

## 🛠️ Comandos Útiles

```bash
# Ver logs del backend
docker-compose logs backend -f

# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "descripcion"

# Limpiar tokens expirados (ejecutar periódicamente)
docker-compose exec backend python -c "from services.auth_service import cleanup_expired_tokens; from database.connection import SessionLocal; cleanup_expired_tokens(SessionLocal())"
```

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!
1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.