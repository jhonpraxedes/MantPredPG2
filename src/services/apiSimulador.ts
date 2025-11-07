// src/services/apiSimulador.ts
const API_BASE = 'http://127.0.0.1:8001';

export async function startSimulador(intervalSeconds: number = 10): Promise<any> {
  const res = await fetch(`${API_BASE}/sim/start?interval_seconds=${intervalSeconds}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Error al iniciar simulador');
  }
  return res.json();
}

export async function stopSimulador(): Promise<any> {
  const res = await fetch(`${API_BASE}/sim/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error('Error al detener simulador');
  }
  return res.json();
}

export async function getSimuladorStatus(): Promise<{ running: boolean; interval_seconds: number }> {
  const res = await fetch(`${API_BASE}/sim/status`);
  if (!res.ok) {
    throw new Error('Error al obtener estado del simulador');
  }
  return res.json();
}