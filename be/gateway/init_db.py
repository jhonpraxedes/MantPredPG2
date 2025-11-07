import asyncio
from .db import engine, Base
from . import models

async def init_db():
    """Crear todas las tablas"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Base de datos creada correctamente")

if __name__ == "__main__":
    asyncio.run(init_db())