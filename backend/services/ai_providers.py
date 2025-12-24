"""
AI Provider Abstraction Layer.
Supports multiple AI providers with a unified interface.
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any, Optional, List, Dict
import httpx
import json
import logging

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name for display."""
        pass
    
    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Provider ID for storage."""
        pass
    
    @property
    @abstractmethod
    def default_model(self) -> str:
        """Default model for this provider."""
        pass
    
    @property
    @abstractmethod
    def models(self) -> List[Dict[str, str]]:
        """Available models for this provider."""
        pass
    
    @property
    @abstractmethod
    def api_key_url(self) -> str:
        """URL to get API key."""
        pass
    
    @property
    @abstractmethod
    def api_key_placeholder(self) -> str:
        """Placeholder for API key input."""
        pass
    
    @property
    @abstractmethod
    def setup_steps(self) -> List[str]:
        """Steps to set up API key."""
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response."""
        pass


class GeminiProvider(AIProvider):
    """Google Gemini API provider."""
    
    @property
    def name(self) -> str:
        return "Google Gemini"
    
    @property
    def provider_id(self) -> str:
        return "gemini"
    
    @property
    def default_model(self) -> str:
        return "gemini-2.5-flash"
    
    @property
    def models(self) -> List[Dict[str, str]]:
        return [
            {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash (Rápido)"},
            {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro (Avanzado)"}
        ]
    
    @property
    def api_key_url(self) -> str:
        return "https://aistudio.google.com/app/apikey"
    
    @property
    def api_key_placeholder(self) -> str:
        return "AIzaSy..."
    
    @property
    def setup_steps(self) -> List[str]:
        return [
            "Ve a Google AI Studio",
            "Inicia sesión con tu cuenta de Google",
            "Haz clic en 'Create API key'",
            "Copia la clave generada y pégala abajo"
        ]
    
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        model = model or self.default_model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature}
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, headers=headers, json=data, timeout=60) as response:
                    logger.info(f"Gemini API Response Status: {response.status_code}")
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error Gemini API: {response.status_code} - {error_text}")
                        yield f"Error al conectar con la API de Gemini: {response.status_code}"
                        return

                    buffer = ""
                    depth = 0
                    in_string = False
                    escape = False
                    
                    async for chunk in response.aiter_bytes():
                        try:
                            text_chunk = chunk.decode("utf-8")
                        except UnicodeDecodeError:
                            continue

                        for char in text_chunk:
                            buffer += char
                            
                            if not in_string:
                                if char == '{':
                                    depth += 1
                                elif char == '}':
                                    depth -= 1
                                    if depth == 0:
                                        try:
                                            start_index = buffer.find('{')
                                            if start_index != -1:
                                                json_str = buffer[start_index:]
                                                chunk_data = json.loads(json_str)
                                                
                                                if "candidates" in chunk_data:
                                                    for candidate in chunk_data["candidates"]:
                                                        if "content" in candidate and "parts" in candidate["content"]:
                                                            for part in candidate["content"]["parts"]:
                                                                if "text" in part:
                                                                    yield part["text"]
                                                
                                                if "usageMetadata" in chunk_data and on_token_usage:
                                                    total_tokens = chunk_data["usageMetadata"].get("totalTokenCount", 0)
                                                    if total_tokens > 0:
                                                        await on_token_usage(total_tokens)
                                            
                                            buffer = ""
                                        except json.JSONDecodeError:
                                            pass
                                elif char == '"':
                                    in_string = True
                            else:
                                if escape:
                                    escape = False
                                elif char == '\\':
                                    escape = True
                                elif char == '"':
                                    in_string = False
            except Exception as e:
                logger.error(f"Exception in GeminiProvider: {e}", exc_info=True)
                yield "Ocurrió un error de conexión con Gemini."


