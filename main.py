from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

class Servicio(BaseModel):
    nombre: str
    precio: float

@app.get("/")
def saludar():
    return {"mensaje": "¡Hola! Bienvenido a mi API"}

@app.get("/bienvenido/{nombre}")
def saludar_persona(nombre: str):
    return {"mensaje": f"Hola {nombre}, ¡qué bueno verte por aquí!"}

@app.get("/servicios")
def listar_servicios():
    return {"servicios": servicios_db}

@app.post("/agregar-servicio")
def agregar_servicio(servicio: Servicio):
    servicios_db.append(servicio.dict())
    return {
        "mensaje": "Servicio agregado correctamente",
        "servicio": servicio
    }