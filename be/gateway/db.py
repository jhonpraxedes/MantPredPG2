# be/gateway/db.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# URL de la base de datos (sqlite asíncrono)
DATABASE_URL = "sqlite+aiosqlite:///./mantenimiento.db"

# Engine y sessionmaker asíncrono
engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

# Base para modelos
Base = declarative_base()


# Dependency de FastAPI para obtener sesión
async def get_db():
    async with async_session() as session:
        yield session