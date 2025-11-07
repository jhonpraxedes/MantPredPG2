// src/services/apiMaquinaria.ts
import { Maquinaria } from '@/constants/maquinaria';

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:8001';

// Obtener todas las máquinas
export async function getMaquinaria(): Promise<Maquinaria[]> {
  const res = await fetch(`${API_BASE}/maquinaria`);
  if (!res.ok) throw new Error('Error al obtener maquinaria');
  return res.json();
}

// Crear nueva máquina
export async function createMaquinaria(data: Partial<Maquinaria>): Promise<Maquinaria> {
  // Asegurar que id = numero_serie para el backend
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
  return res.json();
}

// Eliminar una máquina
export async function deleteMaquinaria(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar maquinaria');
  }
}

// Actualizar máquina
export async function updateMaquinaria(id: string, data: Partial<Maquinaria>): Promise<Maquinaria> {
  const res = await fetch(`${API_BASE}/maquinaria/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al actualizar maquinaria');
  }
  return res.json();
}