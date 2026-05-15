/**
 * create-profile.js — Wizard создания профиля
 * 
 * Шаги:
 * 1. fullName  — ФИО
 * 2. dates     — Даты жизни
 * 3. mainPhoto — Главное фото (или пропустить)
 * 4. mainText  — Основной текст / эпитафия
 * → далее передаёт в block-wizard для 6 контент-блоков
 */

'use strict';

const { Markup } = require('telegraf');
const { blockWizard } = require('./block-wizard');
const { downloadAndConvert } = require('../photo');

const createProfile = {

  /* ── Шаг 1: Запрос ФИО ── */
  start(ctx) {
    ctx.session.wizard = {
      step: 'fullName',
      data: {
        telegramId: String(ctx.from.id),
        fullName: '',
        dates: '',
        mainPhoto: null,    // file_id или null
        mainText: '',
        blocks: [],         // [{text, photo}] × 6
      }
    };

    return ctx.reply(
      '🕯 *Создание страницы памяти*\n\n' +
      'Сейчас я проведу вас через несколько шагов.\n' +
      'Вы расскажете о человеке, а я соберу из этого страницу.\n\n' +
      '📝 *Шаг 1/10 — ФИО*\n\n' +
      'Введите полное имя человека:\n' +
      '_(Например: Иванова Мария Петровна)_',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Обработка ФИО ── */
  handleFullName(ctx) {
    const name = ctx.message.text.trim();
    if (name.length < 3) {
      return ctx.reply('⚠️ Имя слишком короткое. Введите полное ФИО:');
    }
    if (name.length > 100) {
      return ctx.reply('⚠️ Слишком длинное (макс. 100 символов). Попробуйте ещё раз:');
    }

    ctx.session.wizard.data.fullName = name;
    ctx.session.wizard.step = 'dates';

    return ctx.reply(
      '📝 *Шаг 2/10 — Даты жизни*\n\n' +
      'Введите даты рождения и смерти:\n' +
      '_(Например: 12.03.1918 — 05.11.1987)_',
      { parse_mode: 'Markdown' }
    );
  },

  /* ── Обработка дат ── */
  handleDates(ctx) {
    const dates = ctx.message.text.trim();
    if (dates.length < 4) {
      return ctx.reply('⚠️ Введите хотя бы год рождения (например: 1950–2020):');
    }

    ctx.session.wizard.data.dates = dates;
    ctx.session.wizard.step = 'mainPhoto';

    return ctx.reply(
      '📷 *Шаг 3/10 — Главное фото*\n\n' +
      'Отправьте главную фотографию для страницы.\n' +
      'Это фото будет в шапке (Hero-блок).\n\n' +
      '⚠️ _Главное фото обязательно._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Получили главное фото ── */
  async handleMainPhoto(ctx) {
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;

    await ctx.reply('⏳ Обрабатываю фото...');

    try {
      const url = await downloadAndConvert(ctx.telegram.token ? ctx : ctx, fileId);
      ctx.session.wizard.data.mainPhoto = url;
    } catch (err) {
      ctx.session.wizard.data.mainPhoto = null;
      await ctx.reply('⚠️ Не удалось обработать фото: ' + err.message + '\nПопробуйте другое фото:');
      return;
    }

    return this._askMainText(ctx);
  },

  /* ── Пропуск главного фото — ЗАПРЕЩЁН, фото обязательно ── */
  skipMainPhoto(ctx) {
    ctx.answerCbQuery('Главное фото обязательно');
    return ctx.reply('⚠️ Главное фото обязательно. Отправьте фотографию:');
  },

  /* ── Шаг 4: Основной текст ── */
  _askMainText(ctx) {
    ctx.session.wizard.step = 'mainText';

    return ctx.reply(
      '📝 *Шаг 4/10 — Основной текст*\n\n' +
      'Напишите краткую эпитафию или главный текст о человеке.\n' +
      'Он будет отображаться в шапке страницы рядом с фото.\n\n' +
      '_(1-3 предложения, до 500 символов)_',
      { parse_mode: 'Markdown' }
    );
  },

  /* ── Обработка основного текста ── */
  handleMainText(ctx) {
    const text = ctx.message.text.trim();
    if (text.length < 10) {
      return ctx.reply('⚠️ Текст слишком короткий (минимум 10 символов):');
    }
    if (text.length > 500) {
      return ctx.reply('⚠️ Слишком длинный (макс. 500 символов). Сократите:');
    }

    ctx.session.wizard.data.mainText = text;

    // Переходим к блокам
    return blockWizard.startBlocks(ctx);
  },

  /* ── Подтверждение публикации ── */
  async confirmPublish(ctx) {
    ctx.answerCbQuery('Публикуем...');
    await ctx.reply('⏳ Сохраняю страницу и обрабатываю фото...');

    const data = ctx.session.wizard.data;
    const db = require('../db');

    // 1. Создаём/находим пользователя
    const user = db.getOrCreateUser(data.telegramId);

    // 2. Конвертируем фото блоков (file_id → webp URL)
    const processedBlocks = [];
    for (const block of data.blocks) {
      let imageUrl = null;
      if (block.photo) {
        try {
          imageUrl = await downloadAndConvert(ctx, block.photo);
        } catch (err) {
          // Если не удалось — пропускаем фото
          imageUrl = null;
        }
      }
      processedBlocks.push({ text: block.text || '', imageUrl });
    }

    // 3. Создаём профиль
    const profile = db.createProfile({
      ownerId: user.id,
      fullName: data.fullName,
      dates: data.dates,
      mainText: data.mainText,
      mainPhotoUrl: data.mainPhoto,
      isPublic: data.isPublic !== false,
    });

    // 4. Создаём контент-блоки
    db.createContentBlocks(profile.id, processedBlocks);

    // 5. Создаём цитаты
    if (data.quotes && data.quotes.length) {
      db.createQuotes(profile.id, data.quotes);
    }

    // 6. Формируем ссылку
    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const pageUrl = `${siteUrl}/person.html?id=${profile.id}`;

    // Превью блоков
    const TITLES = ['Детство', 'Образование', 'Карьера', 'Семья', 'Хобби', 'Наследие'];
    const blocksPreview = data.blocks
      .map((b, i) => {
        const hasPhoto = b.photo ? '📷' : '—';
        const textPreview = b.text ? b.text.slice(0, 40) + '...' : '(пусто)';
        return `  ${i + 1}. ${TITLES[i]} ${hasPhoto} ${textPreview}`;
      })
      .join('\n');

    ctx.session = {};

    return ctx.reply(
      '✅ *Страница памяти создана!*\n\n' +
      `👤 *${data.fullName}*\n` +
      `📅 ${data.dates}\n` +
      `📷 Главное фото: ✅\n\n` +
      `📄 Блоки:\n${blocksPreview}\n\n` +
      `🔗 Ссылка: ${pageUrl}\n\n` +
      `🆔 ID: \`${profile.id}\``,
      { parse_mode: 'Markdown' }
    );
  },

  /* ── Отмена ── */
  cancel(ctx) {
    ctx.answerCbQuery('Отменено');
    ctx.session = {};
    return ctx.reply(
      '❌ Создание отменено.\n\nНажмите /start чтобы начать заново.',
      Markup.keyboard([
        ['🕯 Создать страницу памяти'],
        ['📋 Мои страницы', '❓ Помощь'],
      ]).resize()
    );
  }
};

module.exports = { createProfile };
