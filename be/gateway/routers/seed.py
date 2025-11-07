from datetime import datetime, timedelta, timezone
import random

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..db import async_session
from ..models import Maquinaria, Lectura

router = APIRouter(prefix="/seed", tags=["Seed"])

def clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))

def evaluar_estado(temperatura: float, vibracion: float, presion_aceite: float) -> tuple[str, str]:
    """Evalúa el estado basado en umbrales"""
    alertas = []
    criticos = []
    
    # Vibración
    if vibracion > 4.5:
        criticos.append(f"Vibración crítica ({vibracion} mm/s)")
    elif vibracion > 2.5:
        alertas.append(f"Vibración elevada ({vibracion} mm/s)")
    
    # Temperatura
    if temperatura > 120:
        criticos.append(f"Temperatura crítica ({temperatura}°C)")
    elif temperatura > 100:
        alertas.append(f"Temperatura elevada ({temperatura}°C)")
    elif temperatura < 80:
        alertas.append(f"Temperatura baja ({temperatura}°C)")
    
    # Presión
    if presion_aceite < 1.5:
        criticos.append(f"Presión crítica ({presion_aceite} bar)")
    elif presion_aceite < 2.5:
        alertas.append(f"Presión baja ({presion_aceite} bar)")
    elif presion_aceite > 5.5:
        alertas.append(f"Presión alta ({presion_aceite} bar)")
    
    if criticos:
        return "CRITICO", "; ".join(criticos)
    elif alertas:
        return "ALERTA", "; ".join(alertas)
    else:
        return "OK", None

@router.post("/historico")
async def seed_historico(
    days: int = Query(7, ge=1, le=60, description="Días hacia atrás"),
    every_minutes: int = Query(10, ge=1, le=60, description="Frecuencia de registros"),
    base_temp: float = 90.0,
    base_vib: float = 2.0,
    base_pres: float = 3.5,
    temp_noise: float = 15.0,
    vib_noise: float = 1.5,
    pres_noise: float = 1.0,
):
    """
    Genera histórico sintético con evaluación automática de estado
    """
    start = datetime.now(timezone.utc) - timedelta(days=days)
    end = datetime.now(timezone.utc)

    total_inserted = 0
    async with async_session() as session:
        maquinas = (await session.execute(select(Maquinaria))).scalars().all()
        if not maquinas:
            raise HTTPException(status_code=400, detail="No hay maquinaria. Crea máquinas primero.")

        t = start
        while t <= end:
            for m in maquinas:
                temp = clamp(base_temp + random.uniform(-temp_noise, temp_noise), 60, 140)
                vib = clamp(base_vib + random.uniform(-vib_noise, vib_noise), 0.2, 8.0)
                pres = clamp(base_pres + random.uniform(-pres_noise, pres_noise), 0.5, 7.0)
                
                # Evaluar estado
                estado, motivo = evaluar_estado(temp, vib, pres)

                session.add(Lectura(
                    maquinaria_id=m.id,
                    numero_serie=m.numero_serie,
                    temperatura=round(temp, 1),
                    vibracion=round(vib, 1),
                    presion_aceite=round(pres, 1),
                    ts=t,
                    estado=estado,
                    motivo=motivo
                ))
                total_inserted += 1
            t += timedelta(minutes=every_minutes)

        await session.commit()

    return {
        "ok": True,
        "inserted": total_inserted,
        "machines": len(maquinas),
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "step_minutes": every_minutes,
    }