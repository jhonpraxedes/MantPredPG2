from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="/maquinaria", tags=["maquinaria"])

@router.get("", response_model=list[schemas.MaquinaOut])
async def list_maquinaria(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(models.Maquinaria))
    return res.scalars().all()

@router.post("", response_model=schemas.MaquinaOut)
async def create_maquina(payload: schemas.MaquinaCreate, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(models.Maquinaria).where(models.Maquinaria.numero_serie == payload.numero_serie))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="numero_serie ya existe")
    m = models.Maquinaria(**payload.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m

@router.get("/{maquinaria_id}", response_model=schemas.MaquinaOut)
async def get_maquina(maquinaria_id: str, db: AsyncSession = Depends(get_db)):
    """Obtener una máquina por su ID"""
    result = await db.execute(
        select(models.Maquinaria).where(models.Maquinaria.id == maquinaria_id)
    )
    maquina = result.scalar_one_or_none()
    if not maquina:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrada")
    return maquina

@router.put("/{maquinaria_id}", response_model=schemas.MaquinaOut)
async def update_maquina(
    maquinaria_id: str, 
    payload: schemas.MaquinaUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Actualizar una máquina existente por ID"""
    result = await db.execute(
        select(models.Maquinaria).where(models.Maquinaria.id == maquinaria_id)
    )
    maquina = result.scalar_one_or_none()
  
    if not maquina:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrada")
  
    # Actualizar solo los campos proporcionados
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(maquina, key, value)
  
    await db.commit()
    await db.refresh(maquina)
    return maquina

@router.delete("/{maquinaria_id}")
async def delete_maquina(maquinaria_id: str, db: AsyncSession = Depends(get_db)):
    """Eliminar una máquina por su ID"""
    result = await db.execute(
        select(models.Maquinaria).where(models.Maquinaria.id == maquinaria_id)
    )
    maquina = result.scalar_one_or_none()
  
    if not maquina:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrada")
  
    await db.delete(maquina)
    await db.commit()
    return {"ok": True, "message": "Maquinaria eliminada correctamente"}