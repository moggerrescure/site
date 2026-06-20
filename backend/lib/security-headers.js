// __SECURITY_HEADERS_V1__
const helmet = require("helmet");

const connectSrc = ["'self'", "https:"];
if (process.env.NODE_ENV !== "production") {
  connectSrc.push(
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
    "ws://localhost:5500",
    "ws://127.0.0.1:5500"
  );
}

module.exports = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src":  ["'self'", "'unsafe-inline'", "https://telegram.org", "https://oauth.telegram.org", "https://cdnjs.cloudflare.com"],
      "style-src":   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src":    ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src":     ["'self'", "data:", "blob:", "https:"],
      "media-src":   ["'self'", "blob:", "https:"],
      "connect-src": connectSrc,
      "frame-src":   ["https://oauth.telegram.org"],
      "object-src":  ["'none'"],
      "base-uri":    ["'self'"],
      "upgrade-insecure-requests": null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false, // HSTS выставляется на Caddy (там терминируется TLS) — см. Caddyfile

});
