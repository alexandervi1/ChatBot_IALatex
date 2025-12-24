"""
Providers router.
Exposes AI provider configuration to the frontend.
Includes Ollama-specific endpoints for local model management.
"""
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from services.ai_providers import ProviderFactory, OllamaProvider
import httpx
import json

router = APIRouter(
    prefix="/providers",
    tags=["Proveedores IA"],
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


@router.get("/")
async def list_providers():
    """
    List all available AI providers with their configuration.
    Used by frontend to show provider selection and setup guides.
    """
    return {
        "providers": ProviderFactory.list_providers()
    }


@router.get("/ollama/status")
async def ollama_status():
    """
    Check if Ollama is running and accessible.
    Returns status and list of installed models if available.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = [
                    {
                        "name": m["name"],
                        "size": m.get("size", 0),
                        "modified": m.get("modified_at", "")
                    }
                    for m in data.get("models", [])
                ]
                return {
                    "available": True,
                    "installed_models": models,
                    "recommended_models": [
                        {"id": m["id"], "name": m["name"]} 
                        for m in OllamaProvider.LIGHTWEIGHT_MODELS
                    ]
                }
    except Exception:
        pass
    
    return {
        "available": False,
        "installed_models": [],
        "recommended_models": [
            {"id": m["id"], "name": m["name"]} 
            for m in OllamaProvider.LIGHTWEIGHT_MODELS
        ]
    }


@router.post("/ollama/pull/{model_name:path}")
async def pull_ollama_model(model_name: str):
    """
    Pull/download an Ollama model. Streams progress back to client.
    """
    async def stream_pull():
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_BASE_URL}/api/pull",
                    json={"name": model_name},
                    timeout=600  # 10 min timeout for large models
                ) as response:
                    if response.status_code != 200:
                        yield json.dumps({"error": f"Error: {response.status_code}"}) + "\n"
                        return
                    
                    async for line in response.aiter_lines():
                        if line:
                            yield line + "\n"
        except httpx.ConnectError:
            yield json.dumps({"error": "Ollama no está ejecutándose"}) + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"
    
    return StreamingResponse(
        stream_pull(),
        media_type="application/x-ndjson"
    )
