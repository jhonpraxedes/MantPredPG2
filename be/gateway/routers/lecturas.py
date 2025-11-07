from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from typing import Optional
from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="/lecturas", tags=["lecturas"])

def evaluar_estado(temperatura: float, vibracion: float, presion_aceite: float) -> tuple[str, Optional[str]]:
    """
    Evalúa el estado de la maquinaria basado en los umbrales definidos.
  
    Retorna: (estado, motivo)
    - estado: 'OK', 'ALERTA', 'CRITICO'
    - motivo: descripción del problema o None si está OK
    """
    alertas = []
    criticos = []
  
    # Evaluar vibración (mm/s RMS)
    if vibracion > 4.5:
        criticos.append(f"Vibración crítica ({vibracion} mm/s)")
    elif vibracion > 2.5:
        alertas.append(f"Vibración elevada ({vibracion} mm/s)")
  
    # Evaluar temperatura del motor (°C)
    if temperatura > 120:
        criticos.append(f"Temperatura crítica ({temperatura}°C)")
    elif temperatura > 100:
        alertas.append(f"Temperatura elevada ({temperatura}°C)")
    elif temperatura < 80:
        alertas.append(f"Temperatura baja ({temperatura}°C)")
  
    # Evaluar presión de aceite (bar)
    if presion_aceite < 1.5:
        criticos.append(f"Presión de aceite crítica ({presion_aceite} bar)")
    elif presion_aceite < 2.5:
        alertas.append(f"Presión de aceite baja ({presion_aceite} bar)")
    elif presion_aceite > 5.5:
        alertas.append(f"Presión de aceite alta ({presion_aceite} bar)")
  
    # Determinar estado final
    if criticos:
        return "CRITICO", "; ".join(criticos)
    elif alertas:
        return "ALERTA", "; ".join(alertas)
    else:
        return "OK", None

@router.post("", response_model=schemas.LecturaDB)
async def create_lectura(payload: schemas.LecturaIn, db: AsyncSession = Depends(get_db)):
    """Crear una nueva lectura con evaluación automática de estado"""
  
    # Verificar que la maquinaria existe
    result = await db.execute(
        select(models.Maquinaria).where(models.Maquinaria.id == payload.maquinaria_id)
    )
    maquina = result.scalar_one_or_none()
    if not maquina:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrada")
  
    # Evaluar estado basado en los valores
    estado, motivo = evaluar_estado(
        temperatura=payload.temperatura or 0,
        vibracion=payload.vibracion or 0,
        presion_aceite=payload.presion_aceite or 0
    )
  
    # Crear la lectura
    lectura = models.Lectura(
        maquinaria_id=payload.maquinaria_id,
        numero_serie=payload.numero_serie or maquina.numero_serie,
        temperatura=payload.temperatura,
        vibracion=payload.vibracion,
        presion_aceite=payload.presion_aceite,
        ts=payload.ts or datetime.utcnow(),
        estado=estado,
        motivo=motivo
    )
  
    db.add(lectura)
    await db.commit()
    await db.refresh(lectura)
    return lectura

@router.post("/batch")
async def create_lecturas_batch(payload: schemas.LecturaBatchIn, db: AsyncSession = Depends(get_db)):
    """Crear múltiples lecturas con evaluación automática"""
    created = []
  
    for lectura_in in payload.lecturas:
        # Verificar que la maquinaria existe
        result = await db.execute(
            select(models.Maquinaria).where(models.Maquinaria.id == lectura_in.maquinaria_id)
        )
        maquina = result.scalar_one_or_none()
        if not maquina:
            continue
      
        # Evaluar estado
        estado, motivo = evaluar_estado(
            temperatura=lectura_in.temperatura or 0,
            vibracion=lectura_in.vibracion or 0,
            presion_aceite=lectura_in.presion_aceite or 0
        )
      
        lectura = models.Lectura(
            maquinaria_id=lectura_in.maquinaria_id,
            numero_serie=lectura_in.numero_serie or maquina.numero_serie,
            temperatura=lectura_in.temperatura,
            vibracion=lectura_in.vibracion,
            presion_aceite=lectura_in.presion_aceite,
            ts=lectura_in.ts or datetime.utcnow(),
            estado=estado,
            motivo=motivo
        )
        db.add(lectura)
        created.append(lectura)
  
    await db.commit()
    return {"ok": True, "inserted": len(created)}

@router.get("/latest", response_model=list[schemas.LecturaDB])
async def get_latest_lecturas(db: AsyncSession = Depends(get_db)):
    """Obtener la última lectura de cada máquina"""
    from sqlalchemy import func
  
    # Subconsulta para obtener el timestamp más reciente por máquina
    subq = (
        select(
            models.Lectura.maquinaria_id,
            func.max(models.Lectura.ts).label("max_ts")
        )
        .group_by(models.Lectura.maquinaria_id)
        .subquery()
    )
  
    # Consulta principal
    result = await db.execute(
        select(models.Lectura)
        .join(
            subq,
            (models.Lectura.maquinaria_id == subq.c.maquinaria_id) &
            (models.Lectura.ts == subq.c.max_ts)
        )
    )
  
    return result.scalars().all()

@router.get("/maquina/{maquinaria_id}", response_model=list[schemas.LecturaDB])
async def get_lecturas_by_maquina(
    maquinaria_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Obtener lecturas de una máquina específica"""
    result = await db.execute(
        select(models.Lectura)
        .where(models.Lectura.maquinaria_id == maquinaria_id)
        .order_by(desc(models.Lectura.ts))
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/resumen", response_model=schemas.ResumenDTO)
async def get_resumen(db: AsyncSession = Depends(get_db)):
    """Obtener resumen del estado de todas las máquinas"""
    from sqlalchemy import func
  
    # Obtener última lectura por máquina
    subq = (
        select(
            models.Lectura.maquinaria_id,
            func.max(models.Lectura.ts).label("max_ts")
        )
        .group_by(models.Lectura.maquinaria_id)
        .subquery()
    )
  
    result = await db.execute(
        select(models.Lectura)
        .join(
            subq,
            (models.Lectura.maquinaria_id == subq.c.maquinaria_id) &
            (models.Lectura.ts == subq.c.max_ts)
        )
    )
    lecturas = result.scalars().all()
  
    # Obtener todas las máquinas
    maquinas_result = await db.execute(select(models.Maquinaria))
    maquinas = maquinas_result.scalars().all()
  
    # Contar por estado
    ok = sum(1 for l in lecturas if l.estado == "OK")
    alerta = sum(1 for l in lecturas if l.estado == "ALERTA")
    critico = sum(1 for l in lecturas if l.estado == "CRITICO")
  
    # Contar por tipo
    por_tipo = {}
    for m in maquinas:
        por_tipo[m.tipo] = por_tipo.get(m.tipo, 0) + 1
  
    return schemas.ResumenDTO(
        total_maquinas=len(maquinas),
        ok=ok,
        alerta=alerta,
        critico=critico,
        por_tipo=por_tipo
    )