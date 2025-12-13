import os
import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Add the current directory to sys.path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import SessionLocal
from database import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_super_admin():
    print("--- Crear Super Admin ---")
    email = input("Email: ")
    password = input("Password: ")
    
    if not email or not password:
        print("Error: Email y Password son requeridos.")
        return

    db: Session = SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"El usuario {email} ya existe.")
            update = input("¿Deseas actualizarlo a admin? (y/n): ")
            if update.lower() == 'y':
                existing_user.role = "admin"
                existing_user.hashed_password = pwd_context.hash(password)
                db.commit()
                print("Usuario actualizado a admin exitosamente.")
            return

        # Create new admin
        hashed_password = pwd_context.hash(password)
        new_admin = models.User(
            email=email,
            hashed_password=hashed_password,
            role="admin",
            full_name="Super Admin"
        )
        db.add(new_admin)
        db.commit()
        print(f"Usuario admin {email} creado exitosamente.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()
