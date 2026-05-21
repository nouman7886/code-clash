const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  'https://code-clash-jkdd.onrender.com';

const BASE = `${BACKEND_URL.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

async function request(method, path, body) {

  const res = await fetch(`${BASE}${path}`, {

    method,

    headers: {
      'Content-Type': 'application/json',
    },

    body: body
      ? JSON.stringify(body)
      : undefined,

  });

  const data = await res.json();

  if (!res.ok) {

    throw new Error(
      data.error || `HTTP ${res.status}`
    );

  }

  return data;

}

export const api = {

  get: path =>
    request('GET', path),

  post: (path, body) =>
    request('POST', path, body),

  put: (path, body) =>
    request('PUT', path, body),

  delete: path =>
    request('DELETE', path),

};
