'use strict';

/**
 * Тонкий клиент к OpenAI-совместимому API (aihubmix и т.п.).
 * Конфигурация — через env: AI_BASE_URL, AI_API_KEY, AI_MODEL.
 * На Node >=22 fetch/AbortController доступны глобально — доп. зависимостей нет.
 */

const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://aihubmix.com/v1').replace(/\/+$/, '');
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);

async function chatCompletion(messages, opts = {}) {
  const { temperature = 0.75, maxTokens = 900, json = true } = opts;

  if (!AI_API_KEY) {
    const e = new Error('AI_API_KEY is not set');
    e.code = 'AI_NOT_CONFIGURED';
    throw e;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + AI_API_KEY,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e = new Error(`AI upstream ${res.status}: ${body.slice(0, 300)}`);
      e.code = 'AI_UPSTREAM';
      e.status = res.status;
      throw e;
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chatCompletion, AI_MODEL, AI_BASE_URL };