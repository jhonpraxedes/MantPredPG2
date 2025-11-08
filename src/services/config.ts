// src/services/config.ts
const FALLBACK_PROD = 'https://mantpredpg2-production.up.railway.app';

export function getEffectiveBase(): string {
  // Prefer env in build (Vite)
  const fromImportMeta = (import.meta as any)?.env?.VITE_API_BASE_URL;
  const fromProcess = (process as any)?.env?.VITE_API_BASE_URL;
  const fromWindow =
    typeof window !== 'undefined'
      ? (window as any).__env?.VITE_API_BASE_URL
      : undefined;

  let API_BASE =
    fromImportMeta || fromProcess || fromWindow || 'http://127.0.0.1:8001';

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocalhost && API_BASE.includes('127.0.0.1')) {
      API_BASE = FALLBACK_PROD;
    }
  }
  return API_BASE;
}
