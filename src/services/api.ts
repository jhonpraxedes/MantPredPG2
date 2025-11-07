// src/services/api.ts
const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  (process as any)?.env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && (window as any).__env?.VITE_API_BASE_URL) ||
  'http://127.0.0.1:8001';

export type Lectura = {
  maquinaria_id: string;
  numero_serie: string | null;
  temperatura: number | null;
  vibracion: number | null;
  presion_aceite: number | null;
  ts: string;
  estado: 'OK' | 'ALERTA' | 'CRITICO' | null;
  motivo: string | null;
};

export async function getLatest(): Promise<Lectura[]> {
  const res = await fetch(`${API_BASE}/lecturas/latest`);
  if (!res.ok) throw new Error('Error latest');
  return res.json();
}

export async function getHistory(
  maquinaria_id: string,
  start?: string,
  end?: string,
): Promise<Lectura[]> {
  const params = new URLSearchParams({ maquinaria_id });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const res = await fetch(`${API_BASE}/lecturas/history?${params.toString()}`);
  if (!res.ok) throw new Error('Error history');
  return res.json();
}

export async function getPredict(
  maquinaria_id: string,
  metric: 'temperatura' | 'vibracion' | 'presion_aceite' = 'temperatura',
): Promise<any> {
  const params = new URLSearchParams({ maquinaria_id, metric });
  const res = await fetch(`${API_BASE}/lecturas/predict?${params.toString()}`);
  if (!res.ok) throw new Error('Error predict');
  return res.json();
}