class OpenAIProvider(AIProvider):
    """OpenAI API provider (ChatGPT)."""
    
    @property
    def name(self) -> str:
        return "OpenAI"
    
    @property
    def provider_id(self) -> str:
        return "openai"
    
    @property
    def default_model(self) -> str:
        return "gpt-4o-mini"
    
    @property
    def models(self) -> List[Dict[str, str]]:
        return [
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini (Económico)"},
            {"id": "gpt-4o", "name": "GPT-4o (Avanzado)"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"}
        ]
    
    @property
    def api_key_url(self) -> str:
        return "https://platform.openai.com/api-keys"
    
    @property
    def api_key_placeholder(self) -> str:
        return "sk-..."
    
    @property
    def setup_steps(self) -> List[str]:
        return [
            "Ve a OpenAI Platform",
            "Inicia sesión o crea una cuenta",
            "Ve a 'API Keys' en el menú",
            "Haz clic en 'Create new secret key'",
            "Copia la clave y pégala abajo"
        ]
    
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        model = model or self.default_model
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "stream": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, headers=headers, json=data, timeout=60) as response:
                    logger.info(f"OpenAI API Response Status: {response.status_code}")
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error OpenAI API: {response.status_code} - {error_text}")
                        yield f"Error al conectar con OpenAI: {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                if "choices" in chunk_data:
                                    for choice in chunk_data["choices"]:
                                        delta = choice.get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                
                                # Token usage comes in the final chunk
                                if "usage" in chunk_data and on_token_usage:
                                    total = chunk_data["usage"].get("total_tokens", 0)
                                    if total > 0:
                                        await on_token_usage(total)
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Exception in OpenAIProvider: {e}", exc_info=True)
                yield "Ocurrió un error de conexión con OpenAI."


