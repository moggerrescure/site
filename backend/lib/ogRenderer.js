'use strict';
/*
 * Server-side Open Graph injector for /p/:slug.
 * Тянет шаблон person.html из контейнера фронтенда по same-network HTTP,
 * кеширует in-memory, подставляет мета-теги и отдаёт клиенту.
 *
 * FRONTEND_URL по умолчанию http://frontend (имя сервиса в docker-compose).
 * Если у тебя другой service-name — задай FRONTEND_URL в backend/.env.
 */

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://frontend').replace(/\/$/, '');
const TEMPLATE_TTL_MS = 60 * 1000;

let cache = { html: null, fetchedAt: 0 };

async function loadTemplate() {
  const now = Date.now();
  if (cache.html && (now - cache.fetchedAt) < TEMPLATE_TTL_MS) return cache.html;
  const r = await fetch(`${FRONTEND_URL}/person.html`, { headers: { 'X-Internal-OG': '1' } });
  if (!r.ok) throw new Error(`person.html fetch failed: ${r.status} from ${FRONTEND_URL}`);
  const html = await r.text();
  cache = { html, fetchedAt: now };
  return html;
}

function htmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertMeta(html, attr, key, content) {
  const value = htmlEscape(content);
  const re = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*\\/?>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${value}"/>`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function replaceTitle(html, title) {
  const t = htmlEscape(title);
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);
  }
  return html.replace(/<\/head>/i, `  <title>${t}</title>\n</head>`);
}

/**
 * @param {object|null} profile  data из getProfileDetail (или null если не нашли / protected)
 * @param {string} canonicalUrl  https://host/p/slug
 */
async function renderPersonHtml(profile, canonicalUrl) {
  let html = await loadTemplate();

  // teaser отдаёт isProtected:true — для него тоже не светим данные
  const safe = !!profile && profile.visibility !== 'PRIVATE' && !profile.isProtected;
  const name  = safe ? (profile.name || 'Страница памяти') : 'Страница памяти';
  const years = safe ? (profile.years || '') : '';
  const city  = safe ? (profile.city  || '') : '';
  const bio   = safe ? (profile.bio   || '') : '';

  const title = years ? `${name} (${years}) — Память` : `${name} — Память`;

  const descParts = [];
  if (years) descParts.push(years);
  if (city)  descParts.push(city);
  if (bio)   descParts.push(bio.replace(/\s+/g, ' ').slice(0, 160));
  const description = descParts.length
    ? descParts.join(' · ').slice(0, 300)
    : 'Биография, воспоминания близких и место захоронения.';

  let imageUrl = '';
  if (safe && profile.photo) {
    try {
      imageUrl = /^https?:\/\//i.test(profile.photo)
        ? profile.photo
        : new URL(profile.photo, canonicalUrl).toString();
    } catch (_) { imageUrl = ''; }
  }

  html = replaceTitle(html, title);
  html = upsertMeta(html, 'name',     'description',     description);
  html = upsertMeta(html, 'property', 'og:title',        title);
  html = upsertMeta(html, 'property', 'og:description',  description);
  html = upsertMeta(html, 'property', 'og:type',         'profile');
  html = upsertMeta(html, 'property', 'og:url',          canonicalUrl);
  html = upsertMeta(html, 'property', 'og:site_name',    'Память');
  html = upsertMeta(html, 'property', 'og:locale',       'ru_RU');
  if (imageUrl) {
    html = upsertMeta(html, 'property', 'og:image',       imageUrl);
    html = upsertMeta(html, 'name',     'twitter:image',  imageUrl);
    html = upsertMeta(html, 'name',     'twitter:card',   'summary_large_image');
  } else {
    html = upsertMeta(html, 'name',     'twitter:card',   'summary');
  }
  html = upsertMeta(html, 'name', 'twitter:title',        title);
  html = upsertMeta(html, 'name', 'twitter:description',  description);

  return html;
}

module.exports = { renderPersonHtml };
