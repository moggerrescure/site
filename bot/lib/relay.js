'use strict';

// In-memory rate limit: 5 сообщений / минуту с одного user_id
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 5;
const userTimestamps = new Map();

function checkRate(userId) {
  const now = Date.now();
  const arr = (userTimestamps.get(userId) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  userTimestamps.set(userId, arr);
  return true;
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"]/g, ch => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;' }[ch]));
}

/**
 * Юзер -> Админ:
 *  1) Шлём админу header с инфо об отправителе
 *  2) copyMessage оригинала (поддерживает text/photo/video/voice/document/sticker)
 */
async function relayFromUserToAdmin(ctx, bot, ADMIN_CHAT_ID) {
  const from = ctx.from;
  if (!checkRate(from.id)) throw new Error('rate_limited');

  const userName = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'без имени';
  const userTag  = from.username ? '@' + from.username : '(без username)';

  const header =
    '📩 <b>Сообщение в поддержку</b>\n' +
    'От: <b>' + escapeHtml(userName) + '</b> ' + escapeHtml(userTag) + '\n' +
    'ID: <code>' + from.id + '</code>\n' +
    '<a href="tg://user?id=' + from.id + '">Открыть профиль</a>\n\n' +
    '<i>Ответьте Reply на это сообщение или используйте</i>\n' +
    '<code>/reply ' + from.id + ' ваш ответ</code>';

  await bot.telegram.sendMessage(ADMIN_CHAT_ID, header, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
  await bot.telegram.copyMessage(ADMIN_CHAT_ID, ctx.chat.id, ctx.message.message_id);
}

/**
 * Админ -> Юзер:
 *  - /reply <user_id> <text> → бот шлёт юзеру
 *  - Reply на header (где написано ID:) → бот копирует сообщение админа юзеру
 *  - Обычное сообщение админа боту без reply/команды → игнор
 */
async function handleAdminMessage(ctx, bot) {
  const text = ctx.message.text || ctx.message.caption || '';

  // /reply <id> <text>
  const m = text.match(/^\/reply\s+(\d+)\s+([\s\S]+)$/);
  if (m) {
    const targetId = m[1];
    const body = m[2];
    try {
      await bot.telegram.sendMessage(targetId, '💬 ' + body);
      await ctx.reply('✅ Отправлено пользователю ' + targetId);
    } catch (e) {
      await ctx.reply('❌ Не доставлено: ' + e.message);
    }
    return;
  }

  // Reply на header → достаём ID
  const reply = ctx.message.reply_to_message;
  if (reply) {
    const rText = reply.text || reply.caption || '';
    const idMatch = rText.match(/ID:\s*(\d+)/);
    if (idMatch) {
      const targetId = idMatch[1];
      try {
        await bot.telegram.copyMessage(targetId, ctx.chat.id, ctx.message.message_id);
        await ctx.reply('✅ Ответ доставлен пользователю ' + targetId);
      } catch (e) {
        await ctx.reply('❌ Не доставлено: ' + e.message);
      }
      return;
    }
  }
  // Игнор всего остального
}

module.exports = { relayFromUserToAdmin, handleAdminMessage };
