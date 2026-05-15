/* ═══════════════════════════════════════════════
   PERSON-BLOCKS.JS — зебра-блочный рендер биографии
   Универсальный конструктор из 6 смысловых блоков:
     1. childhood   — Детство и юность
     2. education   — Образование
     3. career      — Профессиональный путь
     4. family      — Семья
     5. hobbies     — Хобби и увлечения
     6. legacy      — Наследие
   Все блоки поддерживают слот для фото.
   Если блок не заполнен — он не рендерится (нет пустых дыр).
   ═══════════════════════════════════════════════ */

(function () {
  /** Список блоков в фиксированном порядке + дефолтные заголовки */
  const BLOCK_SCHEMA = [
    { key: 'childhood', title: 'Детство и юность'      },
    { key: 'education', title: 'Образование'           },
    { key: 'career',    title: 'Профессиональный путь' },
    { key: 'family',    title: 'Семья'                 },
    { key: 'hobbies',   title: 'Хобби и увлечения'     },
    { key: 'legacy',    title: 'Наследие'              },
  ];

  /**
   * @param {HTMLElement} container - куда вставить блоки
   * @param {Object} data - { sections: { childhood, education, career, family, hobbies, legacy }, quotes?: [{text, after?}] }
   *   Каждая секция: { title?, text, image? }
   *   quotes: массив цитат, after — ключ блока после которого вставить (childhood, education и т.д.)
   */
  function renderBioBlocks(container, data) {
    if (!container) return;

    let blocks;
    if (data?.sections && typeof data.sections === 'object') {
      blocks = BLOCK_SCHEMA
        .map(meta => {
          const sec = data.sections[meta.key];
          if (!sec) return null;
          const text = (sec.text ?? '').trim();
          if (!text) return null;
          return {
            key:   meta.key,
            title: sec.title || meta.title,
            text,
            image: sec.image || '',
          };
        })
        .filter(Boolean);
    } else {
      const arr = Array.isArray(data?.blocks) ? data.blocks : [];
      blocks = arr
        .filter(b => b && (b.text ?? '').trim())
        .map(b => ({
          title: (b.title ?? '').trim(),
          text:  b.text.trim(),
          image: b.image || '',
        }));
    }

    if (!blocks.length) return;

    // Цитаты: массив {text, after}
    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];

    const wrap = document.createElement('div');
    wrap.className = 'bio-blocks';

    blocks.forEach((block, i) => {
      wrap.appendChild(renderBlock(block, i));

      // Вставляем цитату после этого блока если есть
      const quoteAfter = quotes.find(q => q.after === block.key);
      if (quoteAfter) {
        wrap.appendChild(renderQuote(quoteAfter.text));
      }
    });

    // Цитаты без привязки к блоку — вставляем в конец
    quotes.filter(q => !q.after).forEach(q => {
      wrap.appendChild(renderQuote(q.text));
    });

    container.appendChild(wrap);
  }

  function renderQuote(text) {
    const el = document.createElement('blockquote');
    el.className = 'bio-quote';
    el.innerHTML = `
      <span class="bio-quote__mark">"</span>
      <p class="bio-quote__text">${escapeHtml(text)}</p>
      <span class="bio-quote__mark">"</span>
    `;
    return el;
  }

  function renderBlock(block, i) {
    const text  = block.text;
    const title = block.title;
    const hasImage = !!block.image;
    const isReverse = i % 2 === 1; // 0,2,4 — текст слева; 1,3,5 — фото слева

    const section = document.createElement('section');
    section.className = 'bio-block' + (isReverse ? ' bio-block--reverse' : '');
    if (block.key) section.dataset.block = block.key;

    const titleHtml = title ? `<h2 class="bio-block__title">${escapeHtml(title)}</h2>` : '';

    const textHtml = `
      <div class="bio-block__text">
        ${text.split('\n').filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')}
      </div>
    `;

    // Слот для фото — если фото нет, показываем цветную заглушку
    const PLACEHOLDER_COLORS = [
      'linear-gradient(135deg, #2a1f3d, #4a3560)',
      'linear-gradient(135deg, #1f2a3d, #354a60)',
      'linear-gradient(135deg, #1f3d2a, #356045)',
      'linear-gradient(135deg, #3d2a1f, #604535)',
      'linear-gradient(135deg, #3d1f2a, #603545)',
      'linear-gradient(135deg, #2a3d1f, #456035)',
    ];

    const photoHtml = hasImage
      ? `
        <div class="bio-block__photo">
          <img src="${escapeAttr(block.image)}" alt="${escapeAttr(title)}" loading="lazy"/>
        </div>
      `
      : `
        <div class="bio-block__photo bio-block__photo--placeholder" style="background:${PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]}">
          <div class="bio-block__photo-placeholder">
            <span class="bio-block__photo-icon">🖼</span>
            <span class="bio-block__photo-hint">Фото</span>
          </div>
        </div>
      `;

    section.innerHTML = `
      ${titleHtml}
      <div class="bio-block__row">
        ${textHtml}
        ${photoHtml}
      </div>
    `;

    return section;
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  // Экспорт
  window.PersonBlocks = {
    render: renderBioBlocks,
    SCHEMA: BLOCK_SCHEMA,
  };
})();
