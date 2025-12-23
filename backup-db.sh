#!/bin/bash
# =============================================================================
# Script de Backup PostgreSQL para ChatBot IA
# 
# Uso:
#   ./backup-db.sh                  # Backup normal
#   ./backup-db.sh --restore FILE   # Restaurar desde backup
#
# Los backups se guardan en ./backups/ con fecha y hora
# =============================================================================

set -e

# Configuración
BACKUP_DIR="./backups"
CONTAINER_NAME="chatbot_db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

# Cargar variables de entorno
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Valores por defecto
POSTGRES_USER=${POSTGRES_USER:-admin}
POSTGRES_DB=${POSTGRES_DB:-chatbot_db}

# Función de backup
backup() {
    echo "📦 Iniciando backup de PostgreSQL..."
    
    # Crear directorio si no existe
    mkdir -p "$BACKUP_DIR"
    
    # Ejecutar pg_dump dentro del contenedor
    docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "✅ Backup completado: $BACKUP_FILE ($SIZE)"
        echo ""
        echo "Para restaurar:"
        echo "  ./backup-db.sh --restore $BACKUP_FILE"
    else
        echo "❌ Error al crear backup"
        exit 1
    fi
    
    # Limpiar backups antiguos (mantener últimos 7)
    echo ""
    echo "🧹 Limpiando backups antiguos (manteniendo últimos 7)..."
    ls -t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
    
    echo "📋 Backups disponibles:"
    ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "  (ninguno)"
}

# Función de restauración
restore() {
    local RESTORE_FILE="$1"
    
    if [ ! -f "$RESTORE_FILE" ]; then
        echo "❌ Archivo no encontrado: $RESTORE_FILE"
        exit 1
    fi
    
    echo "⚠️  ADVERTENCIA: Esto sobrescribirá todos los datos actuales en la base de datos."
    read -p "¿Continuar? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo "Cancelado."
        exit 0
    fi
    
    echo "🔄 Restaurando desde: $RESTORE_FILE"
    
    # Descomprimir y restaurar
    gunzip -c "$RESTORE_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" "$POSTGRES_DB"
    
    if [ $? -eq 0 ]; then
        echo "✅ Restauración completada"
    else
        echo "❌ Error al restaurar"
        exit 1
    fi
}

# Parsear argumentos
case "${1:-}" in
    --restore)
        if [ -z "${2:-}" ]; then
            echo "Uso: $0 --restore <archivo.sql.gz>"
            exit 1
        fi
        restore "$2"
        ;;
    --help|-h)
        echo "Uso:"
        echo "  $0              Crear backup"
        echo "  $0 --restore    Restaurar desde backup"
        echo "  $0 --help       Mostrar esta ayuda"
        ;;
    *)
        backup
        ;;
esac
