"""
Providers router.
Exposes AI provider configuration to the frontend.
"""
from fastapi import APIRouter
from services.ai_providers import ProviderFactory

router = APIRouter(
    prefix="/providers",
    tags=["Proveedores IA"],
)


@router.get("/")
async def list_providers():
    """
    List all available AI providers with their configuration.
    Used by frontend to show provider selection and setup guides.
    """
    return {
        "providers": ProviderFactory.list_providers()
    }
