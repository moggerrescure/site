/**
 * block-wizard.js — Пошаговое заполнение 6 контент-блоков
 * 
 * Каждый блок:
 *   1. Бот спрашивает текст (с подсказкой что писать)
 *   2. Пользователь пишет текст
 *   3. Бот спрашивает фото (или пропустить)
 *   4. Пользователь шлёт фото или жмёт "Пропустить"
 *   → Переход к следующему блоку
 * 
 * После 6-го блока → показ превью и кнопка "Опубликовать"
 */

'use strict';

const { Markup } = require('telegraf');

const BLOCK_SCHEMA = [
  {
    key: 'childhood',
    title: 'Детство и юность',
    prompt: 'Расскажите о детстве и юности.\n_(Где родился, как рос, семья, первые воспоминания)_',
  },
  {
    key: 'education',
    title: 'Образование',
    prompt: 'Расскажите об учёбе и становлении.\n_(Школа, институт, учителя, первые успехи)_',
  },
  {
    key: 'career',
    title: 'Профессиональный путь',
    prompt: 'Расскажите о работе и карьере.\n_(Где работал, чем занимался, достижения)_',
  },
  {
    key: 'family',
    title: 'Семья',
    prompt: 'Расскажите о семье.\n_(Супруг/а, дети, внуки, семейные традиции)_',
  },
  {
    key: 'hobbies',
    title: 'Хобби и увлечения',
    prompt: 'Расскажите о хобби и увлечениях.\n_(Что любил делать, чем увлекался, таланты)_',
  },
  {
    key: 'legacy',
    title: 'Наследие',
    prompt: 'Каким мы его/её помним?\n_(Главные качества, что оставил после себя, чему научил)_',
  },
];