class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider."""
    
    @property
    def name(self) -> str:
        return "Anthropic Claude"
    
    @property
    def provider_id(self) -> str:
        return "anthropic"
    
    @property
    def default_model(self) -> str:
        return "claude-3-5-sonnet-20241022"
    
    @property
    def models(self) -> List[Dict[str, str]]:
        return [
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet (Recomendado)"},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku (Rápido)"}
        ]
    
    @property
    def api_key_url(self) -> str:
        return "https://console.anthropic.com/settings/keys"
    
    @property
    def api_key_placeholder(self) -> str:
        return "sk-ant-..."
    
    @property
    def setup_steps(self) -> List[str]:
        return [
            "Ve a Anthropic Console",
            "Crea una cuenta o inicia sesión",
            "Ve a 'API Keys' en Settings",
            "Haz clic en 'Create Key'",
            "Copia la clave y pégala abajo"
        ]
    
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        model = model or self.default_model
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, headers=headers, json=data, timeout=60) as response:
                    logger.info(f"Anthropic API Response Status: {response.status_code}")
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error Anthropic API: {response.status_code} - {error_text}")
                        yield f"Error al conectar con Anthropic: {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            try:
                                chunk_data = json.loads(data_str)
                                event_type = chunk_data.get("type")
                                
                                if event_type == "content_block_delta":
                                    delta = chunk_data.get("delta", {})
                                    if delta.get("type") == "text_delta":
                                        yield delta.get("text", "")
                                
                                elif event_type == "message_delta":
                                    usage = chunk_data.get("usage", {})
                                    if on_token_usage and "output_tokens" in usage:
                                        await on_token_usage(usage["output_tokens"])
                                        
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Exception in AnthropicProvider: {e}", exc_info=True)
                yield "Ocurrió un error de conexión con Anthropic."


class CerebrasProvider(AIProvider):
    """Cerebras Inference API - Ultra-fast LLM inference."""
    
    @property
    def name(self) -> str:
        return "Cerebras"
    
    @property
    def provider_id(self) -> str:
        return "cerebras"
    
    @property
    def default_model(self) -> str:
        return "llama-3.3-70b"
    
    @property
    def models(self) -> List[Dict[str, str]]:
        return [
            {"id": "llama-3.3-70b", "name": "Llama 3.3 (70B) - Avanzado"},
            {"id": "llama3.1-8b", "name": "Llama 3.1 (8B) - Económico"},
            {"id": "qwen-3-32b", "name": "Qwen 3 (32B) - Multilenguaje"},
        ]
    
    @property
    def api_key_url(self) -> str:
        return "https://cloud.cerebras.ai"
    
    @property
    def api_key_placeholder(self) -> str:
        return "csk-..."
    
    @property
    def setup_steps(self) -> List[str]:
        return [
            "Ve a cloud.cerebras.ai",
            "Crea una cuenta gratuita",
            "Ve a 'API Keys' y genera una clave",
            "Copia la clave y pégala abajo"
        ]
    
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        model = model or self.default_model
        url = "https://api.cerebras.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "stream": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, headers=headers, json=data, timeout=60) as response:
                    logger.info(f"Cerebras API Response Status: {response.status_code}")
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error Cerebras API: {response.status_code} - {error_text}")
                        yield f"Error al conectar con Cerebras: {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                if "choices" in chunk_data:
                                    for choice in chunk_data["choices"]:
                                        delta = choice.get("delta", {})
                                        if "content" in delta:
                                            yield delta["content"]
                                
                                # Token usage comes in the final chunk
                                if "usage" in chunk_data and on_token_usage:
                                    total = chunk_data["usage"].get("total_tokens", 0)
                                    if total > 0:
                                        await on_token_usage(total)
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"Exception in CerebrasProvider: {e}", exc_info=True)
                yield "Ocurrió un error de conexión con Cerebras."


class OllamaProvider(AIProvider):
    """
    Ollama local inference provider.
    
    Optimized for running lightweight models on consumer hardware.
    Supports automatic health checks and dynamic model detection.
    """
    
    # Modelos recomendados para PCs de gama media (4-8GB RAM/VRAM)
    LIGHTWEIGHT_MODELS = [
        {"id": "qwen2.5:3b", "name": "Qwen 2.5 (3B) - Español/Inglés", "size": "small"},
        {"id": "phi4-mini", "name": "Phi-4 Mini - Microsoft", "size": "small"},
        {"id": "llama3.2:3b", "name": "Llama 3.2 (3B) - Meta", "size": "small"},
        {"id": "gemma2:2b", "name": "Gemma 2 (2B) - Ultraligero", "size": "tiny"},
        {"id": "mistral:7b", "name": "Mistral (7B) - Avanzado", "size": "medium"},
        {"id": "llama3.2:1b", "name": "Llama 3.2 (1B) - Mínimo", "size": "tiny"},
    ]
    
    # Timeouts adaptativos según tamaño del modelo
    TIMEOUT_BY_SIZE = {
        "tiny": 60,    # 1-2B params
        "small": 90,   # 3-4B params
        "medium": 120, # 7-8B params
    }
    
    def __init__(self):
        import os
        self._base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self._is_available: Optional[bool] = None
    
    @property
    def name(self) -> str:
        return "Ollama (Local)"
    
    @property
    def provider_id(self) -> str:
        return "ollama"
    
    @property
    def default_model(self) -> str:
        return "qwen2.5:3b"
    
    @property
    def models(self) -> List[Dict[str, str]]:
        return [{"id": m["id"], "name": m["name"]} for m in self.LIGHTWEIGHT_MODELS]
    
    @property
    def api_key_url(self) -> str:
        return "https://ollama.com/download"
    
    @property
    def api_key_placeholder(self) -> str:
        return "local"
    
    @property
    def setup_steps(self) -> List[str]:
        return [
            "Descarga Ollama desde ollama.com",
            "Instala y ejecuta Ollama",
            "Abre terminal y ejecuta: ollama pull qwen2.5:3b",
            "Escribe 'local' abajo para activar",
        ]
    
    def _get_timeout_for_model(self, model: str) -> int:
        """Get adaptive timeout based on model size."""
        for m in self.LIGHTWEIGHT_MODELS:
            if m["id"] == model:
                return self.TIMEOUT_BY_SIZE.get(m.get("size", "small"), 90)
        return 90  # Default timeout
    
    async def check_health(self) -> bool:
        """Check if Ollama server is running and accessible."""
        if self._is_available is not None:
            return self._is_available
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self._base_url}/api/tags", timeout=5)
                self._is_available = response.status_code == 200
                if self._is_available:
                    logger.info("Ollama server detected and available")
                return self._is_available
            except Exception as e:
                logger.debug(f"Ollama not available: {e}")
                self._is_available = False
                return False
    
    async def list_installed_models(self) -> List[str]:
        """Get list of models installed in Ollama."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self._base_url}/api/tags", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    return [m["name"] for m in data.get("models", [])]
            except Exception as e:
                logger.debug(f"Could not list Ollama models: {e}")
        return []
    
    async def generate_stream(
        self,
        prompt: str,
        api_key: str,  # Ignored for local inference
        temperature: float = 0.3,
        model: Optional[str] = None,
        on_token_usage: Any = None
    ) -> AsyncGenerator[str, None]:
        model = model or self.default_model
        url = f"{self._base_url}/api/generate"
        timeout = self._get_timeout_for_model(model)
        
        data = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": temperature,
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream(
                    "POST", 
                    url, 
                    json=data, 
                    timeout=timeout
                ) as response:
                    logger.info(f"Ollama API Response Status: {response.status_code}")
                    
                    if response.status_code == 404:
                        yield f"Modelo '{model}' no encontrado. Ejecuta: ollama pull {model}"
                        return
                    
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Error Ollama API: {response.status_code} - {error_text}")
                        yield f"Error de Ollama: {response.status_code}. ¿Está Ollama ejecutándose?"
                        return
                    
                    total_tokens = 0
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk_data = json.loads(line)
                                
                                # Stream response text
                                if "response" in chunk_data:
                                    yield chunk_data["response"]
                                
                                # Track token usage from final message
                                if chunk_data.get("done", False):
                                    total_tokens = chunk_data.get("eval_count", 0)
                                    if on_token_usage and total_tokens > 0:
                                        await on_token_usage(total_tokens)
                                        
                            except json.JSONDecodeError:
                                continue
                                
            except httpx.ConnectError:
                logger.error("Cannot connect to Ollama server")
                yield "No se puede conectar a Ollama. Asegúrate de que esté ejecutándose (ollama serve)."
            except httpx.TimeoutException:
                logger.error(f"Ollama request timed out after {timeout}s")
                yield f"Tiempo de espera agotado. El modelo puede ser muy grande para tu hardware."
            except Exception as e:
                logger.error(f"Exception in OllamaProvider: {e}", exc_info=True)
                yield "Ocurrió un error con Ollama."


class ProviderFactory:
    """Factory to get AI provider instances."""
    
    _providers = {
        "gemini": GeminiProvider,
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "cerebras": CerebrasProvider,
        "ollama": OllamaProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_id: str) -> AIProvider:
        """Get a provider instance by ID."""
        provider_class = cls._providers.get(provider_id.lower())
        if not provider_class:
            # Default to Gemini if unknown provider
            logger.warning(f"Unknown provider '{provider_id}', defaulting to Gemini")
            provider_class = GeminiProvider
        return provider_class()
    
    @classmethod
    def list_providers(cls) -> List[Dict[str, Any]]:
        """List all available providers with their configuration."""
        providers = []
        for provider_id, provider_class in cls._providers.items():
            instance = provider_class()
            providers.append({
                "id": instance.provider_id,
                "name": instance.name,
                "models": instance.models,
                "default_model": instance.default_model,
                "api_key_url": instance.api_key_url,
                "api_key_placeholder": instance.api_key_placeholder,
                "setup_steps": instance.setup_steps
            })
        return providers
