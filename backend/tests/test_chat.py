import os
os.environ['DATABASE_URL'] = 'sqlite:///./test_chat.db'
os.environ['TEST_MODE'] = 'True'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import TSVECTOR
from pgvector.sqlalchemy import Vector
from unittest.mock import patch, MagicMock

from app.main import app 
from database.connection import Base, get_db
from database import models
from services import auth_service, embedding_system, search_engine # Importamos los servicios necesarios

# --- Compiladores para tipos de datos de PostgreSQL en SQLite ---
@compiles(TSVECTOR, 'sqlite')
def compile_tsvector_sqlite(element, compiler, **kw):
    return "TEXT"

@compiles(Vector, 'sqlite')
def compile_vector_sqlite(element, compiler, **kw):
    return "BLOB"

# --- Configuración de la Base de Datos de Prueba (En Memoria) ---

DATABASE_URL_TEST = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL_TEST,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Sobrescribir Dependencias para Pruebas ---

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# --- Fixtures de Pytest ---

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    yield TestClient(app)

@pytest.fixture
def authenticated_client(client, db_session):
    """
    Fixture para un cliente autenticado.
    Registra un usuario, hace login y devuelve un cliente con el token.
    """
    email = "test_rag@example.com"
    password = "testpassword"
    
    # Registrar usuario
    client.post("/auth/register", json={"email": email, "password": password})
    
    # Login y obtener token
    login_response = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    token = login_response.json()["access_token"]
    
    auth_client = TestClient(app)
    auth_client.headers = {"Authorization": f"Bearer {token}"}
    return auth_client

# --- Mocks para servicios externos ---

@pytest.fixture
def mock_gemini_client():
    """
    Mock para el cliente de Google Gemini.
    """
    with patch('google.generativeai.GenerativeModel') as mock_model:
        mock_instance = MagicMock()
        mock_instance.generate_content.return_value.text = "Respuesta simulada del LLM basada en el contexto."
        mock_model.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_embedding_system_instance():
    """
    Mock para la instancia de AdvancedEmbeddingSystem.
    """
    with patch('app.routers.chat.embedding_system') as mock_embedding_system_global_instance:
        mock_embedding_system_global_instance.create_embeddings.return_value = [[0.1] * 384] # Devuelve un vector fijo
        yield mock_embedding_system_global_instance

@pytest.fixture
def mock_search_engine_instance():
    """
    Mock para la instancia de SearchEngine.
    """
    with patch('app.routers.chat.SearchEngine') as MockSearchEngine:
        mock_instance = MagicMock()
        # Configurar el mock para generate_answer
        mock_instance.generate_answer.return_value = iter(["Respuesta simulada del LLM basada en el contexto."])
        # Configurar el mock para generate_copilot_answer (si se usa en el futuro)
        mock_instance.generate_copilot_answer.return_value = iter(["Respuesta simulada del copiloto."])
        # Configurar el mock para _highlight_relevant_sentences
        mock_instance._highlight_relevant_sentences.return_value = "Texto resaltado simulado."
        # Configurar el mock para hybrid_search, que es llamado por el router
        mock_instance.hybrid_search.return_value = [] # Valor por defecto, se sobrescribirá en tests específicos
        MockSearchEngine.return_value = mock_instance
        yield mock_instance


# --- Tests para el flujo de Chat (RAG) ---

def test_chat_with_document_success(authenticated_client, db_session, mock_gemini_client, mock_embedding_system_instance, mock_search_engine_instance):
    """
    Prueba el flujo completo de chat con un documento.
    """
    # 1. Crear un usuario (ya hecho por authenticated_client)
    user = db_session.query(models.User).filter_by(email="test_rag@example.com").first()
    assert user is not None

    # 2. Insertar chunks de un documento de prueba en la base de datos
    mock_embedding_vector = [0.1] * 384 # El mismo que devuelve el mock
    
    doc_content_1 = "El gato es un animal doméstico. Le gusta cazar ratones."
    doc_content_2 = "Los perros son leales y buenos compañeros. Necesitan paseos diarios."
    
    doc1 = models.Document(
        content=doc_content_1,
        chunk_metadata={"source_file": "documento_gato.pdf", "chunk_index": 0},
        embedding=mock_embedding_vector,
        owner_id=user.id
    )
    doc2 = models.Document(
        content=doc_content_2,
        chunk_metadata={"source_file": "documento_perro.pdf", "chunk_index": 0},
        embedding=mock_embedding_vector,
        owner_id=user.id
    )
    db_session.add_all([doc1, doc2])
    db_session.commit()
    db_session.refresh(doc1)
    db_session.refresh(doc2)

    # 3. Configurar el mock de SearchEngine.hybrid_search para que devuelva los chunks relevantes
    mock_search_engine_instance.hybrid_search.return_value = [
        {"id": doc1.id, "content": doc_content_1, "chunk_metadata": {"source_file": "documento_gato.pdf"}}
    ]

    # 4. Enviar una pregunta al endpoint de chat (ahora /search)
    query = "Háblame del gato."
    response = authenticated_client.post(
        "/search", # Endpoint corregido
        json={"query": query, "top_k": 1, "spell_check": False, "chat_history": []}
    )
    
    assert response.status_code == 200
    response_data = ""
    for chunk in response.iter_bytes():
        response_data += chunk.decode("utf-8")
    
    # La respuesta del LLM es un stream, así que la capturamos y verificamos
    assert "Respuesta simulada del LLM basada en el contexto." in response_data
    
    # 5. Verificar que los mocks fueron llamados correctamente
    mock_embedding_system_instance.create_embeddings.assert_called_once_with([query])
    mock_search_engine_instance.hybrid_search.assert_called_once()
    mock_search_engine_instance.generate_answer.assert_called_once()
    
    # Verificar que el prompt contiene el contexto del documento
    llm_call_args = mock_search_engine_instance.generate_answer.call_args[0]
    assert llm_call_args[0] == query # query
    assert doc_content_1 in llm_call_args[1] # context