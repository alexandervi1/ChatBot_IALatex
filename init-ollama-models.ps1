# PowerShell script to initialize Ollama models
# Run this after docker-compose up for the first time

Write-Host "Inicializando modelos de Ollama..." -ForegroundColor Cyan

# Download llama3.2 3B (smallest, fastest)
Write-Host "`nDescargando Llama 3.2 (3B) - ~2GB..." -ForegroundColor Yellow
docker exec chatbot_ollama ollama pull llama3.2:3b

# Download llama3.1 8B (balanced)
Write-Host "`nDescargando Llama 3.1 (8B) - ~4.7GB..." -ForegroundColor Yellow
docker exec chatbot_ollama ollama pull llama3.1:8b

# Download mistral 7B (precise)
Write-Host "`nDescargando Mistral (7B) - ~4.1GB..." -ForegroundColor Yellow
docker exec chatbot_ollama ollama pull mistral:7b

Write-Host "`n[OK] Modelos descargados exitosamente" -ForegroundColor Green
Write-Host "Puedes usar el modo Local (Ollama) ahora" -ForegroundColor Green
