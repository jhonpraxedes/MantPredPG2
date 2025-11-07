import request from '@/utils/request';

export interface LecturaDTO {
  id?: number;
  maquinaria_id?: string;
  numero_serie?: string;
  temperatura?: number;
  vibracion?: number;
  presion_aceite?: number;
  ts?: string;
  estado?: string;
  motivo?: string;
}

export async function getLatestLecturas(): Promise<LecturaDTO[]> {
  return request('/lecturas/latest', {
    method: 'GET',
  });
}

export async function getLecturasByMaquina(maquinariaId: string, limit: number = 100): Promise<LecturaDTO[]> {
  return request(`/lecturas/maquina/${maquinariaId}?limit=${limit}`, {
    method: 'GET',
  });
}

export async function getResumen() {
  return request('/lecturas/resumen', {
    method: 'GET',
  });
}