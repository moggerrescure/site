'use strict';
/*
 * Server-side Open Graph injector for /p/:slug.
 * Тянет шаблон person.html из контейнера фронтенда по same-network HTTP,
 * кеширует in-memory, подставляет мета-теги и отдаёт клиенту.
 *
 * FRONTEND_URL по умолчанию http://frontend (имя сервиса в docker-compose).
 * Если у тебя другой service-name — задай FRONTEND_URL в backend/.env.
 */

const seo = require('./seo');

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

function upsertLink(html, rel, href) {
  const value = htmlEscape(href);
  const re = new RegExp(`<link\\s+rel=["']${rel}["'][^>]*\\/?>`, 'i');
  const tag = `<link rel="${rel}" href="${value}"/>`;
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

  // ── Приватность: данные/индексацию отдаём ТОЛЬКО для PUBLIC ──
  // UNLISTED («по ссылке»), PASSWORD (teaser, isProtected) и PRIVATE/404 (profile=null)
  // получают нейтральную заглушку + noindex, без утечки имени/био/фото.
  const isPublic = !!profile && profile.visibility === 'PUBLIC' && !profile.isProtected;

  let origin = '';
  try { origin = new URL(canonicalUrl).origin; } catch (_) { origin = ''; }

  const name  = isPublic ? (profile.name || 'Страница памяти') : 'Страница памяти';
  const years = isPublic ? (profile.years || '') : '';
  const city  = isPublic ? (profile.city  || '') : '';
  const bio   = isPublic ? (profile.bio   || '') : '';

  const title = isPublic
    ? (years ? `${name} (${years}) — ${seo.BRAND_NAME}` : `${name} — ${seo.BRAND_NAME}`)
    : `Страница памяти — ${seo.BRAND_NAME}`;

  const descParts = [];
  if (years) descParts.push(years);
  if (city)  descParts.push(city);
  if (bio)   descParts.push(bio.replace(/\s+/g, ' ').slice(0, 160));
  const description = isPublic && descParts.length
    ? descParts.join(' · ').slice(0, 300)
    : `Страница памяти на сервисе ${seo.BRAND_NAME} — сохраните историю семьи и закажите QR-табличку.`;

  let imageUrl = '';
  if (isPublic && profile.photo) {
    try {
      imageUrl = /^https?:\/\//i.test(profile.photo)
        ? profile.photo
        : new URL(profile.photo, canonicalUrl).toString();
    } catch (_) { imageUrl = ''; }
  }

  html = replaceTitle(html, title);
  html = upsertMeta(html, 'name',     'description',     description);

  // Поисковые директивы: публичное индексируем, остальное — нет.
  html = upsertMeta(html, 'name', 'robots',
    isPublic ? 'index,follow,max-image-preview:large,max-snippet:-1' : 'noindex,nofollow');

  // Canonical только для публичных (для непубличных канон не светим).
  if (isPublic) html = upsertLink(html, 'canonical', canonicalUrl);

  html = upsertMeta(html, 'property', 'og:title',        title);
  html = upsertMeta(html, 'property', 'og:description',  description);
  html = upsertMeta(html, 'property', 'og:type',         isPublic ? 'profile' : 'website');
  html = upsertMeta(html, 'property', 'og:url',          canonicalUrl);
  html = upsertMeta(html, 'property', 'og:site_name',    seo.BRAND_NAME);
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

  // JSON-LD Person + ProfilePage + Breadcrumb — машиночитаемые факты для Google и ИИ-движков.
  // Строго для публичных профилей.
  if (isPublic && origin) {
    try {
      const ld = seo.personGraph(
        { name, years, city, bio, photo: profile.photo },
        canonicalUrl,
        origin,
      );
      html = html.replace(/<\/head>/i, `  ${ld}\n</head>`);
    } catch (_) { /* JSON-LD не критичен — не валим рендер */ }
  }

  return html;
}

module.exports = { renderPersonHtml };
