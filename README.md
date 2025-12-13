# 🤖 Chatbot IA con Copiloto LaTeX

<div align="center">

Sistema avanzado de chatbot con IA que combina **búsqueda semántica RAG**, **generación de respuestas con múltiples proveedores de IA**, y un **editor LaTeX inteligente** con copiloto.

![Version](https://img.shields.io/badge/version-4.1.1-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Tests](https://img.shields.io/badge/tests-60+-brightgreen)

[🚀 Inicio Rápido](#-inicio-rápido-con-docker) • [📖 Documentación](#-características-principales) • [🔧 Instalación Manual](#-instalación-manual-desarrollo) • [❓ FAQ](#-preguntas-frecuentes)

</div>

---

## 📋 Tabla de Contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [Inicio Rápido con Docker](#-inicio-rápido-con-docker)
- [Instalación Manual](#-instalación-manual-desarrollo)
- [Proveedores de IA](#-proveedores-de-ia-soportados)
- [Características Principales](#-características-principales)
- [Arquitectura](#-arquitectura)
- [Variables de Entorno](#-variables-de-entorno)
- [Guía de Uso](#-guía-de-uso)
- [Testing](#-testing)
- [Seguridad](#-seguridad)
- [Monitoreo](#-monitoreo-y-métricas)
- [Resolución de Problemas](#-resolución-de-problemas)
- [Preguntas Frecuentes](#-preguntas-frecuentes)

---

## 🎯 ¿Qué es este proyecto?

Este es un **chatbot inteligente** diseñado para consultar documentos académicos usando tecnología RAG (Retrieval-Augmented Generation). Incluye:

- **Chat con tus documentos**: Sube PDFs, Word, TXT y haz preguntas sobre su contenido
- **Editor LaTeX con IA**: Escribe documentos académicos con asistencia de IA
- **Múltiples proveedores de IA**: Usa Gemini, OpenAI, Claude, o modelos locales gratuitos
- **100% privado**: Opción de ejecutar todo localmente sin enviar datos a la nube

### ¿Para quién es?

- 📚 **Estudiantes**: Consulta tus apuntes y libros con IA
- 🎓 **Investigadores**: Analiza papers y genera bibliografía
- ✍️ **Académicos**: Escribe artículos LaTeX con copiloto IA

---

## 🚀 Inicio Rápido con Docker

> **💡 Recomendado**: Docker levanta automáticamente todos los servicios necesarios.

### Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose
- 8 GB de RAM mínimo (16 GB recomendado para modelo local)
- 10 GB de espacio en disco

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/chatbot-ia-latex.git
cd chatbot-ia-latex
```

### Paso 2: Configurar Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto:

```bash
# Windows (PowerShell)
New-Item -ItemType File -Name ".env"

# Linux/Mac
touch .env
```

Copia y pega este contenido en el archivo `.env`:

```env
# ============================================
# CONFIGURACIÓN DE BASE DE DATOS
# ============================================
POSTGRES_USER=admin
POSTGRES_PASSWORD=MiPasswordSeguro123!
POSTGRES_DB=chatbot_db

# ============================================
# SEGURIDAD (¡IMPORTANTE! Genera claves únicas)
# ============================================
# Para generar una clave segura, ejecuta:
# python -c "import secrets; print(secrets.token_hex(32))"

JWT_SECRET_KEY=CAMBIA_ESTO_genera_una_clave_de_64_caracteres_xxxxxxxxx
ENCRYPTION_KEY=CAMBIA_ESTO_otra_clave_diferente_de_64_caracteres_xxxxx

# ============================================
# CORS (Orígenes permitidos)
# ============================================
CORS_ORIGINS=http://localhost:3000

# ============================================
# PROVEEDOR DE IA POR DEFECTO (Opcional)
# ============================================
# Si quieres usar un proveedor en la nube por defecto:
# GEMINI_API_KEY=tu_api_key_de_gemini

# ============================================
# PRODUCCIÓN (Opcional)
# ============================================
# ENVIRONMENT=production
```

> ⚠️ **Importante**: Genera claves seguras únicas para `JWT_SECRET_KEY` y `ENCRYPTION_KEY`. Ejecuta este comando para generar cada una:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### Paso 3: Levantar los Servicios

```bash
# Construir e iniciar todos los contenedores
docker-compose up --build -d
```

Este comando inicia:
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend | 3000 | Interfaz web Next.js |
| Backend | 8000 | API FastAPI |
| PostgreSQL | 5432 | Base de datos con pgvector |
| Redis | 6379 | Cache y cola de tareas |
| Celery | - | Worker para tareas asíncronas |
| Ollama | 11434 | Modelos IA locales (opcional) |

### Paso 4: Inicializar la Base de Datos

```bash
# Ejecutar migraciones de la base de datos
docker-compose exec backend alembic upgrade head
```

### Paso 5: Verificar la Instalación

1. **Frontend**: Abre [http://localhost:3000](http://localhost:3000)
2. **API Docs**: Abre [http://localhost:8000/docs](http://localhost:8000/docs)
3. **Health Check**: Abre [http://localhost:8000/health](http://localhost:8000/health)

Deberías ver:
```json
{"status": "healthy", "version": "4.1.1"}
```

### Paso 6: (Opcional) Configurar Modelo Local

Si quieres usar IA **sin API key** (100% gratis y privado):

```bash
# Descargar modelo Llama 3.2 (3B parámetros, ~2GB)
docker exec chatbot_ollama ollama pull llama3.2:3b

# Para equipos con más RAM (8B parámetros, mejor calidad)
docker exec chatbot_ollama ollama pull llama3.1:8b
```

### ✅ ¡Listo!

Ahora puedes:
1. Abrir [http://localhost:3000](http://localhost:3000)
2. Crear una cuenta
3. Subir documentos PDF, DOCX o TXT
4. ¡Empezar a chatear con tus documentos!

---

## 🔧 Instalación Manual (Desarrollo)

Para desarrolladores que quieren modificar el código.

### Requisitos

| Software | Versión | Instalación |
|----------|---------|-------------|
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/) |
| Redis | 7+ | [redis.io](https://redis.io/download/) |

> **Nota Windows**: Para PostgreSQL necesitas instalar la extensión `pgvector`:
> ```sql
> CREATE EXTENSION vector;
> ```

### Backend

```bash
# 1. Navegar al directorio backend
cd backend

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno virtual
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Configurar variables de entorno
# Crea un archivo .env en /backend con las mismas variables

# 6. Ejecutar migraciones
alembic upgrade head

# 7. Iniciar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

En otra terminal, inicia el worker de Celery:

```bash
cd backend
.venv\Scripts\activate  # Activar entorno virtual
celery -A celery_worker.celery_app worker --loglevel=info --pool=solo
```

### Frontend

```bash
# 1. Navegar al directorio frontend
cd frontend-react

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en [http://localhost:3000](http://localhost:3000)

---

## 🤖 Proveedores de IA Soportados

| Proveedor | Modelos Disponibles | ¿Necesita API Key? | Costo |
|-----------|---------------------|-------------------|-------|
| **Google Gemini** | gemini-2.5-flash, gemini-1.5-pro | ✅ [Obtener](https://aistudio.google.com/app/apikey) | Gratis con límites |
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | ✅ [Obtener](https://platform.openai.com/api-keys) | Pago por uso |
| **Anthropic Claude** | claude-3-5-sonnet, claude-3-haiku | ✅ [Obtener](https://console.anthropic.com/settings/keys) | Pago por uso |
| **Local (Ollama)** | llama3.2:3b, llama3.1:8b, mistral:7b | ❌ | **Gratis** |

### 🏠 Modelo Local (Recomendado para Privacidad)

El modo local usa **Ollama** para ejecutar modelos de IA directamente en tu computadora:

| Ventaja | Descripción |
|---------|-------------|
| 💰 **Gratis** | Sin costos de API |
| 🔒 **Privado** | Los datos nunca salen de tu equipo |
| ♾️ **Sin límites** | Sin restricciones de tokens |
| 🌐 **Offline** | Funciona sin internet |

#### Requisitos de Hardware para Modelo Local

| Modelo | RAM Mínima | RAM Recomendada | GPU (Opcional) |
|--------|-----------|-----------------|----------------|
| llama3.2:3b | 8 GB | 16 GB | 4 GB VRAM |
| llama3.1:8b | 16 GB | 32 GB | 8 GB VRAM |
| mistral:7b | 16 GB | 32 GB | 8 GB VRAM |

---

## ✨ Características Principales

### 🔍 Sistema RAG Avanzado
- **Búsqueda Híbrida**: Combina búsqueda semántica (embeddings) + palabras clave
- **Re-ranking Inteligente**: CrossEncoder para mejorar relevancia
- **Caché de 2 Capas**: LRU en memoria + Redis para máximo rendimiento
- **Filtrado por Fuentes**: Busca solo en documentos seleccionados

### 💬 Chat Inteligente
- **4 Proveedores de IA**: Elige el que mejor se adapte a tus necesidades
- **Preguntas Sugeridas**: Generación automática al cargar documentos
- **Formato TOON**: Reduce consumo de tokens en **30-60%**
- **Historial de Conversación**: Contexto mantenido entre preguntas

### 📝 Editor LaTeX con Copiloto
- **Monaco Editor**: El mismo motor que VS Code
- **9 Plantillas Profesionales**: Artículos, tesis, CV, cartas, informes
- **Acciones Contextuales IA**: Clic derecho para mejorar, traducir o corregir
- **Compilación en Tiempo Real**: Vista previa PDF instantánea

### 🔐 Seguridad Empresarial
- **JWT + Refresh Tokens**: Rotación automática cada 30 minutos
- **Encriptación AES-256**: API keys encriptadas en base de datos
- **Rate Limiting por Rol**: Límites diferenciados (anónimo/user/admin)
- **Auditoría Completa**: Log de todas las acciones sensibles

### 🎨 Experiencia de Usuario
- **6 Temas Visuales**: Oscuro, Claro, Rojo Pasión, Alto Contraste, Matrix, Vintage
- **Drag & Drop**: Arrastra archivos para subirlos
- **Responsive**: Funciona en desktop y tablet

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Puerto 3000)                  │
│                         Next.js 15                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│   │    Chat     │  │   Copilot   │  │      Admin      │    │
│   │   Layout    │  │   Editor    │  │     Panel       │    │
│   └─────────────┘  └─────────────┘  └─────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                     BACKEND (Puerto 8000)                   │
│                         FastAPI                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│   │  Auth   │  │  Chat   │  │  Docs   │  │   Admin     │   │
│   │ Router  │  │ Router  │  │ Router  │  │   Router    │   │
│   └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│        └────────────┴────────────┴──────────────┘          │
│                         │                                   │
│   ┌─────────────────────▼─────────────────────────────┐    │
│   │                  SERVICIOS                         │    │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │    │
│   │  │ AI Prov. │  │  Search  │  │    Embeddings    │ │    │
│   │  │ Manager  │  │  Engine  │  │     (Cached)     │ │    │
│   │  └──────────┘  └──────────┘  └──────────────────┘ │    │
│   └───────────────────────────────────────────────────┘    │
└───────┬────────────┬────────────┬─────────────┬────────────┘
        │            │            │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │   DB    │  │  Redis  │  │ Celery  │  │ Ollama  │
   │  5432   │  │  6379   │  │ Worker  │  │  11434  │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘
   PostgreSQL     Cache        Async       LLM Local
   + pgvector    + Queue       Tasks
```

### Estructura de Archivos

```
📦 chatbot-ia-latex/
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── main.py              # Punto de entrada FastAPI
│   │   ├── metrics.py           # Métricas Prometheus
│   │   ├── rate_limiter.py      # Rate limiting por rol
│   │   └── 📁 routers/          # Endpoints API
│   ├── 📁 services/
│   │   ├── ai_providers.py      # Multi-proveedor IA
│   │   ├── search_engine.py     # Motor RAG
│   │   └── embedding_system.py  # Embeddings con caché
│   ├── 📁 database/
│   │   └── models.py            # Modelos SQLAlchemy
│   ├── 📁 tests/                # 60+ tests unitarios
│   └── requirements.txt
│
├── 📁 frontend-react/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 chat/         # Componentes de chat
│   │   │   ├── 📁 copilot/      # Editor LaTeX
│   │   │   └── 📁 ui/           # Componentes Shadcn
│   │   ├── 📁 lib/
│   │   │   ├── api-client.ts    # Cliente API con retry
│   │   │   └── schemas.ts       # Validación Zod
│   │   └── 📁 context/
│   │       └── auth-context.tsx # Autenticación
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔐 Variables de Entorno

### Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `admin` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `MiPassword123!` |
| `POSTGRES_DB` | Nombre de la base de datos | `chatbot_db` |
| `JWT_SECRET_KEY` | Clave para firmar JWTs (mín. 32 chars) | Generada con `secrets.token_hex(32)` |
| `ENCRYPTION_KEY` | Clave para encriptar API keys | Generada con `secrets.token_hex(32)` |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | `http://localhost:3000` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | API key de Gemini por defecto | - |
| `ENVIRONMENT` | `production` para logs JSON | `development` |
| `DB_POOL_SIZE` | Conexiones base del pool | `10` |
| `DB_MAX_OVERFLOW` | Conexiones extra bajo carga | `20` |
| `DB_POOL_TIMEOUT` | Timeout para obtener conexión | `30` |

---

## 📖 Guía de Uso

### 1. Crear Cuenta e Iniciar Sesión

1. Abre [http://localhost:3000](http://localhost:3000)
2. Haz clic en "Registrarse"
3. Ingresa tu email y contraseña
4. ¡Listo! Ya puedes usar la aplicación

### 2. Configurar Proveedor de IA

1. Una vez logueado, verás un diálogo para configurar tu proveedor
2. Elige una opción:
   - **Local (Ollama)**: Gratis, sin API key necesaria
   - **Gemini/OpenAI/Claude**: Requiere API key
3. Si eliges un proveedor en la nube, sigue las instrucciones para obtener tu API key

### 3. Subir Documentos

1. Haz clic en "📤 Subir" en el sidebar izquierdo
2. Arrastra tus archivos o haz clic para seleccionar
3. Formatos soportados: **PDF, DOCX, TXT, PPTX**
4. Espera a que se procesen (verás una barra de progreso)
5. Al terminar, aparecerán preguntas sugeridas

### 4. Chatear con tus Documentos

1. Escribe tu pregunta en la caja de texto inferior
2. Presiona Enter o el botón de enviar
3. La IA buscará en tus documentos y responderá
4. Puedes ver las fuentes expandiendo "Ver Fuente"

### 5. Usar el Editor LaTeX

1. Cambia a la pestaña "Copiloto" en el header
2. Usa las plantillas predefinidas o escribe desde cero
3. **Acciones IA**: Selecciona texto y haz clic derecho para:
   - Mejorar redacción
   - Traducir
   - Corregir gramática
   - Generar citas
4. Haz clic en "Vista Previa" para ver el PDF compilado

---

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
```

### Tests Incluidos (60+)

| Archivo | Descripción | # Tests |
|---------|-------------|---------|
| `test_ai_providers.py` | Proveedores de IA | ~15 |
| `test_search_engine.py` | Motor de búsqueda RAG | ~12 |
| `test_auth.py` | Autenticación y tokens | ~10 |
| `test_encryption.py` | Encriptación de API keys | 18 |
| `test_audit_service.py` | Auditoría de acciones | 20+ |
| `test_chat.py` | Endpoints de chat | ~8 |
| `test_pdf_processor.py` | Procesamiento de PDFs | ~5 |

---

## 🔒 Seguridad

### Autenticación

| Componente | Configuración |
|------------|---------------|
| **Access Token** | Expira en 30 minutos |
| **Refresh Token** | Expira en 7 días, se rota en cada uso |
| **Detección de robo** | Reutilización revoca toda la familia de tokens |

### Encriptación

| Dato | Método |
|------|--------|
| **Contraseñas** | BCrypt con salt automático |
| **API Keys** | Fernet (AES-128-CBC) + PBKDF2 (480,000 iteraciones) |

### Auditoría

Todas estas acciones quedan registradas:
- ✅ Login/Logout
- ✅ Cambios de API key
- ✅ Modificaciones de usuarios por admin
- ✅ Eliminación de documentos
- ✅ Errores de autenticación

---

## 📊 Monitoreo y Métricas

### Endpoints de Operaciones

| Endpoint | Descripción |
|----------|-------------|
| `GET /health` | Estado del servicio |
| `GET /metrics` | Métricas Prometheus |

### Métricas Disponibles

```bash
# Ver métricas
curl http://localhost:8000/metrics
```

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `chatbot_requests_total` | Counter | Total de requests por endpoint |
| `chatbot_request_duration_seconds` | Histogram | Latencia de requests |
| `chatbot_ai_requests_total` | Counter | Requests a proveedores IA |
| `chatbot_ai_tokens_total` | Counter | Tokens consumidos |
| `chatbot_documents_processed_total` | Counter | Documentos procesados |
| `chatbot_cache_operations_total` | Counter | Hits/misses de caché |

---

## 🛠️ Comandos Útiles

### Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs backend -f

# Reiniciar un servicio específico
docker-compose restart backend

# Parar todos los servicios
docker-compose down

# Parar y eliminar volúmenes (¡borra datos!)
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache
```

### Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "descripcion"

# Ver historial de migraciones
docker-compose exec backend alembic history
```

### Mantenimiento

```bash
# Limpiar tokens expirados
docker-compose exec backend python -c "
from services.auth_service import cleanup_expired_tokens
from database.connection import SessionLocal
cleanup_expired_tokens(SessionLocal())
"
```

---

## 🐛 Resolución de Problemas

### El frontend no carga

```bash
# Verificar que el contenedor está corriendo
docker-compose ps

# Ver logs del frontend
docker-compose logs frontend -f

# Reiniciar frontend
docker-compose restart frontend
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps db

# Ver logs de la base de datos
docker-compose logs db -f

# Verificar que las migraciones se ejecutaron
docker-compose exec backend alembic current
```

### El modelo local no responde

```bash
# Verificar que Ollama está corriendo
docker exec chatbot_ollama ollama list

# Descargar modelo si no existe
docker exec chatbot_ollama ollama pull llama3.2:3b

# Ver logs de Ollama
docker-compose logs ollama -f
```

### Error "Rate limit exceeded"

Espera un minuto o inicia sesión para aumentar tu límite:
- Anónimo: 30 req/min
- Autenticado: 100 req/min
- Admin: 1000 req/min

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar la app sin API key?

**Sí**, usando el modo Local (Ollama). Es 100% gratis y privado.

### ¿Qué formatos de documentos soporta?

PDF, DOCX, TXT y PPTX.

### ¿Mis datos están seguros?

Sí. Si usas el modo local, tus datos nunca salen de tu computadora. Las API keys se almacenan encriptadas.

### ¿Funciona offline?

Solo con el modo Local (Ollama). Los proveedores en la nube requieren internet.

### ¿Cuántos documentos puedo subir?

Sin límite técnico. El rendimiento depende de tu hardware.

### ¿Puedo usarlo en producción?

Sí, pero recomendamos:
1. Usar HTTPS (nginx/traefik)
2. Cambiar las claves secretas
3. Configurar backups de la base de datos
4. Monitorear con las métricas Prometheus

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

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

<div align="center">

**¿Te fue útil?** ⭐ Dale una estrella al repositorio

Hecho con ❤️ usando FastAPI, Next.js y mucha IA

</div>