const blockWizard = {

  /* ── Начало блоков (вызывается после mainText) ── */
  startBlocks(ctx) {
    ctx.session.wizard.data.blocks = [];
    ctx.session.wizard.currentBlock = 0;

    return this._askBlockText(ctx, 0);
  },

  /* ── Запрос текста для блока N ── */
  _askBlockText(ctx, index) {
    const block = BLOCK_SCHEMA[index];
    const stepNum = 5 + index; // шаги 5-10

    ctx.session.wizard.step = 'blockText';
    ctx.session.wizard.currentBlock = index;

    return ctx.reply(
      `📝 *Шаг ${stepNum}/10 — ${block.title}*\n\n` +
      `${block.prompt}\n\n` +
      `_(Блок ${index + 1} из 6. Минимум 20 символов, максимум 1000)_`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⏭ Пропустить блок', 'skip_block')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Получили текст блока ── */
  handleBlockText(ctx) {
    const text = ctx.message.text.trim();
    const index = ctx.session.wizard.currentBlock;

    if (text.length < 20) {
      return ctx.reply(
        '⚠️ Текст слишком короткий (минимум 20 символов).\n' +
        'Расскажите подробнее или нажмите «Пропустить этот блок».'
      );
    }
    if (text.length > 1000) {
      return ctx.reply('⚠️ Слишком длинный (макс. 1000 символов). Сократите:');
    }

    // Сохраняем текст, спрашиваем фото
    // Временно храним текст в сессии до получения фото
    ctx.session.wizard.pendingBlockText = text;
    ctx.session.wizard.step = 'blockPhoto';

    const block = BLOCK_SCHEMA[index];

    return ctx.reply(
      `📷 *Фото для блока «${block.title}»*\n\n` +
      'Отправьте фотографию для этого блока.\n' +
      'Она будет отображаться рядом с текстом в шахматном порядке.\n\n' +
      '_Или нажмите «Без фото»._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📝 Без фото', 'skip_block_photo')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Получили фото блока ── */
  handleBlockPhoto(ctx) {
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;
    const text = ctx.session.wizard.pendingBlockText || '';

    ctx.session.wizard.data.blocks.push({
      text,
      photo: fileId,
    });

    ctx.session.wizard.pendingBlockText = null;
    return this._nextBlock(ctx);
  },

  /* ── Пропуск фото блока (кнопка "Без фото") ── */
  skipBlockPhoto(ctx) {
    ctx.answerCbQuery('Без фото');

    const text = ctx.session.wizard.pendingBlockText || '';
    ctx.session.wizard.data.blocks.push({
      text,
      photo: null,
    });

    ctx.session.wizard.pendingBlockText = null;
    return this._nextBlock(ctx);
  },

  /* ── Пропуск всего блока (кнопка "Пропустить блок") ── */
  skipBlock(ctx) {
    ctx.answerCbQuery('Блок пропущен');

    ctx.session.wizard.data.blocks.push({
      text: '',
      photo: null,
    });

    ctx.session.wizard.pendingBlockText = null;
    return this._nextBlock(ctx);
  },

  /* ── Переход к следующему блоку или завершение ── */
  _nextBlock(ctx) {
    const nextIndex = ctx.session.wizard.data.blocks.length;

    if (nextIndex >= 6) {
      // Все блоки заполнены → спрашиваем цитаты
      return this._askQuote(ctx);
    }

    return this._askBlockText(ctx, nextIndex);
  },

  /* ── Цитаты ── */
  _askQuote(ctx) {
    if (!ctx.session.wizard.data.quotes) {
      ctx.session.wizard.data.quotes = [];
    }

    ctx.session.wizard.step = 'quote';

    const count = ctx.session.wizard.data.quotes.length;

    return ctx.reply(
      `💬 *Цитата покойного* (${count} добавлено)\n\n` +
      'Напишите запоминающуюся фразу или высказывание этого человека.\n' +
      'Цитата будет отображаться между блоками на странице.\n\n' +
      '_Или нажмите «Готово» чтобы перейти к публикации._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Готово, без цитат', 'skip_quotes')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  handleQuoteText(ctx) {
    const text = ctx.message.text.trim();
    if (text.length < 5) {
      return ctx.reply('⚠️ Цитата слишком короткая (минимум 5 символов):');
    }
    if (text.length > 300) {
      return ctx.reply('⚠️ Слишком длинная (макс. 300 символов). Сократите:');
    }

    // Определяем after какого блока вставить (распределяем равномерно)
    const BLOCK_KEYS = ['childhood', 'education', 'career', 'family', 'hobbies', 'legacy'];
    const idx = ctx.session.wizard.data.quotes.length;
    const afterBlock = BLOCK_KEYS[Math.min(idx * 2 + 1, BLOCK_KEYS.length - 1)];

    ctx.session.wizard.data.quotes.push({ text, after: afterBlock });

    return ctx.reply(
      `✅ Цитата добавлена (${ctx.session.wizard.data.quotes.length})\n\n` +
      'Отправьте ещё одну или нажмите «Готово».',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Готово', 'skip_quotes')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  skipQuotes(ctx) {
    ctx.answerCbQuery('Готово');
    return this._showPreview(ctx);
  },

  /* ── Превью перед публикацией ── */
  _showPreview(ctx) {
    const data = ctx.session.wizard.data;

    const blocksInfo = data.blocks.map((b, i) => {
      const title = BLOCK_SCHEMA[i].title;
      const hasText = b.text ? '✅' : '⬜';
      const hasPhoto = b.photo ? '📷' : '—';
      return `  ${hasText} ${title} ${hasPhoto}`;
    }).join('\n');

    const filledBlocks = data.blocks.filter(b => b.text).length;

    ctx.session.wizard.step = 'visibility';

    return ctx.reply(
      '📋 *Превью страницы памяти*\n\n' +
      `👤 *${data.fullName}*\n` +
      `📅 ${data.dates}\n` +
      `📷 Главное фото: ${data.mainPhoto ? '✅' : '—'}\n` +
      `📝 Основной текст: ${data.mainText.slice(0, 50)}...\n\n` +
      `📄 *Блоки (${filledBlocks}/6 заполнено):*\n${blocksInfo}\n\n` +
      '🔒 *Выберите видимость страницы:*\n\n' +
      '• *Публичная* — видна всем по ссылке и в каталоге\n' +
      '• *Приватная* — видна только по прямой ссылке',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🌐 Публичная', 'visibility_public')],
          [Markup.button.callback('🔒 Приватная', 'visibility_private')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Выбор видимости ── */
  setVisibility(ctx, isPublic) {
    ctx.answerCbQuery(isPublic ? 'Публичная' : 'Приватная');
    ctx.session.wizard.data.isPublic = isPublic;
    ctx.session.wizard.step = 'confirm';

    const label = isPublic ? '🌐 Публичная' : '🔒 Приватная';

    return ctx.reply(
      `Видимость: *${label}*\n\nПодтвердите публикацию:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Опубликовать', 'confirm_publish')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  }
};

module.exports = { blockWizard };
