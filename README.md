# 🤖 Chatbot IA con Copiloto LaTeX

<div align="center">

Sistema avanzado de chatbot con IA que combina **búsqueda semántica RAG**, **generación de respuestas con múltiples proveedores de IA**, y un **editor LaTeX inteligente** con copiloto.

![Version](https://img.shields.io/badge/version-4.2.0-blue)
![Python](https://img.shields.io/badge/python-3.11+-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Tests](https://img.shields.io/badge/tests-80+-brightgreen)

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
- **Múltiples proveedores de IA**: Usa Gemini, OpenAI, Claude o **modelos locales con Ollama**
- **Privacidad**: Datos encriptados y seguridad empresarial

### ¿Para quién es?

- 📚 **Estudiantes**: Consulta tus apuntes y libros con IA
- 🎓 **Investigadores**: Analiza papers y genera bibliografía
- ✍️ **Académicos**: Escribe artículos LaTeX con copiloto IA

---

## 🚀 Inicio Rápido con Docker

> **💡 Recomendado**: Docker levanta automáticamente todos los servicios necesarios.

### Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose
- 8 GB de RAM mínimo
- 10 GB de espacio en disco

### Paso 1: Clonar el Repositorio

#### Opción A: Usando Terminal (Git)

```bash
git clone https://github.com/tu-usuario/chatbot-ia-latex.git
cd chatbot-ia-latex
```

#### Opción B: Usando GitHub Desktop (Más Fácil)

Si prefieres una interfaz gráfica:

1. **Descarga GitHub Desktop** (si no lo tienes):
   - Ve a [desktop.github.com](https://desktop.github.com/)
   - Descarga e instala la aplicación

2. **Clonar el repositorio**:
   - Abre GitHub Desktop
   - Ve a **File → Clone Repository** (o presiona `Ctrl+Shift+O`)
   - Selecciona la pestaña **URL**
   - Pega esta URL:
     ```
     https://github.com/tu-usuario/chatbot-ia-latex.git
     ```
   - Elige la carpeta donde quieres guardarlo (ej: `C:\Proyectos\`)
   - Haz clic en **Clone**

3. **Abrir en terminal**:
   - Una vez clonado, haz clic derecho en el repositorio
   - Selecciona **Open in Command Prompt** o **Open in PowerShell**
   - Ya estás listo para continuar con el Paso 2

> 💡 **Tip**: GitHub Desktop también te permite ver cambios, hacer commits y sincronizar sin usar comandos.


### Paso 2: Configurar Variables de Entorno

El proyecto incluye un archivo `.env.example` listo para usar. Solo necesitas copiarlo y generar las claves de seguridad:

```bash
# Windows (PowerShell)
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

**Genera las claves de seguridad** (ejecuta este comando **2 veces**, una para cada clave):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Edita el archivo `.env`** y reemplaza estas dos líneas con las claves que generaste:

```env
JWT_SECRET_KEY=PEGA_AQUI_LA_PRIMERA_CLAVE_GENERADA
ENCRYPTION_KEY=PEGA_AQUI_LA_SEGUNDA_CLAVE_GENERADA
```

> ✅ **¡Eso es todo!** Las demás variables ya tienen valores predeterminados que funcionan.

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
{"status": "healthy", "version": "4.2.0"}
```

### Paso 6: Crear Super Admin

Para acceder al panel de administración (`/admin`), necesitas crear un usuario con rol de administrador:

```bash
# Ejecutar script de creación de admin dentro del contenedor
docker-compose exec backend python create_admin.py
```

El script te pedirá:
1. **Email**: correo del administrador
2. **Password**: contraseña segura

> 💡 Si el usuario ya existe, el script te preguntará si deseas actualizarlo a admin.

Una vez creado, podrás acceder a:
- **Panel de Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Funcionalidades**: Dashboard con gráficos, gestión de usuarios, logs, documentos, configuración del sistema

### ✅ ¡Listo!

Ahora puedes:
1. Abrir [http://localhost:3000](http://localhost:3000)
2. Crear una cuenta
3. Subir documentos PDF, DOCX o TXT
4. ¡Empezar a chatear con tus documentos!

### 🔒 Notas de Seguridad

La configuración por defecto incluye:
- **Puertos internos**: PostgreSQL y Redis solo son accesibles dentro de Docker
- **Logging**: Rotación automática de logs (máx. 50MB por servicio)
- **Usuario no-root**: Los contenedores ejecutan como usuario sin privilegios

> 💡 Para acceso externo a la DB (desarrollo), descomenta los puertos en `docker-compose.yml`

### 💾 Backup de Base de Datos

```powershell
# Windows - Crear backup
.\backup-db.ps1

# Windows - Restaurar
.\backup-db.ps1 -Restore ".\backups\backup_20231223.sql"
```

```bash
# Linux/Mac - Crear backup
./backup-db.sh

# Linux/Mac - Restaurar
./backup-db.sh --restore ./backups/backup_20231223.sql.gz
```

Los backups se guardan en `./backups/` y se mantienen los últimos 7 automáticamente.

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

### Crear Super Admin (Sin Docker)

En el modo de desarrollo manual, ejecuta el script directamente:

```bash
# Desde el directorio backend con el entorno virtual activado
cd backend
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

python create_admin.py
```

Ingresa email y contraseña cuando se te solicite. El usuario se creará con rol `admin`.

### Verificar que Todo Funciona

1. **Backend**: [http://localhost:8000/docs](http://localhost:8000/docs) - Swagger UI
2. **Frontend**: [http://localhost:3000](http://localhost:3000) - Interfaz web
3. **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin) - Panel de administración

> ⚠️ **Importante**: Asegúrate de que PostgreSQL y Redis estén corriendo antes de iniciar el backend.

---

## 🤖 Proveedores de IA Soportados

| Proveedor | Modelos Disponibles | ¿Necesita API Key? | Costo |
|-----------|---------------------|-------------------|-------|
| **Google Gemini** | gemini-2.5-flash, gemini-2.5-pro | ✅ [Obtener](https://aistudio.google.com/app/apikey) | Gratis con límites |
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | ✅ [Obtener](https://platform.openai.com/api-keys) | Pago por uso |
| **Anthropic Claude** | claude-3-5-sonnet, claude-3-haiku | ✅ [Obtener](https://console.anthropic.com/settings/keys) | Pago por uso |
| **Cerebras** | llama-3.3-70b, llama3.1-8b, qwen-3-32b | ✅ [Obtener](https://cloud.cerebras.ai) | Gratis con límites |
| **Ollama (Local)** ✨ | qwen2.5:3b, phi4-mini, llama3.2:3b, gemma2:2b | ❌ No requiere | **Gratis** (local) |

> 💡 **Ollama es opcional**: No viene incluido en la instalación. Solo descárgalo si quieres ejecutar modelos localmente sin internet ni API keys. [Ver instrucciones](#-uso-offline-con-ollama-opcional)

---

## ✨ Características Principales

### 🔍 Sistema RAG Avanzado
- **Búsqueda Híbrida**: Combina búsqueda semántica (embeddings) + palabras clave
- **Re-ranking Inteligente**: CrossEncoder para mejorar relevancia
- **Caché de 2 Capas**: LRU en memoria + Redis para máximo rendimiento
- **Filtrado por Fuentes**: Busca solo en documentos seleccionados

### 💬 Chat Inteligente
- **5 Proveedores de IA**: Gemini, Cerebras, OpenAI, Anthropic, **Ollama (local)**
- **Slash Commands**: `/resumen`, `/traducir`, `/explicar`, `/tabla`, `/puntos`, `/analizar`
- **Diagramas Mermaid**: Genera automáticamente diagramas con sintaxis validada y caché inteligente
- **Imágenes Ilustrativas** ✨: Búsqueda automática de imágenes relevantes (personas, marcas, lugares)
- **Modal de Vista Completa**: Clic en diagramas e imágenes para ver en pantalla completa
- **Copy Código**: Botón copiar en bloques de código con feedback visual
- **Input Mejorado**: Textarea expandible, contador 0/4000, Ctrl+Enter
- **Botón Regenerar**: Regenera respuestas con un clic
- **Preguntas Sugeridas**: Generación automática al cargar documentos
- **Formato TOON**: Reduce consumo de tokens en **30-60%**

### 📝 Editor LaTeX con Copiloto
- **Interfaz Estilo VS Code**: Barra de iconos vertical para acceso rápido
- **Paneles Colapsables**: Documentos, Outline, Símbolos (toggle con un clic)
- **Autocompletado 200+ Comandos**: Comandos LaTeX con snippets inteligentes
- **200+ Símbolos Matemáticos**: 9 categorías (griego, operadores, flechas, relaciones, etc.)
- **Navegación por Outline**: Panel de estructura con clic para navegar
- **50+ Plantillas Profesionales**: Artículos, tesis, CV, cartas, informes, presentaciones Beamer
- **Acciones Contextuales IA**: Clic derecho para mejorar, traducir o corregir
- **Compilación en Tiempo Real**: Vista previa PDF instantánea
- **Spell Check Multi-idioma**: Español, inglés, portugués, francés, alemán
- **Code Folding**: Colapsar secciones y entornos LaTeX
- **Galería de Plantillas**: Búsqueda y filtrado por categoría/dificultad

### 🔐 Seguridad Empresarial
- **JWT + Refresh Tokens**: Rotación automática cada 30 minutos
- **Encriptación AES-256**: API keys encriptadas en base de datos
- **Rate Limiting por Rol**: Límites diferenciados (anónimo/user/admin)
- **Auditoría Completa**: Log de todas las acciones sensibles

### 🤝 Colaboración en Tiempo Real (Nuevo en 4.2)
- **Cursores Sincronizados**: Ve dónde editan otros usuarios
- **Selección Compartida**: Visualiza selecciones de colaboradores
- **Chat de Proyecto**: Comunicación integrada en el editor
- **Control de Versiones**: Historial Git-style con diff viewer
- **Invitaciones**: Comparte proyectos por email

### 🎨 Experiencia de Usuario
- **6 Temas Visuales**: Oscuro, Claro, Rojo Pasión, Alto Contraste, Matrix, Vintage
- **Drag & Drop**: Arrastra archivos para subirlos
- **Responsive**: Funciona en desktop y tablet
- **Dark Mode por Defecto**: Con ThemeProvider profesional

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
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │   DB    │  │  Redis  │  │ Celery  │
   │  5432   │  │  6379   │  │ Worker  │
   └─────────┘  └─────────┘  └─────────┘
   PostgreSQL     Cache        Async
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
│   │       ├── auth.py          # Login, registro, JWT
│   │       ├── chat.py          # Mensajes y RAG
│   │       ├── documents.py     # Subida de archivos
│   │       ├── admin.py         # Panel administrador
│   │       ├── providers.py     # Config proveedores IA
│   │       ├── collaboration.py # Colaboración tiempo real
│   │       ├── versions.py      # Control de versiones
│   │       └── integrations.py  # Integraciones externas
│   ├── 📁 services/
│   │   ├── ai_providers.py      # Multi-proveedor IA
│   │   ├── search_engine.py     # Motor RAG
│   │   └── embedding_system.py  # Embeddings con caché
│   ├── 📁 database/
│   │   └── models.py            # Modelos SQLAlchemy
│   ├── 📁 tests/                # 80+ tests unitarios
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
2. Elige un proveedor: **Gemini**, **OpenAI**, o **Claude**
3. Sigue las instrucciones para obtener tu API key

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
2. **Barra de Iconos (izquierda)**:
   - 📁 Documentos: Toggle panel de documentos
   - 📑 Estructura: Ver outline del documento
   - 🔢 Símbolos: Insertar símbolos matemáticos
3. **Herramientas (header del editor)**:
   - 🔧 Toggle toolbar
   - 📊 Toggle estadísticas
   - ✨ Toggle barra IA
4. Usa las plantillas predefinidas o escribe desde cero
5. **Autocompletado**: Escribe `\` para ver sugerencias de comandos
6. **Acciones IA**: Selecciona texto y haz clic derecho para:
   - Mejorar redacción
   - Traducir
   - Corregir gramática
   - Generar citas
7. Haz clic en "Compilar" para ver el PDF

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

### Error "Rate limit exceeded"

Espera un minuto o inicia sesión para aumentar tu límite:
- Anónimo: 30 req/min
- Autenticado: 100 req/min
- Admin: 1000 req/min

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar la app sin API key?

**Depende.** Los proveedores en la nube tienen capas gratuitas, pero eventualmente pueden requerir pago.

### ¿Qué formatos de documentos soporta?

PDF, DOCX, TXT y PPTX.

### ¿Mis datos están seguros?

Sí. Las API keys se almacenan encriptadas y los proveedores (Gemini/OpenAI) tienen políticas de privacidad estrictas para empresas.

### ¿Funciona offline?

**Sí, con Ollama (opcional).** Si quieres usar IA sin internet, puedes instalar Ollama por separado:

```bash
# 1. Instalar Ollama (solo si quieres modelos locales)
winget install Ollama.Ollama

# 2. Descargar un modelo ligero
ollama pull qwen2.5:3b

# 3. Seleccionar "Ollama (Local)" en la app
```

> ⚠️ **Ollama NO es obligatorio** - La app funciona perfectamente con los proveedores en la nube (Gemini, OpenAI, etc.). Solo instala Ollama si quieres privacidad total o no tienes internet.

**Modelos recomendados para PCs estándar (4-8GB RAM):**
| Modelo | Tamaño | Uso |
|--------|--------|-----|
| `gemma2:2b` | ~1.5GB | PCs básicos |
| `qwen2.5:3b` | ~2GB | Mejor en español |
| `llama3.2:3b` | ~2GB | Balance general |

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
