from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

# Simulación de base de datos para usuarios
usuarios_db = []

class Credenciales(BaseModel):
    correo: str
    contraseña: str

@router.post("/register")
def register(credenciales: Credenciales):
    # Agregar usuario a la lista temporal
    usuarios_db.append({
        "correo": credenciales.correo,
        "contraseña": credenciales.contraseña
    })
    return {
        "mensaje": "Registro exitoso",
        "correo": credenciales.correo
    }

@router.post("/login")
def login(credenciales: Credenciales):
    # Buscar usuario en la lista
    for usuario in usuarios_db:
        if usuario["correo"] == credenciales.correo and usuario["contraseña"] == credenciales.contraseña:
            return {
                "mensaje": "Login exitoso",
                "correo": credenciales.correo,
                "acceso": True
            }
    return {
        "mensaje": "Credenciales inválidas",
        "acceso": False
    }
