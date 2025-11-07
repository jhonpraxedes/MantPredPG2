from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from .db import Base

def gen_uuid():
    return str(uuid.uuid4())

class Maquinaria(Base):
    __tablename__ = "maquinaria"
    
    id = Column(String, primary_key=True, default=gen_uuid)
    nombre = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    numero_serie = Column(String, unique=True, nullable=False)
    motor = Column(String, nullable=True)
    
    lecturas = relationship("Lectura", back_populates="maquina", cascade="all, delete-orphan")

class Lectura(Base):
    __tablename__ = "lecturas"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    maquinaria_id = Column(String, ForeignKey("maquinaria.id", ondelete="CASCADE"), nullable=False)
    numero_serie = Column(String, nullable=True)
    temperatura = Column(Float, nullable=True)
    vibracion = Column(Float, nullable=True)
    presion_aceite = Column(Float, nullable=True)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(String, nullable=True)
    motivo = Column(Text, nullable=True)
    
    maquina = relationship("Maquinaria", back_populates="lecturas")