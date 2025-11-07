const API_BASE_URL = 'http://127.0.0.1:8001';

interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export default async function request(url: string, options: RequestOptions = { method: 'GET' }) {
  const { method, headers = {}, body } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `Error ${response.status}`);
  }

  return response.json();
}