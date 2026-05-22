/* ═══════════════════════════════════════════════
   API CLIENT — AbortController timeout (3s),
   auto-detects base URL
   ═══════════════════════════════════════════════ */

const API = (() => {
  const BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';
  const TOKEN_KEY = 'memory_jwt';
  const TIMEOUT_MS = 3000;

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

  // Global fetch interceptor to automatically append JWT bearer token to any /api/ requests
  const originalFetch = window.fetch;
  window.fetch = async function (resource, options = {}) {
    const url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.href : resource?.url || '');
    if (url && (url.startsWith('/api/') || url.includes('/api/'))) {
      const token = getToken();
      if (token) {
        options.headers = options.headers || {};
        if (options.headers instanceof Headers) {
          if (!options.headers.has('Authorization')) {
            options.headers.set('Authorization', 'Bearer ' + token);
          }
        } else if (Array.isArray(options.headers)) {
          if (!options.headers.some(([key]) => key.toLowerCase() === 'authorization')) {
            options.headers.push(['Authorization', 'Bearer ' + token]);
          }
        } else {
          if (!options.headers['Authorization'] && !options.headers['authorization']) {
            options.headers['Authorization'] = 'Bearer ' + token;
          }
        }
      }
    }
    return originalFetch.call(this, resource, options);
  };

  async function req(method, path, body, isForm) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const headers = {};
    const tok = getToken();
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    try {
      const res  = await fetch(BASE + path, {
        method,
        headers,
        body: isForm ? body : (body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = await res.json().catch(() => ({}));
      if (!res.ok && !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Сервер недоступен');
      throw err;
    }
  }

  return {
    get:    (path)       => req('GET',    path),
    post:   (path, body) => req('POST',   path, body),
    put:    (path, body) => req('PUT',    path, body),
    del:    (path)       => req('DELETE', path),
    upload: (path, form) => req('POST',   path, form, true),

    getToken, setToken,
    isLoggedIn: () => !!getToken(),
    getUser() {
      try {
        const u = localStorage.getItem('memory_user');
        return u ? JSON.parse(u) : null;
      } catch {
        return null;
      }
    },

    async login(email, password) {
      const r = await req('POST', '/api/auth/login', { email, password });
      setToken(r.token);
      if (r.user) localStorage.setItem('memory_user', JSON.stringify(r.user));
      return r;
    },
    async register(name, email, password) {
      const r = await req('POST', '/api/auth/register', { name, email, password });
      setToken(r.token);
      if (r.user) localStorage.setItem('memory_user', JSON.stringify(r.user));
      return r;
    },
    logout() {
      setToken(null);
      localStorage.removeItem('memory_user');
    },
  };
})();
