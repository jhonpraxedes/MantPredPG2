import asyncio
import random
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..db import async_session
from ..models import Maquinaria, Lectura

router = APIRouter(prefix="/sim", tags=["Simulador"])

_task: Optional[asyncio.Task] = None
_interval_seconds: int = 10

def evaluar_estado(temperatura: float, vibracion: float, presion_aceite: float) -> tuple[str, str]:
    alertas = []
    criticos = []
    
    if vibracion > 4.5:
        criticos.append(f"Vibración crítica ({vibracion} mm/s)")
    elif vibracion > 2.5:
        alertas.append(f"Vibración elevada ({vibracion} mm/s)")
    
    if temperatura > 120:
        criticos.append(f"Temperatura crítica ({temperatura}°C)")
    elif temperatura > 100:
        alertas.append(f"Temperatura elevada ({temperatura}°C)")
    elif temperatura < 80:
        alertas.append(f"Temperatura baja ({temperatura}°C)")
    
    if presion_aceite < 150:
        criticos.append(f"Presión crítica ({presion_aceite} bar)")
    elif presion_aceite < 200:
        alertas.append(f"Presión baja ({presion_aceite} bar)")
    elif presion_aceite > 350:
        alertas.append(f"Presión alta ({presion_aceite} bar)")
    
    if criticos:
        return "CRITICO", "; ".join(criticos)
    elif alertas:
        return "ALERTA", "; ".join(alertas)
    else:
        return "OK", None

async def _tick_once():
    async with async_session() as session:
        maquinas = (await session.execute(select(Maquinaria))).scalars().all()
        if not maquinas:
            return

        now = datetime.now(timezone.utc)
        for m in maquinas:
            temperatura = round(random.uniform(70, 110), 1)
            vibracion = round(random.uniform(1.0, 5.0), 1)
            presion_aceite = round(random.uniform(200, 350), 1)
            
            estado, motivo = evaluar_estado(temperatura, vibracion, presion_aceite)

            lectura = Lectura(
                maquinaria_id=m.id,
                numero_serie=m.numero_serie,
                temperatura=temperatura,
                vibracion=vibracion,
                presion_aceite=presion_aceite,
                ts=now,
                estado=estado,
                motivo=motivo
            )
            session.add(lectura)
        await session.commit()

async def _runner():
    global _interval_seconds
    while True:
        try:
            await _tick_once()
        except Exception as e:
            print(f"[sim] error: {e}")
        await asyncio.sleep(_interval_seconds)

@router.post("/start")
async def start_sim(interval_seconds: int = 10):
    global _task, _interval_seconds
    if _task and not _task.done():
        raise HTTPException(status_code=400, detail="Simulador ya está en ejecución")
    _interval_seconds = max(2, interval_seconds)
    _task = asyncio.create_task(_runner())
    return {"ok": True, "interval_seconds": _interval_seconds}

@router.post("/stop")
async def stop_sim():
    global _task
    if _task and not _task.done():
        _task.cancel()
        try:
            await _task
        except asyncio.CancelledError:
            pass
        _task = None
        return {"ok": True, "stopped": True}
    return {"ok": True, "stopped": False}

@router.get("/status")
async def status_sim():
    running = _task is not None and not _task.done()
    return {"running": running, "interval_seconds": _interval_seconds}