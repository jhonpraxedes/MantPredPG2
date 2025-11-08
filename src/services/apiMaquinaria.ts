// src/services/apiMaquinaria.ts
import { Maquinaria } from '@/constants/maquinaria';

// Lectura segura de variable de entorno (compatible con Vite, Webpack, etc.)
import { getEffectiveBase } from './config';
const API_BASE = getEffectiveBase();

// Obtener todas las máquinas
export async function getMaquinaria(): Promise<Maquinaria[]> {
  const res = await fetch(`${API_BASE}/maquinaria`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al obtener maquinaria');
  return res.json();
}

// Crear nueva máquina
export async function createMaquinaria(
  data: Partial<Maquinaria>,
): Promise<Maquinaria> {
  const payload = {
    ...data,
    id: data.numero_serie || data.id,
  };

  const res = await fetch(`${API_BASE}/maquinaria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear maquinaria');
  }

  const created = await res.json();

  // Emitir evento global para que el Dashboard lo escuche
  window.dispatchEvent(
    new CustomEvent('maquinaria:created', { detail: created }),
  );

  return created;
}

// Eliminar una máquina
export async function deleteMaquinaria(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar maquinaria');
  }
  window.dispatchEvent(new CustomEvent('maquinaria:deleted', { detail: id }));
}

// Actualizar máquina
export async function updateMaquinaria(
  id: string,
  data: Partial<Maquinaria>,
): Promise<Maquinaria> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar maquinaria');
  }

  const updated = await res.json();
  window.dispatchEvent(
    new CustomEvent('maquinaria:updated', { detail: updated }),
  );
  return updated;
}

export async function generateHistoricoForMachine(
  machineryId: string,
  days: number = 7,
  everyMinutes: number = 10,
) {
  const url = `${API_BASE}/seed/historico/maquina/${encodeURIComponent(
    machineryId,
  )}?days=${encodeURIComponent(days)}&every_minutes=${encodeURIComponent(
    everyMinutes,
  )}`;

  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || 'Error generando histórico para la máquina',
    );
  }
  return res.json();
}
