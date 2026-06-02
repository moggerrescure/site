'use strict';

const express = require('express');
const router = express.Router();

const { wrap, ApiError } = require('../middleware/errors');
const { optionalAuth } = require('../middleware/auth');
const { aiGenerationLimiter } = require('../middleware/rateLimit');
const { chatCompletion } = require('../lib/aiClient');
const { buildSystemPrompt } = require('../lib/aiPrompt');
const { containsProfanity, cleanProfanity } = require('../lib/profanity');

const MAX_MESSAGES = 24;
const MAX_LEN = 4000;

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_LEN) }));
}

/**
 * POST /api/ai/chat
 * body: { messages: [{role, content}], context: { field, originalText?, name?, dates? } }
 * resp: { ok, chatResponse, proposedText }
 *
 * optionalAuth   — если есть JWT, лимит считаем по пользователю, иначе по IP.
 * aiGenerationLimiter — 3 генерации, затем ~минута кулдауна.
 */
router.post('/chat', optionalAuth, aiGenerationLimiter, wrap(async (req, res) => {
  const { messages, context } = req.body || {};
  const ctx = context && typeof context === 'object' ? context : {};

  const field = typeof ctx.field === 'string' ? ctx.field.slice(0, 64) : 'text';
  const originalText = typeof ctx.originalText === 'string' ? ctx.originalText.slice(0, MAX_LEN) : '';
  const personName = typeof ctx.name === 'string' ? ctx.name.slice(0, 200) : '';
  const personDates = typeof ctx.dates === 'string' ? ctx.dates.slice(0, 120) : '';

  const history = sanitizeMessages(messages);
  if (!history.length) throw ApiError.badRequest('Пустой запрос к ИИ');

  // --- защита от матов на входе ---
  const userText = history.filter((m) => m.role === 'user').map((m) => m.content).join('\n') + '\n' + originalText;
  if (containsProfanity(userText)) {
    return res.json({
      ok: true,
      chatResponse:
        'Пожалуйста, переформулируйте запрос без нецензурной лексики — это страница памяти, и текст должен быть уважительным. Опишите обычными словами, о чём рассказать.',
      proposedText: '',
    });
  }

  const system = buildSystemPrompt({ field, originalText, personName, personDates });
  const aiMessages = [{ role: 'system', content: system }, ...history];

  let content;
  try {
    content = await chatCompletion(aiMessages, { temperature: 0.75, maxTokens: 900, json: true });
  } catch (err) {
    if (err.code === 'AI_NOT_CONFIGURED') {
      throw ApiError.internal('ИИ не настроен на сервере (не задан AI_API_KEY)');
    }
    console.error('[ai] upstream error:', err.message);
    throw new ApiError('Сервис ИИ временно недоступен, попробуйте позже', 502, 'AI_UNAVAILABLE');
  }

  // --- парсинг JSON-ответа модели ---
  let chatResponse = '';
  let proposedText = '';
  try {
    const parsed = JSON.parse(content);
    chatResponse = typeof parsed.chatResponse === 'string' ? parsed.chatResponse : '';
    proposedText = typeof parsed.proposedText === 'string' ? parsed.proposedText : '';
  } catch (_) {
    // модель вернула не-JSON — считаем весь ответ текстом
    proposedText = String(content || '').trim();
    chatResponse = 'Готово! Вот предложенный вариант — можно применить или попросить изменить.';
  }

  // --- защита от матов на выходе ---
  if (proposedText && containsProfanity(proposedText)) proposedText = cleanProfanity(proposedText);
  if (chatResponse && containsProfanity(chatResponse)) chatResponse = cleanProfanity(chatResponse);

  if (!chatResponse && proposedText) chatResponse = 'Вот предложенный вариант текста.';

  return res.json({ ok: true, chatResponse, proposedText });
}));

module.exports = router;