import os
os.environ['DATABASE_URL'] = 'sqlite:///./test_auth.db'
os.environ['TEST_MODE'] = 'True'

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import TSVECTOR
from pgvector.sqlalchemy import Vector

# --- Compiladores para tipos de datos de PostgreSQL en SQLite ---
# Esto "enseña" a SQLAlchemy a manejar tipos de PG que SQLite no conoce.
@compiles(TSVECTOR, 'sqlite')
def compile_tsvector_sqlite(element, compiler, **kw):
    return "TEXT"

@compiles(Vector, 'sqlite')
def compile_vector_sqlite(element, compiler, **kw):
    return "BLOB"

from app.main import app 
from database.connection import Base, get_db
from services import auth_service
from database import models

# --- Configuración de la Base de Datos de Prueba (En Memoria) ---

DATABASE_URL_TEST = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL_TEST,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} # Requerido para SQLite
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Sobrescribir Dependencias para Pruebas ---

def override_get_db():
    """
    Una función generadora que proporciona una sesión de base de datos de prueba
    y se asegura de que se cierre después de la prueba.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Aplicamos la sobrescritura a la app de FastAPI
app.dependency_overrides[get_db] = override_get_db

# --- Fixtures de Pytest ---

@pytest.fixture(scope="function")
def db_session():
    """
    Crea una nueva base de datos y sesión para cada función de prueba.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """
    Proporciona un TestClient de FastAPI que usa la sesión de base de datos de prueba.
    """
    # La dependencia get_db ya está sobrescrita globalmente
    yield TestClient(app)


# --- Parte 1: Pruebas Unitarias (auth_service) ---

def test_password_hashing():
    """
    Verifica que el hasheo y la verificación de contraseñas funcionan.
    """
    password = "testpassword123"
    hashed_password = auth_service.get_password_hash(password)
    
    assert hashed_password != password
    assert auth_service.verify_password(password, hashed_password)
    assert not auth_service.verify_password("wrongpassword", hashed_password)

def test_create_access_token():
    """
    Verifica que el token JWT se crea correctamente.
    """
    email = "test@example.com"
    token = auth_service.create_access_token(data={"sub": email})
    
    payload = auth_service.jwt.decode(
        token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM]
    )
    
    assert payload["sub"] == email
    assert "exp" in payload

# --- Parte 2: Pruebas de Integración (API Endpoints) ---

def test_register_user_success(client):
    """
    Prueba el registro exitoso de un nuevo usuario.
    """
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "testpassword"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_register_user_duplicate_email(client, db_session):
    """
    Prueba que no se puede registrar un usuario con un email que ya existe.
    """
    # Primero, creamos un usuario
    existing_user = models.User(
        email="test@example.com", 
        hashed_password=auth_service.get_password_hash("password")
    )
    db_session.add(existing_user)
    db_session.commit()

    # Luego, intentamos registrarlo de nuevo
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "newpassword"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "El email ya está registrado"

def test_login_for_access_token(client, db_session):
    """
    Prueba el inicio de sesión y la obtención de un token.
    """
    # Creamos un usuario para poder hacer login
    user_password = "testpassword"
    db_user = models.User(
        email="login@example.com",
        hashed_password=auth_service.get_password_hash(user_password)
    )
    db_session.add(db_user)
    db_session.commit()

    # Hacemos la petición de login
    response = client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": user_password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_credentials(client):
    """
    Prueba que el login falla con credenciales incorrectas.
    """
    response = client.post(
        "/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos"

def test_read_users_me_unauthenticated(client):
    """
    Prueba que no se puede acceder a una ruta protegida sin un token.
    """
    response = client.get("/auth/users/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_read_users_me_authenticated(client, db_session):
    """
    Prueba el acceso exitoso a una ruta protegida con un token válido.
    """
    # 1. Registrar y hacer login para obtener un token
    user_email = "me@example.com"
    user_password = "mypassword"
    client.post("/auth/register", json={"email": user_email, "password": user_password})
    login_response = client.post("/auth/login", data={"username": user_email, "password": user_password})
    token = login_response.json()["access_token"]

    # 2. Usar el token para acceder a la ruta protegida
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/users/me", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_email
