/**
 * my-pages.js — Просмотр и управление своими страницами
 */

'use strict';

const { Markup } = require('telegraf');
const db = require('../db');

async function myPages(ctx) {
  const telegramId = String(ctx.from.id);
  const user = db.getOrCreateUser(telegramId);
  const profiles = db.getProfilesByOwner(user.id);

  if (!profiles.length) {
    return ctx.reply(
      '📋 У вас пока нет страниц памяти.\n\n' +
      'Нажмите «Создать страницу памяти» чтобы начать.',
      Markup.keyboard([
        ['🕯 Создать страницу памяти'],
        ['📋 Мои страницы', '❓ Помощь'],
      ]).resize()
    );
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

  const list = profiles.map((p, i) => {
    return `${i + 1}. *${p.full_name}* (${p.dates})\n   🔗 ${siteUrl}/person.html?id=${p.id}`;
  }).join('\n\n');

  const buttons = profiles.map(p => [
    Markup.button.callback(`✏️ ${p.full_name.slice(0, 20)}`, `edit_${p.id.slice(0, 30)}`),
    Markup.button.callback('🗑', `delete_${p.id.slice(0, 30)}`),
  ]);

  return ctx.reply(
    `📋 *Ваши страницы памяти (${profiles.length}):*\n\n${list}`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  );
}

function handleEdit(ctx, data) {
  const profileId = data.replace('edit_', '');
  ctx.answerCbQuery();

  return ctx.reply(
    '✏️ *Редактирование*\n\n' +
    'Скоро здесь будет Mini App для редактирования страницы.\n' +
    `ID: \`${profileId}\``,
    { parse_mode: 'Markdown' }
  );
}

function handleDelete(ctx, data) {
  const profileId = data.replace('delete_', '');
  ctx.answerCbQuery();

  return ctx.reply(
    '⚠️ *Удалить страницу?*\n\n' +
    'Это действие нельзя отменить. Все данные будут потеряны.',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🗑 Да, удалить', `confirm_delete_${profileId}`)],
        [Markup.button.callback('↩️ Отмена', 'cancel_delete')],
      ])
    }
  );
}

module.exports = { myPages, handleEdit, handleDelete };
