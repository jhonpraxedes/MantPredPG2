// src/services/apiSimulador.ts
import { getEffectiveBase } from './config';
const API_BASE = getEffectiveBase();

export async function startSimulador(
  intervalSeconds: number = 10,
): Promise<any> {
  const res = await fetch(
    `${API_BASE}/sim/start?interval_seconds=${intervalSeconds}`,
    {
      method: 'POST',
    },
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as any).detail || 'Error al iniciar simulador');
  }
  return res.json();
}

export async function stopSimulador(): Promise<any> {
  const res = await fetch(`${API_BASE}/sim/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as any).detail || 'Error al detener simulador');
  }
  return res.json();
}

export async function getSimuladorStatus(): Promise<{
  running: boolean;
  interval_seconds: number;
}> {
  const res = await fetch(`${API_BASE}/sim/status`);
  if (!res.ok) {
    throw new Error('Error al obtener estado del simulador');
  }
  return res.json();
}
