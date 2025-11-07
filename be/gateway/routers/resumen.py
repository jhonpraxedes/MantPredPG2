from fastapi import
APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from ..db import get_db
from .. import models, schemas
router = APIRouter(prefix="/resumen", tags=["resumen"])
@router.get("", response_model=schemas.ResumenDTO)
async def resumen(db: AsyncSession = Depends(get_db)):
# total maquinaria
total_q = await db.execute(select(func.count(models.Maquinaria.id)))
total_maquinas = total_q.scalar() or 0
# última lectura por maquinaria para contar por estado
q = text("""
WITH latest AS (
SELECT DISTINCT ON (maquinaria_id) maquinaria_id, estado
FROM lecturas
ORDER BY maquinaria_id, ts DESC
)
SELECT
COALESCE(SUM(CASE WHEN estado = 'OK' THEN 1 ELSE 0 END),0) AS ok,
COALESCE(SUM(CASE WHEN estado = 'ALERTA' THEN 1 ELSE 0 END),0) AS alerta,
COALESCE(SUM(CASE WHEN estado = 'CRITICO' THEN 1 ELSE 0 END),0) AS critico
FROM latest
""")
res = await db.execute(q)
ok, alerta, critico =
res.first() or (0, 0, 0)
# por tipo
pt = await db.execute(select(models.Maquinaria.tipo,
func.count()).group_by(models.Maquinaria.tipo))
por_tipo = {t: c for t, c in pt.all()}
return schemas.ResumenDTO(
total_maquinas=int(total_maquinas),
ok=int(ok or 0),
alerta=int(alerta or 0),
critico=int(critico or 0),
por_tipo=por_tipo
)