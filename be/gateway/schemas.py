from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class MaquinaCreate(BaseModel):
    nombre: str
    tipo: str
    descripcion: Optional[str] = None
    numero_serie: str
    motor: Optional[str] = None

class MaquinaUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    motor: Optional[str] = None

class MaquinaOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    descripcion: Optional[str] = None
    numero_serie: str
    motor: Optional[str] = None
    
    class Config:
        from_attributes = True

class LecturaIn(BaseModel):
    maquinaria_id: str
    numero_serie: Optional[str] = None
    temperatura: Optional[float] = None
    vibracion: Optional[float] = None
    presion_aceite: Optional[float] = None
    ts: Optional[datetime] = None

class LecturaOut(BaseModel):
    maquinaria_id: Optional[str]
    numero_serie: Optional[str]
    temperatura: Optional[float]
    vibracion: Optional[float]
    presion_aceite: Optional[float]
    ts: Optional[datetime]
    estado: Optional[str]
    motivo: Optional[str]

class LecturaDB(LecturaOut):
    id: int
    class Config:
        from_attributes = True

class LecturaBatchIn(BaseModel):
    lecturas: List[LecturaIn]

class ResumenDTO(BaseModel):
    total_maquinas: int
    ok: int
    alerta: int
    critico: int
    por_tipo: Dict[str, int]