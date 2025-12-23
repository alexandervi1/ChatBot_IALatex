# =============================================================================
# Script de Backup PostgreSQL para ChatBot IA (Windows PowerShell)
# 
# Uso:
#   .\backup-db.ps1                     # Backup normal
#   .\backup-db.ps1 -Restore "file"     # Restaurar desde backup
#
# Los backups se guardan en .\backups\ con fecha y hora
# =============================================================================

param(
    [string]$Restore = "",
    [switch]$Help
)

$BACKUP_DIR = ".\backups"
$CONTAINER_NAME = "chatbot_db"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\backup_$TIMESTAMP.sql"

# Cargar variables de .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "admin" }
$POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "chatbot_db" }

function Show-Help {
    Write-Host "Uso:"
    Write-Host "  .\backup-db.ps1              Crear backup"
    Write-Host "  .\backup-db.ps1 -Restore     Restaurar desde backup"
    Write-Host "  .\backup-db.ps1 -Help        Mostrar esta ayuda"
}

function Backup-Database {
    Write-Host "`n📦 Iniciando backup de PostgreSQL..." -ForegroundColor Cyan
    
    # Crear directorio si no existe
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    }
    
    # Ejecutar pg_dump dentro del contenedor
    docker exec $CONTAINER_NAME pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
    
    if ($LASTEXITCODE -eq 0) {
        $Size = (Get-Item $BACKUP_FILE).Length / 1KB
        Write-Host "✅ Backup completado: $BACKUP_FILE ($([math]::Round($Size, 2)) KB)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Para restaurar:"
        Write-Host "  .\backup-db.ps1 -Restore `"$BACKUP_FILE`""
    } else {
        Write-Host "❌ Error al crear backup" -ForegroundColor Red
        exit 1
    }
    
    # Limpiar backups antiguos (mantener últimos 7)
    Write-Host ""
    Write-Host "🧹 Limpiando backups antiguos (manteniendo últimos 7)..." -ForegroundColor Yellow
    Get-ChildItem "$BACKUP_DIR\backup_*.sql" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -Skip 7 | 
        Remove-Item -Force
    
    Write-Host "`n📋 Backups disponibles:" -ForegroundColor Cyan
    Get-ChildItem "$BACKUP_DIR\backup_*.sql" -ErrorAction SilentlyContinue | 
        ForEach-Object { Write-Host "  $($_.Name) - $([math]::Round($_.Length / 1KB, 2)) KB" }
}

function Restore-Database {
    param([string]$RestoreFile)
    
    if (-not (Test-Path $RestoreFile)) {
        Write-Host "❌ Archivo no encontrado: $RestoreFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⚠️  ADVERTENCIA: Esto sobrescribirá todos los datos actuales." -ForegroundColor Yellow
    $Confirm = Read-Host "¿Continuar? (yes/no)"
    
    if ($Confirm -ne "yes") {
        Write-Host "Cancelado."
        exit 0
    }
    
    Write-Host "🔄 Restaurando desde: $RestoreFile" -ForegroundColor Cyan
    
    Get-Content $RestoreFile | docker exec -i $CONTAINER_NAME psql -U $POSTGRES_USER $POSTGRES_DB
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Restauración completada" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al restaurar" -ForegroundColor Red
        exit 1
    }
}

# Main
if ($Help) {
    Show-Help
} elseif ($Restore) {
    Restore-Database -RestoreFile $Restore
} else {
    Backup-Database
}
