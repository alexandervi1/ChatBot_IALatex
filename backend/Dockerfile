# =============================================================================
# Dockerfile OPTIMIZADO para Backend FastAPI
# Separación de dependencias pesadas para mejor cacheo
# =============================================================================

# Etapa 1: Builder - Instala todas las dependencias
FROM python:3.11-slim AS builder

# Instalar dependencias del sistema operativo necesarias para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    perl \
    libfontconfig1 \
    libfreetype6 \
    libxrender1 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar TinyTeX y paquetes LaTeX
RUN wget -qO- "https://yihui.org/tinytex/install-bin-unix.sh" | sh -s - --admin --no-path && \
    mv ~/.TinyTeX /opt/TinyTeX

# Configurar el path de TinyTeX
ENV PATH="/opt/TinyTeX/bin/x86_64-linux:/opt/TinyTeX/bin/aarch64-linux:${PATH}"

RUN tlmgr path add && \
    tlmgr install scheme-basic collection-latexrecommended collection-fontsrecommended collection-langspanish babel-spanish ieeetran enumitem

WORKDIR /app

# Crear entorno virtual
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# ============================================================================
# OPTIMIZACIÓN: Separar dependencias por frecuencia de cambio
# Paso 1: Instalar dependencias PESADAS primero (raramente cambian)
# Estas capas se cachean y no se reconstruyen si no cambian
# ============================================================================
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch>=2.1.0 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir sentence-transformers>=2.2.2

# Paso 2: Copiar e instalar el resto de dependencias
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir bcrypt

# =============================================================================
# Etapa 2: Final - Imagen de producción limpia y ligera
# =============================================================================
FROM python:3.11-slim AS final

# Instalar solo las dependencias de sistema operativo necesarias para EJECUTAR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    libfreetype6 \
    libxrender1 \
    libxext6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar el entorno virtual y TinyTeX desde la etapa builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /opt/TinyTeX /opt/TinyTeX

# Configurar el path para usar los ejecutables del venv y TinyTeX
ENV PATH="/opt/venv/bin:/opt/TinyTeX/bin/x86_64-linux:/opt/TinyTeX/bin/aarch64-linux:${PATH}"

# Crear usuario no-root y configurar directorio de trabajo
RUN useradd --create-home appuser
WORKDIR /home/appuser/app

# Copiar código de la aplicación
COPY --chown=appuser:appuser . .

USER appuser

# Healthcheck usando curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# El comando se especifica en docker-compose.yml
