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
function getEffectiveBase() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost && API_BASE.includes('127.0.0.1')) {
      return FALLBACK_PROD;
    }
  }
  return API_BASE;
}

// Log temporal para verificar en producción que el bundle usa la URL correcta.
// Quitar este console.log una vez verificado.
console.log('API_BASE usado por frontend ->', getEffectiveBase());

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

/** Helper para parsear respuesta y detalle de error */
async function parseResponse(res: Response) {
  const text = await res.text().catch(() => '');
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { detail: text };
  }
  return { ok: res.ok, status: res.status, body };
}

/** Maquinaria */
export async function getMaquinaria(): Promise<Maquina[]> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/maquinaria`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error /maquinaria (${res.status})`);
  return res.json();
}

export async function createMaquinaria(
  data: Omit<Maquina, 'id'>,
): Promise<Maquina> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/maquinaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const parsed = await parseResponse(res);
  if (!parsed.ok) {
    throw new Error(
      parsed.body?.detail || `Error POST /maquinaria (${parsed.status})`,
    );
  }
  return parsed.body as Maquina;
}

export async function updateMaquinaria(
  id: string,
  data: Partial<Maquina>,
): Promise<Maquina> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/maquinaria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const parsed = await parseResponse(res);
  if (!parsed.ok) {
    throw new Error(
      parsed.body?.detail || `Error PUT /maquinaria (${parsed.status})`,
    );
  }
  return parsed.body as Maquina;
}

export async function deleteMaquinaria(id: string): Promise<void> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/maquinaria/${id}`, {
    method: 'DELETE',
  });

  const parsed = await parseResponse(res);
  if (!parsed.ok) {
    throw new Error(
      parsed.body?.detail || `Error DELETE /maquinaria (${parsed.status})`,
    );
  }
}

/** Lecturas */
export async function getLatest(): Promise<Lectura[]> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/lecturas/latest`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error /lecturas/latest (${res.status})`);
  return res.json();
}

export async function createLectura(
  data: Omit<Lectura, 'id' | 'estado' | 'motivo'>,
): Promise<Lectura> {
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/lecturas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const parsed = await parseResponse(res);
  if (!parsed.ok)
    throw new Error(
      parsed.body?.detail || `Error POST /lecturas (${parsed.status})`,
    );
  return parsed.body as Lectura;
}

/** Histórico */
export async function getHistory(
  maquinaria_id: string,
  limit: number = 100,
): Promise<Lectura[]> {
  const BASE = getEffectiveBase();
  const res = await fetch(
    `${BASE}/lecturas/maquina/${maquinaria_id}?limit=${limit}`,
  );
  if (!res.ok) throw new Error(`Error /lecturas/maquina (${res.status})`);
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
  const BASE = getEffectiveBase();
  const res = await fetch(`${BASE}/lecturas/resumen`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Error /lecturas/resumen (${res.status})`);
  return res.json();
}
