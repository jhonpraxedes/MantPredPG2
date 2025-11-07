// src/services/apiBackend.ts
// Fallback seguro para producción
const FALLBACK_PROD = 'https://mantpredpg2-production.up.railway.app';

let API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL ||
  (process as any)?.env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && (window as any).__env?.VITE_API_BASE_URL) ||
  'http://127.0.0.1:8001';

// Si estamos en el navegador y no estamos en localhost, y la base aún apunta a localhost,
// forzamos el fallback de producción para evitar llamadas al localhost desde Netlify.
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocalhost && API_BASE.includes('127.0.0.1')) {
    API_BASE = FALLBACK_PROD;
  }
}

// Log temporal para verificar en producción que el bundle usa la URL correcta.
// Quitar este console.log una vez verificado.
console.log('API_BASE usado por frontend ->', API_BASE);

export type Estado = 'OK' | 'ALERTA' | 'CRITICO';

export interface Maquina {
  id: string;
  nombre: string;
  tipo: string;
  numero_serie: string;
  motor?: string | null;
  descripcion?: string | null;
}

export interface Lectura {
  id?: number;
  maquinaria_id: string;
  numero_serie: string | null;
  temperatura: number | null;
  vibracion: number | null;
  presion_aceite: number | null;
  ts: string;
  estado: Estado | null;
  motivo: string | null;
}

/** Maquinaria */
export async function getMaquinaria(): Promise<Maquina[]> {
  const res = await fetch(`${API_BASE}/maquinaria`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error /maquinaria');
  return res.json();
}

export async function createMaquinaria(
  data: Omit<Maquina, 'id'>,
): Promise<Maquina> {
  const res = await fetch(`${API_BASE}/maquinaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Error POST /maquinaria');
  }
  return res.json();
}

export async function updateMaquinaria(
  id: string,
  data: Partial<Maquina>,
): Promise<Maquina> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Error PUT /maquinaria');
  }
  return res.json();
}

export async function deleteMaquinaria(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Error DELETE /maquinaria');
  }
}

/** Lecturas */
export async function getLatest(): Promise<Lectura[]> {
  const res = await fetch(`${API_BASE}/lecturas/latest`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error /lecturas/latest');
  return res.json();
}

export async function createLectura(
  data: Omit<Lectura, 'id' | 'estado' | 'motivo'>,
): Promise<Lectura> {
  const res = await fetch(`${API_BASE}/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error POST /lecturas');
  return res.json();
}

/** Histórico */
export async function getHistory(
  maquinaria_id: string,
  limit: number = 100,
): Promise<Lectura[]> {
  const res = await fetch(
    `${API_BASE}/lecturas/maquina/${maquinaria_id}?limit=${limit}`,
  );
  if (!res.ok) throw new Error('Error /lecturas/maquina');
  return res.json();
}

/** Predicción - MOCK */
export async function getPredict(
  maquinaria_id: string,
  metric: 'temperatura' | 'vibracion' | 'presion_aceite' = 'temperatura',
) {
  const history = await getHistory(maquinaria_id, 20);
  const historyData = history.map((h: Lectura) => ({
    ts: h.ts,
    value: (h as any)[metric] || 0,
  }));
  const last = historyData[historyData.length - 1]?.value || 0;
  const forecastData = Array.from({ length: 5 }, (_, i) => ({
    ts: new Date(Date.now() + (i + 1) * 600000).toISOString(),
    value: last + (Math.random() - 0.5) * 10,
  }));
  return { history: historyData, forecast: forecastData };
}

/** Resumen */
export async function getResumen() {
  const res = await fetch(`${API_BASE}/lecturas/resumen`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error /lecturas/resumen');
  return res.json();
}
