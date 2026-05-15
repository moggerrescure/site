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
    const currentIndex = ctx.session.wizard.data.blocks.length - 1;

    // После каждого заполненного блока (с текстом) — спрашиваем цитату
    const lastBlock = ctx.session.wizard.data.blocks[currentIndex];
    if (lastBlock && lastBlock.text) {
      return this._askQuoteAfterBlock(ctx, currentIndex);
    }

    // Если блок пропущен — сразу к следующему
    const nextIndex = currentIndex + 1;
    if (nextIndex >= 6) {
      return this._showPreview(ctx);
    }
    return this._askBlockText(ctx, nextIndex);
  },

  /* ── Спрашиваем цитату после конкретного блока ── */
  _askQuoteAfterBlock(ctx, blockIndex) {
    const block = BLOCK_SCHEMA[blockIndex];
    ctx.session.wizard.step = 'quoteAfterBlock';
    ctx.session.wizard.quoteBlockIndex = blockIndex;

    return ctx.reply(
      `💬 *Цитата после блока «${block.title}»*\n\n` +
      'Хотите добавить запоминающуюся фразу или высказывание?\n' +
      'Она появится между этим и следующим блоком на странице.\n\n' +
      '_Напишите цитату или нажмите «Пропустить»._',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('⏭ Пропустить', 'skip_quote_after_block')],
          [Markup.button.callback('❌ Отмена', 'cancel_wizard')]
        ])
      }
    );
  },

  /* ── Получили текст цитаты после блока ── */
  handleQuoteAfterBlock(ctx) {
    const text = ctx.message.text.trim();
    const blockIndex = ctx.session.wizard.quoteBlockIndex;

    if (text.length < 3) {
      return ctx.reply('⚠️ Слишком короткая. Напишите цитату или нажмите «Пропустить».');
    }
    if (text.length > 300) {
      return ctx.reply('⚠️ Макс. 300 символов. Сократите:');
    }

    if (!ctx.session.wizard.data.quotes) ctx.session.wizard.data.quotes = [];

    const afterKey = BLOCK_SCHEMA[blockIndex].key;
    ctx.session.wizard.data.quotes.push({ text, after: afterKey });

    // Переходим к следующему блоку
    const nextIndex = blockIndex + 1;
    if (nextIndex >= 6) {
      return this._showPreview(ctx);
    }
    return this._askBlockText(ctx, nextIndex);
  },

  /* ── Пропуск цитаты после блока ── */
  skipQuoteAfterBlock(ctx) {
    ctx.answerCbQuery('Без цитаты');
    const blockIndex = ctx.session.wizard.quoteBlockIndex;

    const nextIndex = blockIndex + 1;
    if (nextIndex >= 6) {
      return this._showPreview(ctx);
    }
    return this._askBlockText(ctx, nextIndex);
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
