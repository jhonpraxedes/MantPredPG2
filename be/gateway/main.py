# be/gateway/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import maquinaria, lecturas, seed, simulador
from .db import engine, Base

# Crear la app FastAPI
app = FastAPI(title="Mantenimiento Predictivo API", version="1.0.0")

# Crear tablas al arrancar si no existen
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(maquinaria.router)
app.include_router(lecturas.router)
app.include_router(seed.router)
app.include_router(simulador.router)

@app.get("/")
def root():
    return {"message": "Mantenimiento Predictivo"}