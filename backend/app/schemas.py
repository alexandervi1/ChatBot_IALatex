from pydantic import BaseModel, Field
from typing import List, Optional

# --- Schemas de Carga y Tareas ---
class FileProcessResponse(BaseModel):
    message: str
    filename: str

# --- Schemas de Chat y Búsqueda ---
class ChatMessage(BaseModel):
    role: str
    content: str

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=3)
    top_k: int = Field(default=3, ge=1, le=5)
    spell_check: bool = Field(default=True)
    chat_history: List[ChatMessage] = []
    source_files: List[str] | None = None

class DocumentMetadata(BaseModel):
    id: int
    source_file: str
    total_chunks: int

# --- Schemas de Copilot y Feedback ---
class FeedbackRequest(BaseModel):
    query: str
    answer: str
    feedback_type: str
    comment: str | None = None

class CopilotRequest(BaseModel):
    text: str
    instruction: str
    source_files: List[str] | None = None

# --- Schemas de Autenticación ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str | None = None

class UserUpdate(BaseModel):
    gemini_api_key: Optional[str] = None  # Legacy name, maps to ai_api_key
    ai_provider: Optional[str] = None  # gemini, openai, anthropic
    ai_model: Optional[str] = None  # Specific model override
    full_name: Optional[str] = None

class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ai_provider: Optional[str] = None
    ai_model: Optional[str] = None
    full_name: Optional[str] = None

class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    role: str = "user"
    token_usage: int = 0
    has_api_key: bool = False
    ai_provider: str = "gemini"
    ai_model: str | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class SuggestedQuestionsRequest(BaseModel):
    source_files: List[str]

class SuggestedQuestionsResponse(BaseModel):
    questions: List[str]
