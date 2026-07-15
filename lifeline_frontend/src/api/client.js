const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";

const TOKEN_KEY = "lifeline_tokens"; // { access, refresh }

export function getTokens() {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setTokens(tokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  const res = await fetch(`${API_BASE}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  const updated = { ...tokens, access: data.access };
  setTokens(updated);
  return updated.access;
}

/**
 * Central request helper. Attaches the JWT access token automatically,
 * retries once with a refreshed token on a 401, and throws a normalized
 * Error (with .status and .data) on failure so callers can show a message.
 */
export async function apiRequest(path, { method = "GET", body, auth = true, isForm = false } = {}) {
  const tokens = getTokens();
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth && tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const doFetch = async (accessOverride) => {
    const h = { ...headers };
    if (accessOverride) h["Authorization"] = `Bearer ${accessOverride}`;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers: h,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await doFetch(newAccess);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.detail || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => apiRequest(path, { method: "GET" }),
  post: (path, body, opts = {}) => apiRequest(path, { method: "POST", body, ...opts }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  del: (path) => apiRequest(path, { method: "DELETE" }),
};

export { API_BASE };
