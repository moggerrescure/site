'use strict';

require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const { confirmLoginToken } = require('./lib/tg-login');
const { relayFromUserToAdmin, handleAdminMessage } = require('./lib/relay');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const SITE_URL = process.env.SITE_URL || '';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN не задан в .env');
  process.exit(1);
}
if (!ADMIN_CHAT_ID) {
  console.error('ADMIN_CHAT_ID не задан в .env (нужен для пересылки поддержки)');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const payload = (ctx.startPayload || '').trim();

  if (payload.startsWith('login_')) {
    const token = payload.slice(6);
    try {
      const result = await confirmLoginToken(token, ctx.from);
      if (result.ok) {
        return ctx.reply('Вход подтверждён!\n\nВозвращайтесь на сайт — через несколько секунд вы будете автоматически залогинены.', Markup.removeKeyboard());
      }
      const reasonMap = {
        not_found:          'Токен не найден или уже использован.',
        status_consumed:    'Этот токен уже использован.',
        status_ready:       'Этот токен уже подтверждён, возвращайтесь на сайт.',
        status_expired:     'Срок действия токена истёк. Запросите новый.',
        expired:            'Срок действия токена истёк (5 минут). Запросите новый.',
        user_create_failed: 'Не удалось создать пользователя.',
      };
      return ctx.reply(reasonMap[result.reason] || ('Ошибка: ' + result.reason), Markup.removeKeyboard());
    } catch (e) {
      console.error('[bot.start] login confirm error:', e.message);
      return ctx.reply('Ошибка подтверждения входа. Попробуйте ещё раз с сайта.', Markup.removeKeyboard());
    }
  }

  const siteLine = SITE_URL ? ('\nСайт: ' + SITE_URL) : '';
  return ctx.reply(
    'Здравствуйте!\n\n' +
    'Этот бот используется только для:\n' +
    '— подтверждения входа на сайт\n' +
    '— связи с поддержкой' + siteLine + '\n\n' +
    'Если у вас вопрос — напишите его в этот чат, мы ответим. /help — подробнее.'
  , Markup.removeKeyboard());
});

bot.help(async (ctx) => {
  return ctx.reply(
    'Возможности бота:\n\n' +
    '1, Markup.removeKeyboard()) Вход на сайт — нажмите на сайте «Войти через Telegram», ссылка для подтверждения придёт сюда.\n\n' +
    '2) Поддержка — напишите боту любое сообщение (текст, фото, документ). Мы получим уведомление и ответим прямо в этом чате.'
  );
});

bot.on('message', async (ctx) => {
  if (ctx.chat.type !== 'private') return;

  if (String(ctx.from.id) === String(ADMIN_CHAT_ID)) {
    return handleAdminMessage(ctx, bot);
  }

  try {
    await relayFromUserToAdmin(ctx, bot, ADMIN_CHAT_ID);
    await ctx.reply('Ваше сообщение отправлено в поддержку. Мы ответим вам в этом чате.', Markup.removeKeyboard());
  } catch (e) {
    if (e.message === 'rate_limited') {
      return ctx.reply('Слишком много сообщений. Подождите минуту и попробуйте снова.', Markup.removeKeyboard());
    }
    console.error('[support relay] error:', e.message);
    return ctx.reply('Не удалось отправить сообщение. Попробуйте позже.', Markup.removeKeyboard());
  }
});

bot.telegram.setMyCommands([
  { command: 'start', description: 'Начало работы' },
  { command: 'help',  description: 'Что умеет этот бот' },
]).catch((e) => console.error('[setMyCommands] failed:', e.message));

bot.launch()
  .then(() => process.stdout.write('SecureShip Bot запущен (verification + support relay)\n'))
  .catch((err) => {
    process.stderr.write('Ошибка запуска: ' + err.message + '\n');
    process.exit(1);
  });

bot.catch((err) => console.error('[bot.catch]:', err.message));

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
