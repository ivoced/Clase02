from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/servicios", tags=["servicios"])

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100}
]

# Base de datos simulada para mascotas
mascotas_db = []

class Servicio(BaseModel):
    nombre: str
    precio: float

class Mascota(BaseModel):
    correo: str
    nombre_mascota: str
    tipo_servicio: str
    fecha: str

@router.get("")
def listar_servicios():
    return {"servicios": servicios_db}

@router.post("/agregar")
def agregar_servicio(servicio: Servicio):
    servicios_db.append(servicio.dict())
    return {
        "mensaje": "Servicio agregado correctamente",
        "servicio": servicio
    }

@router.post("/registrar-mascota")
def registrar_mascota(mascota: Mascota):
    mascota_dict = mascota.dict()
    mascotas_db.append(mascota_dict)
    return {
        "mensaje": "Mascota registrada correctamente",
        "mascota": mascota_dict
    }

@router.get("/mascotas/{correo}")
def listar_mascotas_usuario(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    return {
        "correo": correo,
        "cantidad_mascotas": len(mascotas_usuario),
        "mascotas": mascotas_usuario
    }

@router.get("/reporte/{correo}")
def generar_reporte(correo: str):
    mascotas_usuario = [m for m in mascotas_db if m["correo"] == correo]
    
    # Contar servicios únicos y calcular gasto total
    servicios_registrados = {}
    gasto_total = 0
    
    for mascota in mascotas_usuario:
        tipo_servicio = mascota["tipo_servicio"]
        
        # Buscar el precio del servicio
        for servicio in servicios_db:
            if servicio["nombre"].lower() == tipo_servicio.lower():
                precio = servicio["precio"]
                gasto_total += precio
                if tipo_servicio not in servicios_registrados:
                    servicios_registrados[tipo_servicio] = {"precio": precio, "cantidad": 0}
                servicios_registrados[tipo_servicio]["cantidad"] += 1
                break
    
    return {
        "correo": correo,
        "cantidad_servicios_total": len(mascotas_usuario),
        "servicios_registrados": servicios_registrados,
        "gasto_total": gasto_total
    }
