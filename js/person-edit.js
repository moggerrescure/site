/* ═══════════════════════════════════════════════
   PERSON-EDIT.JS — режим редактирования страницы памяти
   Кнопка «Редактировать» → инпуты → «Сохранить» → PUT /api/profiles/:id
   ═══════════════════════════════════════════════ */

(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  // Только для UUID-страниц (из бота)
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;

  let isEditing = false;
  let originalData = null; // сохраняем данные для отката

  // Ждём загрузки страницы
  window.addEventListener('load', () => {
    setTimeout(initEditPanel, 500);
  });

  function initEditPanel() {
    const panel = document.createElement('div');
    panel.className = 'edit-panel';
    panel.id = 'edit-panel';
    panel.innerHTML = `<button class="edit-panel__btn" id="edit-toggle-btn">✏️ Редактировать</button>`;
    document.body.appendChild(panel);

    document.getElementById('edit-toggle-btn').addEventListener('click', toggleEdit);
  }

  function toggleEdit() {
    if (!isEditing) {
      enterEditMode();
    } else {
      exitEditMode();
    }
  }

  function enterEditMode() {
    isEditing = true;
    originalData = collectCurrentData();

    // Меняем кнопки
    const panel = document.getElementById('edit-panel');
    panel.innerHTML = `
      <button class="edit-panel__btn edit-panel__btn--save" id="edit-save-btn">💾 Сохранить</button>
      <button class="edit-panel__btn edit-panel__btn--cancel" id="edit-cancel-btn">✕ Отмена</button>
    `;
    document.getElementById('edit-save-btn').addEventListener('click', saveChanges);
    document.getElementById('edit-cancel-btn').addEventListener('click', cancelEdit);

    // Трансформируем блоки в инпуты
    transformToInputs();
  }

  function exitEditMode() {
    isEditing = false;
    const panel = document.getElementById('edit-panel');
    panel.innerHTML = `<button class="edit-panel__btn" id="edit-toggle-btn">✏️ Редактировать</button>`;
    document.getElementById('edit-toggle-btn').addEventListener('click', toggleEdit);
  }

  function cancelEdit() {
    // Перезагружаем страницу чтобы откатить изменения
    window.location.reload();
  }

  /* ── Собираем текущие данные со страницы ── */
  function collectCurrentData() {
    const data = { sections: {}, quotes: [] };

    // Hero
    const nameEl = document.querySelector('.person-header__name');
    const datesEl = document.querySelector('.person-header__dates');
    const bioEl = document.querySelector('.person-bio__text');
    const photoEl = document.querySelector('.person-header__photo img');

    data.name = nameEl?.textContent?.trim() || '';
    data.dates = datesEl?.textContent?.replace(/[—–]/g, '-').trim() || '';
    data.bio = bioEl?.textContent?.trim() || '';
    data.photo = photoEl?.src || '';

    // Блоки
    document.querySelectorAll('.bio-block').forEach(block => {
      const key = block.dataset.block;
      if (!key) return;
      const titleEl = block.querySelector('.bio-block__title');
      const textEl = block.querySelector('.bio-block__text');
      const imgEl = block.querySelector('.bio-block__photo img');

      data.sections[key] = {
        title: titleEl?.textContent?.trim() || '',
        text: textEl?.innerText?.trim() || '',
        image: imgEl?.src || '',
      };
    });

    // Цитаты
    document.querySelectorAll('.bio-quote').forEach(q => {
      const textEl = q.querySelector('.bio-quote__text');
      if (textEl) {
        data.quotes.push({ text: textEl.textContent.trim(), after: '' });
      }
    });

    return data;
  }

  /* ── Превращаем текст в инпуты ── */
  function transformToInputs() {
    // Hero name
    const nameEl = document.querySelector('.person-header__name');
    if (nameEl) {
      const val = nameEl.textContent.trim();
      nameEl.innerHTML = `<input class="edit-input" data-field="name" value="${escAttr(val)}"/>`;
    }

    // Hero dates
    const datesEl = document.querySelector('.person-header__dates');
    if (datesEl) {
      const val = datesEl.textContent.trim();
      datesEl.innerHTML = `<input class="edit-input" data-field="dates" value="${escAttr(val)}"/>`;
    }

    // Bio text
    const bioEl = document.querySelector('.person-bio__text');
    if (bioEl) {
      const val = bioEl.textContent.trim();
      bioEl.outerHTML = `<textarea class="edit-textarea" data-field="bio">${escHtml(val)}</textarea>`;
    }

    // Hero photo — кнопка загрузки
    const photoWrap = document.querySelector('.person-header__photo');
    if (photoWrap) {
      addPhotoUploadBtn(photoWrap, 'photo', '');
    }

    // Блоки контента
    document.querySelectorAll('.bio-block').forEach(block => {
      const key = block.dataset.block;
      if (!key) return;

      // Текст → textarea
      const textEl = block.querySelector('.bio-block__text');
      if (textEl) {
        const val = textEl.innerText.trim();
        textEl.innerHTML = `<textarea class="edit-textarea" data-block="${key}" data-field="text">${escHtml(val)}</textarea>`;
      }

      // Фото — кнопка загрузки (или замены)
      let photoDiv = block.querySelector('.bio-block__photo');
      if (!photoDiv) {
        // Нет фото-блока — создаём слот для загрузки
        const row = block.querySelector('.bio-block__row');
        if (row) {
          photoDiv = document.createElement('div');
          photoDiv.className = 'bio-block__photo bio-block__photo--empty-edit';
          row.appendChild(photoDiv);
        }
      }
      if (photoDiv) {
        addPhotoUploadBtn(photoDiv, 'block-photo', key);
      }
    });

    // Цитаты → textarea
    document.querySelectorAll('.bio-quote__text').forEach((q, i) => {
      const val = q.textContent.trim();
      q.outerHTML = `<textarea class="edit-textarea edit-textarea--quote" data-field="quote" data-index="${i}">${escHtml(val)}</textarea>`;
    });
  }

  /* ── Кнопка загрузки фото ── */
  function addPhotoUploadBtn(container, type, blockKey) {
    const wrapper = document.createElement('div');
    wrapper.className = 'edit-photo-upload';
    wrapper.innerHTML = `
      <label class="edit-photo-upload__label">
        <input type="file" accept="image/*" class="edit-photo-upload__input" data-type="${type}" data-block="${blockKey}" hidden/>
        <span class="edit-photo-upload__btn">📷 ${container.querySelector('img') ? 'Заменить фото' : 'Добавить фото'}</span>
      </label>
      <span class="edit-photo-upload__status"></span>
    `;
    container.appendChild(wrapper);

    const fileInput = wrapper.querySelector('input[type="file"]');
    fileInput.addEventListener('change', () => handleFileSelect(fileInput, container, blockKey));
  }

  /* ── Загрузка файла на сервер ── */
  async function handleFileSelect(input, container, blockKey) {
    const file = input.files[0];
    if (!file) return;

    const status = input.closest('.edit-photo-upload').querySelector('.edit-photo-upload__status');
    status.textContent = '⏳ Загружаю...';

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const base = window.location.port === '3000' ? '' : 'http://localhost:3000';
      const res = await fetch(`${base}/api/upload-photo`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.ok && json.url) {
        status.textContent = '✅ Загружено';
        // Обновляем превью
        let img = container.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:6px;';
          container.insertBefore(img, container.firstChild);
        }
        img.src = json.url;

        // Сохраняем URL в data-атрибут для сбора при сохранении
        container.dataset.uploadedUrl = json.url;
      } else {
        status.textContent = '❌ ' + (json.error || 'Ошибка');
      }
    } catch (err) {
      status.textContent = '❌ Сервер недоступен';
    }
  }

  /* ── Собираем данные из инпутов и отправляем PUT ── */
  async function saveChanges() {
    const saveBtn = document.getElementById('edit-save-btn');
    saveBtn.textContent = '⏳ Сохраняю...';
    saveBtn.disabled = true;

    const data = {
      name: '',
      dates: '',
      bio: '',
      photo: '',
      sections: {},
      quotes: [],
    };

    // Hero
    const nameInput = document.querySelector('[data-field="name"]');
    const datesInput = document.querySelector('[data-field="dates"]');
    const bioInput = document.querySelector('[data-field="bio"]');
    const photoWrap = document.querySelector('.person-header__photo');

    data.name = nameInput?.value?.trim() || originalData.name;
    data.dates = datesInput?.value?.trim() || originalData.dates;
    data.bio = bioInput?.value?.trim() || originalData.bio;
    data.photo = photoWrap?.dataset?.uploadedUrl || photoWrap?.querySelector('img')?.src || originalData.photo;

    // Блоки
    const KEYS = ['childhood', 'education', 'career', 'family', 'hobbies', 'legacy'];
    KEYS.forEach(key => {
      const textArea = document.querySelector(`[data-block="${key}"][data-field="text"]`);
      const photoDiv = document.querySelector(`.bio-block[data-block="${key}"] .bio-block__photo`);

      const text = textArea?.value?.trim() || '';
      const image = photoDiv?.dataset?.uploadedUrl || photoDiv?.querySelector('img')?.src || '';

      if (text) {
        const title = originalData.sections[key]?.title || '';
        data.sections[key] = { title, text, image };
      }
    });

    // Цитаты
    document.querySelectorAll('[data-field="quote"]').forEach(el => {
      const text = el.value?.trim();
      if (text) data.quotes.push({ text, after: '' });
    });

    // PUT запрос
    try {
      const base = window.location.port === '3000' ? '' : 'http://localhost:3000';
      const res = await fetch(`${base}/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (json.ok) {
        // Перезагружаем чтобы показать обновлённые данные
        window.location.reload();
      } else {
        alert('Ошибка сохранения: ' + (json.error || 'Неизвестная ошибка'));
        saveBtn.textContent = '💾 Сохранить';
        saveBtn.disabled = false;
      }
    } catch (err) {
      alert('Сервер недоступен: ' + err.message);
      saveBtn.textContent = '💾 Сохранить';
      saveBtn.disabled = false;
    }
  }

  function escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
