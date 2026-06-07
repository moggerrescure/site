// __SECURITY_HEADERS_V1__
const helmet = require("helmet");

module.exports = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src":  ["'self'", "'unsafe-inline'", "https://telegram.org", "https://oauth.telegram.org"],
      "style-src":   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src":    ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src":     ["'self'", "data:", "blob:", "https:"],
      "media-src":   ["'self'", "blob:", "https:"],
      "connect-src": ["'self'", "https:"],
      "frame-src":   ["https://oauth.telegram.org"],
      "object-src":  ["'none'"],
      "base-uri":    ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false, // HSTS выставляется на Caddy (там терминируется TLS) — см. Caddyfile

});
