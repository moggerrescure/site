/* ═══════════════════════════════════════════════
   API CLIENT — thin wrapper around fetch()
   Auto-detects base URL: if served from Node
   server, uses same origin; otherwise localhost:3000
   ═══════════════════════════════════════════════ */

const API = (() => {
  /* Base URL: same origin when served by Node, else dev fallback */
  const BASE = window.location.port === '3000'
    ? ''                          // same-origin (Node serves everything)
    : 'http://localhost:3000';    // separate dev server

  /* Storage for JWT */
  const TOKEN_KEY = 'memory_jwt';

  function getToken()         { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t)        { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

  /* Core fetch wrapper */
  async function req(method, path, body, isForm) {
    const headers = {};
    const tok = getToken();
    if (tok) headers['Authorization'] = 'Bearer ' + tok;
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    const opts = {
      method,
      headers,
      body: isForm ? body : (body ? JSON.stringify(body) : undefined),
    };

    const res  = await fetch(BASE + path, opts);
    const json = await res.json().catch(() => ({}));
    if (!res.ok && !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  }

  return {
    get:    (path)         => req('GET',    path),
    post:   (path, body)   => req('POST',   path, body),
    put:    (path, body)   => req('PUT',    path, body),
    del:    (path)         => req('DELETE', path),
    upload: (path, form)   => req('POST',   path, form, true),

    /* Auth helpers */
    getToken, setToken,
    isLoggedIn: () => !!getToken(),

    async login(email, password) {
      const r = await req('POST', '/api/auth/login', { email, password });
      setToken(r.token);
      return r;
    },
    async register(name, email, password) {
      const r = await req('POST', '/api/auth/register', { name, email, password });
      setToken(r.token);
      return r;
    },
    logout() { setToken(null); },
  };
})();
