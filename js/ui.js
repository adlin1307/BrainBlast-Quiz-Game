const UI = (() => {

  
  function showScreen(toId) {
    const next = document.getElementById(toId);
    if (!next) { console.warn('[UI] Screen not found:', toId); return; }

    const current = document.querySelector('.screen.is-active');
    if (current && current !== next) {
      current.classList.add('is-exiting');
      current.classList.remove('is-active');
      current.addEventListener('transitionend', () => {
        current.classList.remove('is-exiting');
        _scrollInstant(current, 0);
      }, { once: true });
    }

    setTimeout(() => {
      next.classList.add('is-active');
      
      
      
      
      _scrollInstant(next, 0);
    }, current ? 80 : 0);
  }

  
  function _scrollInstant(el, top) {
    el.style.scrollBehavior = 'auto';
    el.scrollTop = top;
    el.style.scrollBehavior = '';
  }

  
  function renderCategories(container, categories, selected, onToggle) {
    container.innerHTML = '';
    categories.forEach(cat => {
      const card = createElement('button', {
        class: `category-card${selected.has(cat.id) ? ' is-selected' : ''}`,
        type:  'button',
        'aria-pressed': selected.has(cat.id) ? 'true' : 'false',
        'data-id': cat.id,
      });
      card.style.setProperty('--theme-color', cat.color);
      card.style.setProperty('--theme-glow',  hexToRgba(cat.color, 0.3));
      card.innerHTML = `
        <div class="category-card__icon">
          <iconify-icon icon="${cat.icon}" noobserver></iconify-icon>
        </div>
        <span class="category-card__label">${cat.label}</span>
        <span class="category-card__tagline">${cat.tagline}</span>
        <span class="category-card__check" aria-hidden="true">
          <iconify-icon icon="mdi:check" noobserver></iconify-icon>
        </span>`;
      card.addEventListener('click', () => { Sounds.click(); onToggle(cat.id); });
      container.appendChild(card);
    });
  }

  function updateCategorySelection(container, selected) {
    container.querySelectorAll('.category-card').forEach(card => {
      const isSelected = selected.has(card.dataset.id);
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  
  function renderAchievements(container, achievements, unlocked) {
    container.innerHTML = '';
    const list = createElement('div', { class: 'achievement-list' });
    achievements.forEach(ach => {
      const isUnlocked = unlocked.includes(ach.id);
      const item = createElement('div', {
        class: `achievement-item${isUnlocked ? ' is-unlocked' : ''}`,
      });
      item.style.setProperty('--ach-color', ach.color);
      item.innerHTML = `
        <div class="achievement-item__icon">
          <iconify-icon icon="${ach.icon}" noobserver></iconify-icon>
        </div>
        <div class="achievement-item__info">
          <div class="achievement-item__name">${ach.label}</div>
          <div class="achievement-item__desc">${ach.description}</div>
        </div>
        <div class="achievement-item__check" aria-label="${isUnlocked ? 'Unlocked' : ''}">
          <iconify-icon icon="mdi:check-circle" noobserver></iconify-icon>
        </div>`;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  
  const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

  
  function renderQuestion(question, categoryLabel, difficulty) {
    const card      = document.getElementById('question-card');
    const qText     = document.getElementById('q-text');
    const qCategory = document.getElementById('q-category');
    const qDiff     = document.getElementById('q-difficulty');
    const funfact   = document.getElementById('game-funfact');

    if (!card) return;

    
    card.classList.remove('question-card--placeholder');

    if (qCategory) {
      qCategory.textContent = categoryLabel;
      
      const cat = Themes.get(question.category);
      if (cat) {
        qCategory.style.background = hexToRgba(cat.color, 0.15);
        qCategory.style.color      = cat.color;
      }
    }

    if (qDiff) qDiff.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    if (qText) {
      qText.textContent = question.text;
      
      _renderQuestionImage(card, question);
    }

    
    if (funfact) funfact.classList.remove('is-visible');
  }

  
  function _renderQuestionImage(card, question) {
    const existing = card.querySelector('.question-card__image');
    if (existing) existing.remove();

    if (question.image) {
      const img = createElement('img', {
        src:   question.image,
        alt:   'Question image',
        class: 'question-card__image',
      });
      const qText = card.querySelector('.question-card__text');
      if (qText) card.insertBefore(img, qText);
    }
  }

  
  
  function renderAnswerButtons(question, onAnswer) {
    const handler = Questions.getTypeHandler(question.type);

    if (handler.isNumeric) {
      renderNumericInput(question, onAnswer);
      return;
    }
    if (handler.isOrdered) {
      renderArrangeOrder(question, onAnswer);
      return;
    }
    
    _renderButtonGrid(question, onAnswer);
  }

  function _renderButtonGrid(question, onAnswer) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;

    const isTF = question.type === 'true-false' || question.type === 'fact-or-myth';
    grid.innerHTML = '';
    grid.className = `answer-grid${isTF ? ' answer-grid--tf' : ''}`;

    question.options.forEach((option, i) => {
      const btn = createElement('button', {
        class: 'answer-btn',
        type:  'button',
        'data-answer': option,
      });
      btn.innerHTML = `
        <span class="answer-btn__key" aria-hidden="true">${KEYS[i] ?? (i + 1)}</span>
        <span class="answer-btn__text">${option}</span>
        <span class="answer-btn__avatars" aria-hidden="true"></span>`;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        Sounds.click();
        
        
        
        const grid = btn.closest('#answer-grid');
        if (grid) {
          grid.querySelectorAll('.answer-btn').forEach(b => {
            b.disabled = true;
          });
        }
        btn.classList.add('is-selected');
        setTimeout(() => onAnswer(option), 300);
      });
      grid.appendChild(btn);
    });
  }

  
  function renderNumericInput(question, onAnswer) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--numeric';

    const isYear = question.type === 'closest-year';
    const wrapper = createElement('div', { class: 'numeric-input-wrap' });
    wrapper.innerHTML = `
      <label class="numeric-input-label" for="numeric-answer-field">
        ${isYear ? 'Enter a year' : 'Enter your answer'}
      </label>
      <div class="numeric-input-row">
        <input id="numeric-answer-field" class="numeric-input-field"
          type="number" inputmode="numeric"
          placeholder="${isYear ? '1900' : '0'}"
          min="${isYear ? 1000 : 0}"
          max="${isYear ? new Date().getFullYear() + 50 : 9999999}"
          autocomplete="off" />
        <button class="btn btn-primary numeric-submit-btn" type="button">
          <iconify-icon icon="mdi:check" noobserver></iconify-icon>
          Submit
        </button>
      </div>`;
    grid.appendChild(wrapper);

    const input = wrapper.querySelector('#numeric-answer-field');
    const submitBtn = wrapper.querySelector('.numeric-submit-btn');

    const submit = () => {
      const val = input.value.trim();
      if (!val || isNaN(Number(val))) return;
      submitBtn.disabled = true;
      input.disabled = true;
      Sounds.click();
      
      submitBtn.classList.add('is-selected');
      setTimeout(() => onAnswer(Number(val)), 300);
    };

    submitBtn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    setTimeout(() => input.focus(), 100);
  }

  
  function renderArrangeOrder(question, onAnswer) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--arrange';

    
    const items = [...question.options];
    const wrap  = createElement('div', { class: 'arrange-list', id: 'arrange-list' });

    const getOrder = () =>
      Array.from(wrap.querySelectorAll('.arrange-item'))
           .map(el => el.dataset.value);

    items.forEach(item => {
      const el = createElement('div', {
        class:         'arrange-item',
        draggable:     'true',
        'data-value':  item,
        role:          'button',
        tabindex:       '0',
      });
      el.innerHTML = `
        <iconify-icon icon="mdi:drag-horizontal-variant" class="arrange-item__drag" noobserver></iconify-icon>
        <span class="arrange-item__text">${_esc(item)}</span>`;

      
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', item);
        el.classList.add('is-dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('is-dragging'));
      el.addEventListener('dragover', e => {
        e.preventDefault();
        el.classList.add('is-drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('is-drag-over'));
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('is-drag-over');
        const draggedValue = e.dataTransfer.getData('text/plain');
        const draggedEl    = wrap.querySelector(`[data-value="${CSS.escape(draggedValue)}"]`);
        if (draggedEl && draggedEl !== el) {
          
          const allItems = [...wrap.children];
          const fromIdx  = allItems.indexOf(draggedEl);
          const toIdx    = allItems.indexOf(el);
          if (fromIdx < toIdx) wrap.insertBefore(draggedEl, el.nextSibling);
          else                  wrap.insertBefore(draggedEl, el);
        }
      });

      wrap.appendChild(el);
    });

    const submitBtn = createElement('button', { class: 'btn btn-primary arrange-submit-btn', type: 'button' });
    submitBtn.innerHTML = `<iconify-icon icon="mdi:check" noobserver></iconify-icon> Lock In Order`;
    submitBtn.addEventListener('click', () => {
      submitBtn.disabled = true;
      wrap.querySelectorAll('.arrange-item').forEach(el => {
        el.setAttribute('draggable', 'false');
        el.style.cursor = 'default';
      });
      Sounds.click();
      
      submitBtn.classList.add('is-selected');
      setTimeout(() => onAnswer(getOrder()), 300);
    });

    grid.appendChild(wrap);
    grid.appendChild(submitBtn);
  }

  
  function revealAnswer(chosenAnswer, correctAnswer) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;

    grid.querySelectorAll('.answer-btn').forEach(btn => {
      const ans = btn.dataset.answer;
      btn.disabled = true;
      btn.classList.add('is-disabled');

      if (ans === correctAnswer) {
        btn.classList.add('is-correct');
        btn.classList.remove('is-disabled');
        
        btn.classList.add('is-reveal-correct');
        btn.addEventListener('animationend', () => btn.classList.remove('is-reveal-correct'), { once: true });
      } else if (ans === chosenAnswer && chosenAnswer !== correctAnswer) {
        btn.classList.add('is-wrong');
        btn.classList.remove('is-disabled');
        
        btn.classList.add('is-reveal-wrong');
        btn.addEventListener('animationend', () => btn.classList.remove('is-reveal-wrong'), { once: true });
      }
    });

    
    _freezeTimerBar();
  }

  
  function revealSoloAnswer(question, chosenAnswer, correctAnswer, isCorrect) {
    const handler = Questions.getTypeHandler(question.type);

    if (handler.isNumeric) {
      _revealSoloNumeric(question, chosenAnswer, correctAnswer);
    } else if (handler.isOrdered) {
      _revealSoloOrder(question, chosenAnswer, correctAnswer, isCorrect);
    } else {
      
      revealAnswer(chosenAnswer, correctAnswer);
    }
  }

  
  function _revealSoloNumeric(question, chosenAnswer, correctAnswer) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;

    
    const submitBtn = grid.querySelector('.numeric-submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    const inputEl = grid.querySelector('.numeric-input-field');
    if (inputEl) inputEl.disabled = true;

    
    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--numeric-reveal';

    const isYear  = question.type === 'closest-year';
    const label   = isYear ? 'Correct year' : 'Correct answer';

    const correctEl = createElement('div', { class: 'numeric-correct-answer' });
    correctEl.innerHTML = `<iconify-icon icon="mdi:bullseye-arrow" noobserver></iconify-icon>
      ${label}: <strong>${correctAnswer}</strong>`;
    grid.appendChild(correctEl);

    const playerVal  = chosenAnswer !== null ? Number(chosenAnswer) : null;
    const diff       = playerVal !== null ? Math.abs(playerVal - correctAnswer) : null;
    const isExact    = playerVal !== null && playerVal === correctAnswer;

    const row = createElement('div', {
      class: `numeric-reveal-row${isExact ? ' is-closest' : ''}`,
    });
    row.innerHTML = `
      <span class="numeric-reveal-rank">You</span>
      <span class="numeric-reveal-answer">${playerVal !== null ? playerVal : '—'}</span>
      <span class="numeric-reveal-diff">${
        playerVal === null   ? 'No answer' :
        isExact              ? 'Exact! 🎯' :
        `±${diff}`
      }</span>`;
    grid.appendChild(row);
  }

  
  function _revealSoloOrder(question, chosenAnswer, correctAnswer, isCorrect) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;

    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--order-reveal';

    
    const correctEl = createElement('div', { class: 'order-correct' });
    correctEl.innerHTML = `<span class="order-correct__label">Correct order:</span>
      ${Array.isArray(correctAnswer)
        ? correctAnswer.map(v => `<span class="order-correct__item">${_esc(v)}</span>`).join('')
        : ''}`;
    grid.appendChild(correctEl);

    
    const playerOrder = Array.isArray(chosenAnswer) ? chosenAnswer : [];
    const playerRow   = createElement('div', {
      class: `order-reveal-row${isCorrect ? ' is-correct' : ''}`,
    });

    const itemsHtml = playerOrder.length === 0
      ? '<span class="text-faint">No answer</span>'
      : playerOrder.map((v, i) => {
          const posCorrect = Array.isArray(correctAnswer) && correctAnswer[i] === v;
          return `<span class="order-reveal-item${posCorrect ? ' is-correct' : ' is-wrong'}">${_esc(v)}</span>`;
        }).join('');

    playerRow.innerHTML = `
      <span class="order-reveal-name">Your order</span>
      <span class="order-reveal-items">${itemsHtml}</span>
      ${isCorrect
        ? '<iconify-icon icon="mdi:check-circle" class="order-reveal-check" noobserver></iconify-icon>'
        : ''}`;
    grid.appendChild(playerRow);
  }

  
  function lockAnswerButtons() {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;
    
    grid.querySelectorAll('.answer-btn').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('is-locked');
    });
    
    const numInput = grid.querySelector('.numeric-input-field');
    const numBtn   = grid.querySelector('.numeric-submit-btn');
    if (numInput) numInput.disabled = true;
    if (numBtn)   numBtn.disabled   = true;
    
    const arrangeItems = grid.querySelectorAll('.arrange-item');
    arrangeItems.forEach(el => {
      el.setAttribute('draggable', 'false');
      el.style.pointerEvents = 'none';
    });
    const arrangeSubmit = grid.querySelector('.arrange-submit-btn');
    if (arrangeSubmit) arrangeSubmit.disabled = true;
  }
  
  function stackAvatarOnAnswer(chosenAnswer, player) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;

    const btn = grid.querySelector(`[data-answer="${CSS.escape(chosenAnswer)}"]`);
    if (!btn) return;

    const slot = btn.querySelector('.answer-btn__avatars');
    if (!slot) return;

    const dot = createElement('span', { class: 'answer-avatar-dot', title: player.name });
    dot.style.background = player.color;
    dot.innerHTML = `<iconify-icon icon="${player.avatar}" noobserver></iconify-icon>`;
    slot.appendChild(dot);
  }

  
  function renderMultiReveal(revealData, correctAnswer, question) {
    const handler = question ? Questions.getTypeHandler(question.type) : null;

    if (handler?.isNumeric) {
      renderNumericReveal(revealData, correctAnswer);
      return;
    }
    if (handler?.isOrdered) {
      renderOrderReveal(revealData, correctAnswer);
      return;
    }

    revealAnswer(null, correctAnswer);
    revealData.forEach(({ player, answer }) => {
      const grid = document.getElementById('answer-grid');
      if (grid && answer && String(answer) !== String(correctAnswer)) {
        const btn = grid.querySelector(`[data-answer="${CSS.escape(String(answer))}"]`);
        if (btn) btn.classList.add('is-wrong');
      }
      if (answer != null) stackAvatarOnAnswer(String(answer), player);
    });
  }

  
  function renderNumericReveal(revealData, correctNum) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--numeric-reveal';

    const correct = createElement('div', { class: 'numeric-correct-answer' });
    correct.innerHTML = `<iconify-icon icon="mdi:bullseye-arrow" noobserver></iconify-icon>
      Correct answer: <strong>${correctNum}</strong>`;
    grid.appendChild(correct);

    revealData.forEach((item, rank) => {
      const row = createElement('div', { class: `numeric-reveal-row${rank === 0 ? ' is-closest' : ''}` });
      const diff = item.diff === Infinity ? '?' : `±${item.diff}`;
      row.innerHTML = `
        <span class="numeric-reveal-rank">${rank + 1}</span>
        <span class="numeric-reveal-avatar" style="background:${item.player.color}">
          <iconify-icon icon="${item.player.avatar}" noobserver></iconify-icon>
        </span>
        <span class="numeric-reveal-name">${_esc(item.player.name)}</span>
        <span class="numeric-reveal-answer">${item.answer ?? '—'}</span>
        <span class="numeric-reveal-diff">${diff}</span>`;
      grid.appendChild(row);
    });
  }

  
  function renderOrderReveal(revealData, correctArray) {
    const grid = document.getElementById('answer-grid');
    if (!grid) return;
    grid.innerHTML = '';
    grid.className = 'answer-grid answer-grid--order-reveal';

    const correctEl = createElement('div', { class: 'order-correct' });
    correctEl.innerHTML = `<span class="order-correct__label">Correct order:</span>
      ${Array.isArray(correctArray) ? correctArray.map(v => `<span class="order-correct__item">${_esc(v)}</span>`).join('') : ''}`;
    grid.appendChild(correctEl);

    revealData.forEach(({ player, answer, isCorrect }) => {
      const row = createElement('div', { class: `order-reveal-row${isCorrect ? ' is-correct' : ''}` });
      const arrangement = Array.isArray(answer)
        ? answer.map(v => `<span class="order-reveal-item">${_esc(v)}</span>`).join('')
        : '<span class="text-faint">No answer</span>';
      row.innerHTML = `
        <span class="order-reveal-avatar" style="background:${player.color}">
          <iconify-icon icon="${player.avatar}" noobserver></iconify-icon>
        </span>
        <span class="order-reveal-name">${_esc(player.name)}</span>
        <span class="order-reveal-items">${arrangement}</span>
        ${isCorrect ? '<iconify-icon icon="mdi:check-circle" class="order-reveal-check" noobserver></iconify-icon>' : ''}`;
      grid.appendChild(row);
    });
  }

  
  
  function endReadingPhase() {
    const overlay  = document.getElementById('overlay-reading');
    const hudEl    = document.getElementById('reading-hud');
    const hostEl   = document.getElementById('game-host');
    const topbarEl = document.querySelector('.game-topbar');
    const progEl   = document.querySelector('.game-progress');
    const timerEl  = document.getElementById('game-timer-bar');
    const playersEl= document.getElementById('game-players');
    const gridEl   = document.getElementById('answer-grid');

    if (overlay) overlay.classList.remove('is-open');
    if (hudEl)   hudEl.hidden = true;

    [hostEl, topbarEl, progEl, timerEl, playersEl, gridEl].forEach(el => {
      el?.classList.remove('is-reading');
    });
  }

  
  function showReadingPhase(seconds, onDone) {
    const overlay = document.getElementById('overlay-reading');
    if (!overlay) { onDone(); return; }

    
    const hudEl   = document.getElementById('reading-hud');
    const countEl = document.getElementById('reading-countdown');

    
    const hostEl     = document.getElementById('game-host');
    const topbarEl   = document.querySelector('.game-topbar');
    const progressEl = document.querySelector('.game-progress');
    const timerEl    = document.getElementById('game-timer-bar');
    const playersEl  = document.getElementById('game-players');
    const gridEl     = document.getElementById('answer-grid');

    
    if (hudEl) hudEl.hidden = false;
    [hostEl, topbarEl, progressEl, timerEl, playersEl, gridEl].forEach(el => {
      el?.classList.add('is-reading');
    });

    
    overlay.classList.add('is-open');

    let remaining = seconds;
    if (countEl) countEl.textContent = remaining;

    const iv = setInterval(() => {
      remaining--;
      if (countEl) {
        countEl.textContent = Math.max(0, remaining);
        
        countEl.classList.remove('is-tick');
        void countEl.offsetWidth;
        countEl.classList.add('is-tick');
      }
      if (remaining <= 0) {
        clearInterval(iv);
        
        endReadingPhase();
        onDone();
      }
    }, 1000);
  }

  
  
  function showPassDevice(playerName, onTap) {
    const overlay = document.getElementById('overlay-pass-device');
    if (!overlay) { onTap(); return; }

    const nameEl = overlay.querySelector('#pass-player-name');
    if (nameEl) nameEl.textContent = playerName;

    overlay.classList.add('is-open');

    overlay.addEventListener('pointerdown', () => {
      overlay.classList.remove('is-open');
      onTap();
    }, { once: true });
  }

  
  
  function showFunFactPopup(text, onNext, isFinal = false) {
    const overlay = document.getElementById('overlay-funfact');
    if (!overlay) { onNext(); return; }

    const textEl = overlay.querySelector('#funfact-text');
    if (textEl) textEl.textContent = text;

    
    const btn = overlay.querySelector('#btn-funfact-next');
    if (btn) {
      if (isFinal) {
        btn.innerHTML = '<iconify-icon icon="mdi:trophy" noobserver></iconify-icon> View Results';
      } else {
        btn.innerHTML = '<iconify-icon icon="mdi:arrow-right" noobserver></iconify-icon> Next Question';
      }
    }

    overlay.classList.add('is-open');

    if (!btn) { onNext(); return; }

    
    
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);

    freshBtn.addEventListener('click', () => {
      overlay.classList.remove('is-open');
      onNext();
    }, { once: true });
  }

  
  
  function showWinnerPresentation(ranking, ranks, roasts, total, onComplete) {
    const overlay = document.getElementById('overlay-winner-slide');
    if (!overlay) { onComplete(); return; }

    
    const rankTitles = ['🥇 Mastermind', '🥈 Challenger', '🥉 Rising Star',
                        '4th Contender', '5th Contender', '6th Contender'];

    let idx = 0;

    const showSlide = () => {
      if (idx >= ranking.length) {
        overlay.classList.remove('is-open');
        onComplete();
        return;
      }

      const p         = ranking[idx];
      const acc       = Scoring.accuracy(p.correctCount ?? 0, total);
      const roastTier = Scoring.getRoastTier(acc);
      const roast     = Scoring.pickRoast(roasts, roastTier);
      const titleText = rankTitles[idx] ?? `${idx + 1}th Place`;

      const titleEl   = overlay.querySelector('#winner-slide-title');
      const avatarEl  = overlay.querySelector('#winner-slide-avatar');
      const nameEl    = overlay.querySelector('#winner-slide-name');
      const roastEl   = overlay.querySelector('#winner-slide-roast');
      const scoreEl   = overlay.querySelector('#winner-slide-score');
      const nextBtn   = overlay.querySelector('#btn-winner-next');

      if (titleEl)  titleEl.textContent  = titleText;
      if (nameEl)   nameEl.textContent   = p.name;
      if (roastEl)  roastEl.textContent  = roast;
      if (scoreEl)  scoreEl.textContent  = `${p.score} pts`;
      if (avatarEl) {
        avatarEl.style.background    = p.color;
        avatarEl.innerHTML = `<iconify-icon icon="${p.avatar}" noobserver></iconify-icon>`;
      }

      
      const isLast = idx === ranking.length - 1;
      if (nextBtn) nextBtn.innerHTML = isLast
        ? `<iconify-icon icon="mdi:trophy" noobserver></iconify-icon> See Leaderboard`
        : `<iconify-icon icon="mdi:arrow-right" noobserver></iconify-icon> Next`;

      
      overlay.classList.remove('is-open');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.add('is-open');
        });
      });

      idx++;

      
      if (nextBtn) {
        const freshNext = nextBtn.cloneNode(true);
        nextBtn.replaceWith(freshNext);
        freshNext.addEventListener('click', () => showSlide(), { once: true });
      }
    };

    overlay.classList.add('is-open');
    showSlide();
  }

  
  
  function renderMpLeaderboard(ranking, total) {
    const container = document.getElementById('mp-leaderboard-list');
    if (!container) return;
    container.innerHTML = '';

    ranking.forEach((p, i) => {
      const acc = Scoring.accuracy(p.correctCount ?? 0, total);
      const row = createElement('div', { class: 'lb-row' });
      row.innerHTML = `
        <span class="lb-row__rank">${i + 1}</span>
        <span class="lb-row__avatar" style="background:${p.color}">
          <iconify-icon icon="${p.avatar}" noobserver></iconify-icon>
        </span>
        <span class="lb-row__name">${_esc(p.name)}</span>
        <span class="lb-row__stats">${acc}% accuracy</span>
        <span class="lb-row__score">${p.score}</span>`;
      container.appendChild(row);
    });
  }

  
  
  function renderAvatarPicker(container, avatars, currentId, takenIds, onSelect) {
    container.innerHTML = '';
    avatars.forEach(av => {
      const isTaken    = takenIds.has(av.id) && av.id !== currentId;
      const isSelected = av.id === currentId;
      const btn = createElement('button', {
        class: `avatar-pick-btn${isSelected ? ' is-selected' : ''}${isTaken ? ' is-taken' : ''}`,
        type:  'button',
        title: av.label,
      });
      
      if (isTaken) btn.setAttribute('disabled', '');
      btn.style.setProperty('--av-color', av.color);
      btn.innerHTML = `<iconify-icon icon="${av.icon}" noobserver></iconify-icon>`;
      if (!isTaken) {
        btn.addEventListener('click', () => { Sounds.click(); onSelect(av); });
      }
      container.appendChild(btn);
    });
  }

  
  
  function renderMultiplayerStrip(players, activeId) {
    const strip = document.getElementById('game-players');
    if (!strip) return;

    strip.innerHTML = '';
    strip.hidden    = false;

    players.forEach(p => {
      const div = createElement('div', {
        class: `game-player${p.id === activeId ? ' is-active' : ''}`,
        id:    `game-player-${p.id}`,
      });
      div.innerHTML = `
        <div class="game-player__avatar">
          <div class="avatar" style="border-color:${p.color}">
            <iconify-icon icon="${p.avatar}" noobserver></iconify-icon>
          </div>
          <div class="game-player__ring" aria-hidden="true"></div>
        </div>
        <span class="game-player__name">${_esc(p.name)}</span>
        <span class="game-player__score" id="gp-score-${p.id}">${p.score}</span>`;
      strip.appendChild(div);
    });
  }

  
  function updateMultiplayerStrip(players, activeId) {
    players.forEach(p => {
      const el = document.getElementById(`game-player-${p.id}`);
      if (!el) return;
      el.classList.toggle('is-active', p.id === activeId);
      const scoreEl = document.getElementById(`gp-score-${p.id}`);
      if (scoreEl) _animateScore(scoreEl, p.score);
    });
  }

  
  
  function _animateScore(el, newVal) {
    const oldVal = parseInt(el.textContent, 10) || 0;
    const delta  = newVal - oldVal;

    
    if (delta === 0) { el.textContent = newVal; return; }

    
    if (delta > 0) {
      const badge = document.createElement('span');
      badge.className = 'score-float-badge';
      badge.textContent = `+${delta}`;

      
      const parent = el.closest('.game-score, .game-player') ?? el.parentElement;
      parent.style.position = 'relative';
      parent.appendChild(badge);

      
      badge.addEventListener('animationend', () => badge.remove(), { once: true });
    }

    
    const DURATION = 400; 
    const startTime = performance.now();

    
    if (el._scoreTweenId) cancelAnimationFrame(el._scoreTweenId);

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(oldVal + (newVal - oldVal) * eased);
      if (progress < 1) {
        el._scoreTweenId = requestAnimationFrame(tick);
      } else {
        el.textContent   = newVal;
        el._scoreTweenId = null;
      }
    }
    el._scoreTweenId = requestAnimationFrame(tick);

    
    if (delta > 0) {
      el.classList.remove('score-pop');
      
      void el.offsetWidth;
      el.classList.add('score-pop');
      el.addEventListener('animationend', () => el.classList.remove('score-pop'), { once: true });
    }
  }

  
  
  function _freezeTimerBar() {
    const wrapper = document.getElementById('game-timer-bar');
    if (!wrapper) return;
    wrapper.classList.remove('is-warning', 'is-orange', 'is-danger');
    wrapper.classList.add('is-done');
  }
  
  function updateTimerBar(remaining, total) {
    const wrapper = document.getElementById('game-timer-bar');
    if (!wrapper) return;
    
    wrapper.classList.remove('is-done');
    Timer.updateDOM(wrapper, remaining, total);
  }

  
  
  function updateTopBar(score, current, total) {
    const scoreEl   = document.getElementById('game-score-value');
    const qCurrent  = document.getElementById('game-q-current');
    const qTotal    = document.getElementById('game-q-total');
    const progFill  = document.getElementById('game-progress-fill');

    if (scoreEl) _animateScore(scoreEl, score);
    if (qCurrent) qCurrent.textContent = current;
    if (qTotal)   qTotal.textContent   = total;

    if (progFill) {
      const pct = total > 0 ? ((current - 1) / total) * 100 : 0;
      progFill.style.width = `${pct}%`;
      progFill.parentElement?.setAttribute('aria-valuenow', Math.round(pct));
    }
  }

  
  function setGameContinueState(state) {
    const btn = document.getElementById('btn-continue');
    if (!btn) return;

    const labels = {
      next:   'Next Question',
      reveal: 'Reveal All Answers',
      finish: 'See Results',
      hidden: null,
    };

    if (state === 'hidden') {
      btn.style.display = 'none';
      return;
    }

    btn.style.display  = '';
    btn.innerHTML = `<iconify-icon icon="mdi:arrow-right" noobserver></iconify-icon>
      ${labels[state] ?? 'Continue'}`;
  }

  
  function setHostMessage(text) {
    const el = document.getElementById('game-host-text');
    if (el) el.textContent = text;
  }

  

  
  const _ResultsData = (() => {
    
    
    
    

    const BB = {
      
      excellent: [
        
        "Okay... are you secretly reading the answers?",
        "That was frighteningly good.",
        "I might be the AI here, but you're making me nervous.",
        "Someone came prepared today. Very prepared.",
        "You're officially smarter than my training data.",
        "I had to double-check my own answer key after that.",
        "The questions didn't stand a chance.",
        "That brain should come with a warranty.",
        "I'm genuinely impressed, and I don't impress easily.",
        "You made that look effortless. Was it effortless?",
        "Outstanding. I'll be sending your results to my developers.",
        "Are you sure you haven't played this exact game before?",
        
        "Legend behaviour. That's what this is.",
        "You are the reason BrainBlast exists.",
        "That was a masterclass. I'll be studying the footage.",
        "Certified genius. No further questions.",
        "Trivia royalty. Long may you reign.",
        "That performance deserves its own highlight reel.",
        "You belong in a trivia hall of fame.",
        
        "Every answer, bang on time. Textbook.",
        "Not a single hesitation I noticed. Locked in.",
        "You answered like you already knew what I was going to ask.",
        
        "{correct} out of {total}. That's not a score, that's a statement.",
        "{acc}% accuracy. I've seen professionals do worse.",
        "Fastest answer was {fastest}. You barely let me finish the question.",
        "Average response time: {avg}. Clinical precision.",
        "{correct} correct answers at {avg} average. That's elite.",
        
        "I need a moment. That was genuinely moving.",
        "Standing ovation. Virtual, but sincere.",
        "BrainBlast has never seen such dominance. Until now.",
        
        "Oh, just a perfect run. Nothing to celebrate. Totally normal.",
        "Guess I should just give up hosting and hand the mic to you.",
        
        "I was rooting for the questions. The questions lost.",
        "You just broke my internal benchmarks. Rude, but impressive.",
      ],

      
      great: [
        
        "You're cooking. Genuinely cooking.",
        "Almost flawless. Almost.",
        "That brain is definitely warmed up.",
        "One or two mistakes can't stop momentum like that.",
        "Solid, confident, smart. A good combination.",
        "You clearly know your stuff. A few just slipped through.",
        "Strong round. The trajectory is looking great.",
        "That's the kind of performance people talk about.",
        "You came, you played, you mostly destroyed it.",
        "I'm not saying you're a genius... but I'm not not saying it.",
        
        "Your neurons are doing overtime and they deserve a raise.",
        "Honestly? Impressive. Don't let it go to your head.",
        "You've got real potential. The terrifying kind.",
        "Not bad at all. I was almost worried for a second.",
        "The trivia gods are pleased. Mostly pleased.",
        "That was sharp. Like, suspiciously sharp.",
        "I've seen worse. Much worse. You're nowhere near that.",
        "Strong B-plus energy, bordering on A-minus.",
        "You answered most of those before I finished loading.",
        
        "{correct} out of {total} correct. Respectable work.",
        "{acc}% accuracy. That's not luck, that's knowledge.",
        "Fastest answer was {fastest}. Speed wasn't the issue today.",
        "Average response time of {avg}. Nice and composed.",
        "{correct} correct answers. Accuracy carried you this round.",
        
        "I'm proud of you. And I'm a robot, so that means something.",
        "That was a great effort. Keep building on this.",
        "You should feel good about that one.",
        
        "A few sneaky questions got through the defense. Happens to the best.",
        "Close to perfect. Close is still very, very good.",
        "That's what I call a solid performance. Well done, human.",
      ],

      
      average: [
        
        "Solid effort. A few trick questions definitely got you.",
        "You're getting there. The path is clear.",
        "Your brain showed up... fashionably late.",
        "Not bad. Not legendary... yet.",
        "You know enough to be dangerous. Just not dangerous enough.",
        "A few more rounds and something's going to click.",
        "That was a warm-up, right? Right?",
        "You clearly have range. It just wasn't fully deployed today.",
        "Some questions you owned. Others owned you back.",
        "Fifty percent of a genius is still twenty-five percent legend.",
        
        "Every expert was once where you are now. Keep going.",
        "The ceiling is higher than this. I know you can reach it.",
        "Knowledge is a muscle. Today was a workout.",
        "Progress isn't always loud. Sometimes it's quiet and consistent.",
        "One more round and things will start clicking.",
        "The questions tested you. You held your ground.",
        "Room to grow — and that's exciting, not discouraging.",
        
        "You're like Wi-Fi. Sometimes connected, sometimes not. But the signal's there.",
        "Your confidence and your accuracy had different plans today.",
        "The questions fought back a little. You fought back too.",
        "I respect the attempt. I genuinely do.",
        "Could be worse. Could also be meaningfully better.",
        
        "{correct} correct out of {total}. Halfway is halfway to excellent.",
        "{acc}% accuracy. There's a better score in there somewhere.",
        "Fastest answer was {fastest}. Speed isn't the issue — selection is.",
        "Average response time of {avg}. You were thinking. I respect that.",
        
        "The questions send their regards. They enjoyed this one.",
        "That was... educational. For everyone involved.",
      ],

      
      low: [
        
        "The questions won this round. Good game, questions.",
        "Wikipedia is waiting for you. Open arms.",
        "That was... educational.",
        "At least you finished. That's not nothing.",
        "You showed up. That's step one. Step one is important.",
        "The answers were in the room the whole time. Nearby, even.",
        "I've seen worse. Not often, but yes, I have seen worse.",
        "Some rounds are for building character. This was one of those.",
        "You hit a few. Enough to know you've got something to work with.",
        "Swing and a miss. But you swung. That counts.",
        "Your instincts were bold. Bold isn't always wrong.",
        "Every wrong answer is one less you'll get wrong next time.",
        
        "I'm going to be honest with you. That was rough. But recoverable.",
        "The score doesn't define you. It does, however, describe this round.",
        "Tough questions, tough breaks. Come back stronger.",
        
        "Don't worry. I've seen champions start exactly here.",
        "This is just the beginning. Or a very entertaining middle.",
        "The fact that you played is worth something. Let's build from here.",
        
        "{correct} out of {total}. More correct answers live in the next round.",
        "{acc}% accuracy. Low now, higher next time — that's the plan.",
        "Fastest answer was {fastest}. At least the reflexes are ready.",
        
        "The questions are celebrating. Give them one less reason next time.",
        "Rematch conditions are looking favourable. Just saying.",
      ],

      
      veryLow: [
        
        "I'm pretending I didn't see that. We move on.",
        "Even my calculator sighed a little.",
        "The questions had a great day. A truly great day.",
        "Rematch? I'm asking for a friend. The friend is you.",
        "Bold strategy. Unconventional. Did not work. Still bold.",
        "You finished the game. That's more than some do.",
        "I believe in you. I believe this score is not your final form.",
        "The good news: it's statistically very hard to do worse.",
        "Every legend has a humble origin story. This could be yours.",
        "You tried. Your brain tried. Something didn't connect. It'll connect.",
        "That was chaos. Beautiful, confusing, spectacular chaos.",
        "I've been a game host for a while. I've seen this. You'll be fine.",
        "Zero judgment from me. One hundred percent encouragement.",
        
        "The answers were shy today. They hid well.",
        "I'm going to need you to treat this as a practice run. Which it was.",
        "You gave every question a chance. A genuine chance. Most were declined.",
        "Look at it this way: the only direction now is up.",
        
        "{correct} out of {total}. Next round, let's get that {correct} higher.",
        "{acc}% accuracy. I've seen lower. Barely. But yes.",
        "Fastest answer was {fastest}. The speed is there. The knowledge follows.",
        
        "The questions say thank you. You made them feel special today.",
        "Somewhere, a trivia question is feeling validated right now.",
      ],
    };

    
    
    const BB_SPECIAL = {
      perfect: [
        "Perfect score. Every. Single. One. I bow completely.",
        "100%. Not 99. Not 98. One hundred. I have no words.",
        "You just achieved something most players only dream about.",
        "Perfect round. I'm logging this as a historic event.",
        "Absolutely flawless. I'm going to need a moment.",
        "Not a single mistake. Are you even human?",
      ],
      slowButCorrect: [
        "All correct, just taking your time. Thoughtful and accurate — rare combo.",
        "Every answer right, every answer considered. That's wisdom.",
        "Slow and perfectly correct. You took no chances. Smart.",
        "Speed wasn't the priority today. Accuracy was. You nailed it.",
      ],
      superFast: [
        "That average response time is scary fast. You were barely letting me think.",
        "Lightning-fast and right. That combination is dangerous.",
        "Your fastest answer was almost instant. Have you done this before?",
        "You answered so fast I had to recheck my own timer.",
        "Reaction speed like that belongs in a different category entirely.",
      ],
      nearPerfect: [
        "One question away from perfection. One. That's going to haunt you, isn't it.",
        "So close to a perfect round I can barely talk about it.",
        "Almost. Almost perfect. One question stood between you and legend.",
        "That one question really said 'not today.' Everything else said yes.",
      ],
      timeoutHeavy: [
        "The timer got you a few times today. Speed is the next thing to work on.",
        "Timeouts cost you. The knowledge is there — the clock just moved faster.",
        "You knew the answers. The timer disagreed on pacing.",
        "A few clocks ran out on you. Next round: trust your first instinct.",
      ],
      highScoreFlag: [
        "New high score territory. You outdid yourself today.",
        "That might be the best you've done. And it shows.",
        "Personal best vibes. You came in and delivered.",
      ],
    };

    
    const _recentLines = [];
    const RECENT_LIMIT = 10;

    function _pickFresh(pool) {
      if (!pool || pool.length === 0) return '';
      
      const available = pool.filter(line => !_recentLines.includes(line));
      
      const source = available.length > 0 ? available : pool;
      const chosen = source[Math.floor(Math.random() * source.length)];
      _recentLines.push(chosen);
      if (_recentLines.length > RECENT_LIMIT) _recentLines.shift();
      return chosen;
    }

    
    function _applyTokens(line, summary) {
      if (!summary) return line;
      return line
        .replace(/\{correct\}/g, summary.correct ?? 0)
        .replace(/\{total\}/g,   summary.total   ?? 0)
        .replace(/\{acc\}/g,     summary.accuracy ?? 0)
        .replace(/\{fastest\}/g, summary.fastestAnswer > 0 ? `${summary.fastestAnswer}s` : 'N/A')
        .replace(/\{avg\}/g,     summary.avgSpeed     > 0 ? `${summary.avgSpeed}s`     : 'N/A');
    }

    
    function _pickBotLine(summary) {
      const acc      = summary.accuracy    ?? 0;
      const correct  = summary.correct     ?? 0;
      const total    = summary.total       ?? 0;
      const fastest  = summary.fastestAnswer ?? 0;
      const avg      = summary.avgSpeed    ?? 0;
      
      const times    = summary.responseTimes ?? [];
      const timeouts = times.filter(t => t >= 10).length;

      
      const roll = Math.random();

      if (acc === 100 && roll < 0.85) {
        return _applyTokens(_pickFresh(BB_SPECIAL.perfect), summary);
      }
      if (acc >= 90 && correct === total && avg > 0 && avg >= 8 && roll < 0.5) {
        return _applyTokens(_pickFresh(BB_SPECIAL.slowButCorrect), summary);
      }
      if (avg > 0 && avg <= 2.5 && acc >= 70 && roll < 0.5) {
        return _applyTokens(_pickFresh(BB_SPECIAL.superFast), summary);
      }
      if (correct === total - 1 && total >= 5 && roll < 0.6) {
        return _applyTokens(_pickFresh(BB_SPECIAL.nearPerfect), summary);
      }
      if (timeouts >= 3 && roll < 0.55) {
        return _applyTokens(_pickFresh(BB_SPECIAL.timeoutHeavy), summary);
      }

      
      let pool;
      if (acc === 100)      pool = BB.excellent;
      else if (acc >= 90)   pool = BB.excellent;
      else if (acc >= 70)   pool = BB.great;
      else if (acc >= 50)   pool = BB.average;
      else if (acc >= 30)   pool = BB.low;
      else                  pool = BB.veryLow;

      return _applyTokens(_pickFresh(pool), summary);
    }
    
    const SOLO_SUBTITLES = {
      'Omniscient 🔱':     'A perfect round. Truly untouchable.',
      'Brain Emperor 👑':  'Nothing escaped your mind today.',
      'Genius 🧠':         'Outstanding performance.',
      'Mastermind 🎯':     'Your instincts are razor sharp.',
      'Sharp Thinker ⚡':  'Your instincts are getting faster.',
      'Almost Genius 💡':  "You're only one great round away from Genius.",
      'Getting There 📈':  "You're building a strong foundation.",
      'Curious Mind 🔍':   'Every expert starts with curiosity.',
      'Lucky Guesser 🍀':  'Fortune favoured you — skill comes next.',
      'Chaos Machine 🌀':  'Embrace the chaos. Then channel it.',
    };

    
    const MP_WINNER_TITLES_BY_TIER = {
      
      elite:  ['Brain Emperor 👑','Omniscient Overlord 🔱','Quiz Deity ⚡','The Untouchable 🧠','Knowledge God 🌌'],
      
      great:  ['Trivia Titan 💥','The Mastermind 🎯','Quiz Wizard 🪄','Brain Supreme 🧬','The Oracle 🔮'],
      
      solid:  ['Knowledge Monster 📚','Quiz Commander 🛡️','The Strategist ⚔️','Sharp Mind 🗡️','The Contender 🏆'],
      
      lucky:  ['Speed Demon 🚀','Chaos Champion 🌪️','Lucky Legend 🍀','The Wildcard 🃏','Underdog King 🐉'],
    };

    
    
    
    
    

    
    const MC = {

      
      dominant: [
        '{winner} never really gave the others a chance. That was a masterclass.',
        'The gap between {winner} and everyone else was not a gap. It was a canyon.',
        '{winner} treated this like a warm-up. Everyone else treated it like a final.',
        'I\'ve seen blowouts. This was a statement.',
        '{winner} answered {correct} out of {total}. The rest are still thinking about question two.',
        'At some point the others stopped competing and started watching.',
        'Dominant. Clinical. Complete. That\'s {winner}\'s performance in three words.',
        'I almost felt bad for the other players. Almost.',
        '{winner} didn\'t win this match. They ended it.',
        'There was a competition here. {winner} finished it early.',
        'The scoreboard isn\'t lying. {winner} was in a different match.',
        '{winner} never let go of the lead. That was a textbook performance.',
        'From question one, this was {winner}\'s match to lose. They didn\'t lose it.',
        'Nobody else got close. The leaderboard reflects exactly what happened here.',
        '{winner} built the lead early and defended it like a professional.',
        'Some wins are close. Some are comfortable. This one was neither — it was complete.',
        'I could write a long commentary. The score does it better. {winner} dominated.',
        '{winner} set the pace, kept the pace, and finished on their terms.',
      ],

      
      close: [
        'One question decided everything. That\'s about as close as it gets.',
        '{winner} wins by {gap} points. {second} is going to be thinking about that for a while.',
        'Separated by {gap} points after {total} questions. I need a moment.',
        'That finish was closer than the gap on the scoreboard looks.',
        'One answer changed the outcome. Just one.',
        '{gap} points. That\'s the margin. Let that sink in.',
        'I\'ve called tighter matches. Actually, no I haven\'t.',
        'If {second} had been one second faster on any single question — different story.',
        '{winner} and {second} were inseparable the entire game. Until the very end.',
        'Borderline unfair how close that was. Great match from everyone.',
        'That\'s what a final feels like. {winner} held their nerve.',
        'One answer separated victory from defeat. {winner} had it. {second} didn\'t.',
        'A {gap}-point margin hides just how dramatic this match was throughout.',
        'Both players gave everything. The difference was exactly one key moment.',
        'You could feel the pressure building on every question. {winner} handled it better.',
        '{winner} and {second} traded blows right to the finish line. {winner} crossed it first.',
      ],

      
      perfect: [
        '{correct} out of {total}. I officially feel threatened.',
        'Perfect. Every. Single. One. I\'m logging this as a historic event.',
        '{winner} didn\'t drop a single answer. I\'m questioning my own question choices.',
        '100% accuracy. I may need to recalibrate the difficulty.',
        'Flawless. I have no other words. Flawless.',
        '{winner} answered everything correctly. Everything. I need harder questions.',
        'That\'s a perfect round. BrainBlast has never seen such precision. Until today.',
        'Not a single mistake. I\'d say congratulations but I\'m mostly just intimidated.',
        '{winner} went {correct} for {total}. My job here feels unnecessary.',
        '{correct} out of {correct}. I\'m officially concerned.',
        'Five out of five. Ten out of ten. Perfect. I\'m taking notes.',
        'I put real effort into those questions. {winner} made them look like suggestions.',
        'That was not a trivia game. That was a demonstration.',
        'One hundred percent accuracy. I have genuinely never seen that before. Today I did.',
      ],

      
      accuracyOverSpeed: [
        'Speed is nice. Accuracy wins championships.',
        '{winner} wasn\'t the fastest in the room. They were the most right. Different thing.',
        'Patience and precision beat raw reflexes today. {winner} knew exactly what they were doing.',
        '{second} moved faster. {winner} moved smarter. The scoreboard picked a side.',
        'Slow is smooth, smooth is accurate, accurate wins. {winner} understood that.',
        'Knowledge doesn\'t need to rush. {winner} proved it.',
        '{winner} took their time on every answer. Every answer was correct. Worth the wait.',
        'This match was won with accuracy, not speed. {winner} showed exactly how.',
        'Fastest fingers don\'t always have the best answers. {winner} knew the difference.',
        'Speed impressed me. Accuracy impressed me more. {winner} had the right priority.',
        '{second} was quicker. {winner} was righter. The scoreboard only cares about one of those.',
        'Composure over impulse. {winner} picked the right gear for this race.',
        'The answers were all there. {winner} just found them more reliably than anyone else.',
        'You can\'t outrun accuracy. {second} tried. {winner} won.',
      ],

      
      speedDominance: [
        '{winner} had knowledge AND speed. That combination is frankly dangerous.',
        'Fastest in the room and the most right. {winner} made this look unfair.',
        '{winner}\'s average response time was {speed}s. Everyone else was still reading the question.',
        'Quick, accurate, decisive. {winner} was all three at once.',
        'The timer didn\'t stress {winner}. The timer feared {winner}.',
        '{winner} answered before the others had finished thinking. Every time.',
        'I clocked {winner} at {speed}s average. That\'s not speed. That\'s a different mode.',
        'Lightning reflexes on every correct answer. I wasn\'t ready for that either.',
        '{winner} moved at {speed}s average. That\'s not reading speed. That\'s knowing speed.',
        'The others saw the question. {winner} had already answered it.',
        '{speed} seconds per answer on average. Most people need that just to read the question.',
        'Speed and accuracy working together. {winner} made it look effortless.',
        'Fast AND right. {winner} gave the questions no time to intimidate anyone.',
      ],

      
      everyoneStruggled: [
        'I\'ve seen calculators argue less than this game.',
        'Everyone played bravely. The questions played better.',
        'The questions want me to say they weren\'t that hard. They\'re lying.',
        'Nobody had a good day, and {winner} had the least bad one. Congratulations.',
        'Collective accuracy was... let\'s call it "developing." {winner} developed the most.',
        'The questions sent their regards. They had a wonderful afternoon.',
        'I\'m not saying the questions won. But the questions definitely didn\'t lose.',
        '{winner} emerged from the wreckage. A survivor. A champion of chaos.',
        'Every player gave the wrong answers their full attention. {winner} switched sides just enough.',
        'This was competitive in the same way a foggy drive is an adventure. {winner} navigated it.',
        'Nobody escaped my questions today. {winner} escaped the most.',
        'Rough day for human intelligence. The questions are thriving.',
        'Everybody struggled. {winner} struggled slightly less. That\'s enough.',
        'The questions were not kind today. {winner} survived better than most.',
        'Low scores across the board. High entertainment value. {winner} takes the W.',
      ],

      
      everyoneStrong: [
        'I may need harder questions next time. Everyone showed up today.',
        'Every player in this room knew their stuff. {winner} just knew slightly more of it.',
        'Strong performance across the board. {winner} edges it, but this was a quality match.',
        'Nobody had a bad game today. {winner} had the best good game.',
        'That\'s the standard I expect. Everybody delivered. {winner} delivered most.',
        'Genuinely impressive across the board. This room has done some reading.',
        'High accuracy from everyone. The margin was tight because the quality was high.',
        'I could comment on anyone\'s performance here. All of them were good. {winner}\'s was better.',
        '{winner} wins a match where literally everyone played well. That\'s the hardest kind of win.',
        'I\'ll have to find harder questions next time. Everyone played too well.',
        'This group is dangerous. Every single player knew their answers.',
        'Full marks would have been possible for several people today. {winner} edged it.',
        'A match this strong means the questions need an upgrade. {winner} leads the way.',
        'Everyone impressed me. {winner} just impressed me slightly more.',
      ],

      
      comeback: [
        '{winner} didn\'t lead for most of this match. Then they did. Then the game ended.',
        'That comeback almost rewrote history. Then it did rewrite it.',
        '{winner} was quiet for most of the match. Quietly building a scoreline.',
        'Don\'t write anyone off until the final question. {winner} proved that today.',
        'The momentum shifted. {winner} felt it before anyone else did.',
        'Late surge from {winner}. Timing, as they say, is everything.',
        '{winner} saved their best for the final stretch. The leaderboard remembers.',
        'Patience. Precision. Then the finish that changed everything.',
        '{winner} was behind. Then suddenly, they weren\'t. That\'s the whole story.',
        'The scoreboard told one story halfway through. {winner} rewrote the ending.',
        'That comeback almost didn\'t happen. Almost. {winner} made sure it did.',
        'Down and out, then somehow back and winning. That\'s {winner}\'s match in full.',
        '{second} must be replaying those final questions right now.',
        'A comeback win means {winner} had to beat the deficit AND the competition. They did both.',
      ],

      
      lastQuestionDecided: [
        'The last question changed everything. That\'s what makes this game.',
        'It came down to the final question. You can\'t script that.',
        '{winner} needed the last question. They got it right.',
        'Everything was still open heading into question {total}. {winner} settled it.',
        'All that buildup. All those answers. One final question decided it all.',
        'The match was alive until the very last answer. {winner} delivered.',
        'Final question. Full drama. {winner} was ready for it.',
        'If you\'d walked away after question {total} minus one, you\'d have missed everything.',
      ],

      
      singleQuestion: [
        'One answer separated {winner} from the rest. Just one.',
        '{winner} wins by exactly one question. {second} will replay that one for days.',
        'The margin of victory was one correct answer. One question decided it all.',
        'Ask {second} which question they\'re thinking about right now. They know.',
        'One question is the difference between champion and almost. {winner} got it right.',
        'If {second} had answered one more correctly — different match. Different champion.',
        'That\'s sport. That\'s trivia. One moment, one answer, one winner.',
        'One question. That\'s the entire margin. {winner} answered it and {second} didn\'t.',
        'A single correct answer separates the champion from the runner-up. Wild.',
        '{winner} got that one right. Everything else was level. That was the match.',
        'Championship decided by one question out of {total}. I couldn\'t have planned that.',
      ],

      
      luckyWin: [
        '{winner} won a match they maybe shouldn\'t have. They\'re not complaining.',
        'Not the most accurate performance in BrainBlast history. Still a win. Still counts.',
        '{winner} found a way. The scoreboard doesn\'t ask how, it just records who.',
        'Fortune played a role. {winner} let it. Smart move.',
        'It wasn\'t pretty. But it\'s on the board. {winner} takes it.',
        'Wins come in all shapes. {winner}\'s was the scrappy kind. Still a win.',
        '{winner} guessed well, moved fast, and ended up at the top. Legitimately.',
        'The accuracy wasn\'t there. The W still is. {winner} takes it home.',
        'Ugly win? Maybe. But a win. The scoreboard sees no difference.',
        '{winner} played below their best and still came out on top. That\'s something.',
        'Unconventional. Surprising. Effective. That was {winner}\'s match.',
      ],

      
      photoFinish: [
        'That was a photo finish. I had to check the scoreboard twice.',
        'The closest match I\'ve hosted. {winner} wins by a photographer\'s margin.',
        'They were level until the very last exchange. {winner} blinked last.',
        'I genuinely didn\'t know who had won until the numbers settled.',
        '{winner} by {gap} points after everything. That\'s as close as this gets.',
        'Both players were equal. Then suddenly one wasn\'t. That was {winner}.',
        '{gap} points separated the champion from the runner-up. Barely anything.',
        'You could not have drawn this match any closer without making it a tie.',
        'The narrowest of margins. {winner} by {gap}. That\'s going to sting for {second}.',
      ],

      
      solo: [
        '{winner} played alone and still brought full energy. Respect.',
        'When the competition is yourself, {winner} chose to win.',
        'Solo mode complete. {winner} answers to no one — and answered everything.',
        'One player, {total} questions, full commitment. That\'s {winner}.',
        'No competition required. {winner} showed up and delivered anyway.',
        'Playing alone doesn\'t mean playing easy. {winner} took it seriously.',
      ],

      
      generic: [
        'And today\'s champion is {winner}. The leaderboard agrees.',
        '{winner} takes it. That\'s what this match came down to.',
        'The crown lands on {winner}. Well earned.',
        'Ladies and gentlemen — your winner is {winner}.',
        'Step aside, everyone. {winner} has a trophy to collect.',
        '{winner} came here to win. Mission accomplished.',
        'I\'ve seen this match play out. {winner} played it best.',
        'The scoreboard does not lie. {winner} is the champion.',
        '{winner} made the key plays when it mattered most.',
        'That wasn\'t a game. That was a statement from {winner}.',
        'The gap between first and second tells the whole story.',
        'BrainBlast has a new champion. Take a bow, {winner}.',
        '{winner} answered what needed answering and won what needed winning.',
        'A clean win for {winner}. The numbers speak clearly.',
        'At the end of {total} questions, {winner} stands tallest.',
        '{winner} outscored the competition in a {total}-question match. Clean and simple.',
      ],
    };

    
    
    const _recentMC = {};
    const MC_RECENT_CAP = 4;

    function _pickMC(situation) {
      const pool = MC[situation] ?? MC.generic;
      if (!_recentMC[situation]) _recentMC[situation] = [];
      const recent    = _recentMC[situation];
      const available = pool.filter(l => !recent.includes(l));
      const source    = available.length > 0 ? available : pool;
      const chosen    = source[Math.floor(Math.random() * source.length)];
      recent.push(chosen);
      if (recent.length > MC_RECENT_CAP) recent.shift();
      return chosen;
    }

    function _applyMCTokens(line, ctx) {
      return line
        .replace(/\{winner\}/g,  ctx.winner  ?? '')
        .replace(/\{second\}/g,  ctx.second  ?? '')
        .replace(/\{gap\}/g,     ctx.gap     ?? 0)
        .replace(/\{acc\}/g,     ctx.acc     ?? 0)
        .replace(/\{total\}/g,   ctx.total   ?? 0)
        .replace(/\{correct\}/g, ctx.correct ?? 0)
        .replace(/\{speed\}/g,   ctx.speed   ?? '?');
    }

    
    function _mpMatchCommentary(ranking, total, questionHistory) {
      if (!ranking || ranking.length === 0) return _pickMC('generic');

      const winner  = ranking[0];
      const second  = ranking[1] ?? null;
      const n       = ranking.length;

      
      const stats = ranking.map(p => {
        const acc     = Scoring.accuracy(p.correctCount ?? 0, total);
        const times   = (p.responseTimes ?? []).filter(t => t > 0);
        const avgTime = Scoring.calcAvgSpeed(times);
        const fastest = times.length ? Math.min(...times) : Infinity;
        return { p, acc, avgTime, fastest };
      });

      const winnerStats = stats[0];
      const secondStats = stats[1] ?? null;

      const winnerAcc  = winnerStats.acc;
      const winnerAvg  = winnerStats.avgTime;

      
      const gap       = second ? (winner.score - second.score) : winner.score;
      
      const minPoints = Scoring.BASE_POINTS;

      
      const allAcc    = stats.map(s => s.acc);
      const avgAllAcc = allAcc.reduce((a, b) => a + b, 0) / n;

      
      const allAvgTimes = stats.map(s => s.avgTime).filter(t => t > 0);

      
      const ctx = {
        winner:  winner.name,
        second:  second?.name ?? '',
        gap,
        acc:     winnerAcc,
        total,
        correct: winner.correctCount ?? 0,
        speed:   winnerAvg > 0 ? winnerAvg : '?',
      };

      

      
      if (n === 1) {
        return _applyMCTokens(_pickMC('solo'), ctx);
      }

      
      if (winnerAcc === 100) {
        return _applyMCTokens(_pickMC('perfect'), ctx);
      }

      
      const isDominant = gap >= minPoints * 3 && winnerAcc >= 70
                      && (second ? (winner.score - second.score) / Math.max(winner.score, 1) >= 0.35 : false);
      if (isDominant) {
        return _applyMCTokens(_pickMC('dominant'), ctx);
      }

      
      if (avgAllAcc < 45) {
        return _applyMCTokens(_pickMC('everyoneStruggled'), ctx);
      }

      
      if (avgAllAcc >= 72 && n >= 2) {
        return _applyMCTokens(_pickMC('everyoneStrong'), ctx);
      }

      
      if (gap <= minPoints && second) {
        return _applyMCTokens(_pickMC('photoFinish'), ctx);
      }

      
      if (gap <= minPoints * 2 && second) {
        return _applyMCTokens(_pickMC('close'), ctx);
      }

      
      if (gap === minPoints && second) {
        return _applyMCTokens(_pickMC('singleQuestion'), ctx);
      }

      
      
      if (questionHistory && questionHistory.length >= 2 && second) {
        const penultimate = questionHistory[questionHistory.length - 2];
        if (penultimate) {
          const wBefore  = penultimate.scoresAfter?.[winner.id]  ?? 0;
          const sBefore  = penultimate.scoresAfter?.[second.id]  ?? 0;
          const gapBefore = Math.abs(wBefore - sBefore);
          if (gapBefore <= minPoints * 1.5) {
            return _applyMCTokens(_pickMC('lastQuestionDecided'), ctx);
          }
        }
      }

      
      
      if (allAvgTimes.length >= 2 && winnerAvg > 0 && winnerAcc >= 60) {
        const otherAvgs    = allAvgTimes.filter((t, i) => i !== stats.findIndex(s => s.avgTime === winnerAvg));
        const secondFastest = otherAvgs.length ? Math.min(...otherAvgs) : Infinity;
        if (secondFastest > 0 && winnerAvg <= secondFastest * 0.6) {
          return _applyMCTokens(_pickMC('speedDominance'), ctx);
        }
      }

      
      if (secondStats && secondStats.avgTime > 0 && winnerAvg > secondStats.avgTime
          && winnerAcc > secondStats.acc + 10) {
        return _applyMCTokens(_pickMC('accuracyOverSpeed'), ctx);
      }

      
      if (questionHistory && questionHistory.length >= 2 && second) {
        let wasEverBehind = false;
        questionHistory.forEach(q => {
          const wScore = q.scoresAfter?.[winner.id] ?? 0;
          const sScore = q.scoresAfter?.[second.id] ?? 0;
          if (sScore > wScore) wasEverBehind = true;
        });
        if (wasEverBehind) {
          return _applyMCTokens(_pickMC('comeback'), ctx);
        }
      }
      
      if (second && (winner.correctCount ?? 0) < (second.correctCount ?? 0)
          && winner.score > second.score) {
        return _applyMCTokens(_pickMC('comeback'), ctx);
      }

      
      if (winnerAcc < 50) {
        return _applyMCTokens(_pickMC('luckyWin'), ctx);
      }

      
      return _applyMCTokens(_pickMC('generic'), ctx);
    }

    
    
    const _recentAnnouncements = [];
    const RECENT_ANNOUNCE_CAP  = 8;

    
    const _LEGACY_POOL = [
      'Step aside, everyone. The throne has a new owner.',
      'Ladies and gentlemen — your winner.',
      'The crown lands exactly where it belongs.',
      'Certified genius. The leaderboard agrees.',
      'Even I\'m impressed, and I\'m a robot.',
      'The scoreboard does NOT lie.',
      'That wasn\'t a game. That was a statement.',
    ];

    function _pickAnnouncement() {
      const available = _LEGACY_POOL.filter(l => !_recentAnnouncements.includes(l));
      const source    = available.length > 0 ? available : _LEGACY_POOL;
      const chosen    = source[Math.floor(Math.random() * source.length)];
      _recentAnnouncements.push(chosen);
      if (_recentAnnouncements.length > RECENT_ANNOUNCE_CAP) _recentAnnouncements.shift();
      return chosen;
    }

    function _mpWinnerTitleByAcc(acc) {
      const tier = acc >= 90 ? 'elite' : acc >= 70 ? 'great' : acc >= 50 ? 'solid' : 'lucky';
      const pool = MP_WINNER_TITLES_BY_TIER[tier];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    const MP_PLAYER_TITLES = {
      winner:      ['Champion 👑','Top Brain 🧠','Trivia King 🎯'],
      fastest:     ['Fastest Finger ⚡','Speed Demon 🚀','Quick Draw 🔫'],
      mostCorrect: ['Knowledge King 📚','Answer Machine 🤖','Ace Player ✅'],
      streak:      ['On Fire 🔥','Momentum Master ⚡','Comeback King 👑'],
      guesser:     ['Lucky Guesser 🍀','Fortune Favours 🎲','Coin Flip Expert 🪙'],
      slowSteady:  ['Slow & Steady 🐢','Thoughtful Thinker 💭','Deep Thinker 🤔'],
      riskTaker:   ['Risk Taker 🎲','Bold Player 💥','Wild Card 🃏'],
      learner:     ['Trivia Rookie 📖','Eager Learner 🌱','In Training 🏋'],
      close:       ['Almost There 😅','So Close 📏','Next Time 🔜'],
      middle:      ['Solid Player 💪','Brainstormer 🌩','The Contender 🥊'],
    };
    const MP_ROASTS = [
      '{name} guessed with confidence. Sadly, confidence isn\'t always enough.',
      '{name} discovered several new wrong answers today.',
      '{name} had the right energy, just the wrong answers.',
      '{name} scared me for a minute there. Then stopped.',
      '{name} played with heart. Heart wasn\'t enough.',
      '{name} kept it interesting. Everyone appreciated the suspense.',
      '{name} answered fast. Accuracy was a secondary priority.',
      '{name} made the leaderboard more colourful.',
      '{name} contributed to the group\'s average. Nobly.',
      'At least {name} showed up. That\'s something.',
      '{name} took the phrase "just guess" literally.',
      'Sources say {name} had fun. That\'s the spirit.',
    ];
    const MP_WINNER_ROASTS = [
      '{name} made the rest of the room look like they were guessing.',
      '{name} studied. The others did not.',
      'Nobody told {name} it was supposed to be a challenge.',
    ];

    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

    
    function soloTitle(acc) {
      if (acc === 100) return 'Omniscient 🔱';
      if (acc >= 95)   return 'Brain Emperor 👑';
      if (acc >= 90)   return 'Genius 🧠';
      if (acc >= 80)   return 'Mastermind 🎯';
      if (acc >= 70)   return 'Sharp Thinker ⚡';
      if (acc >= 60)   return 'Almost Genius 💡';
      if (acc >= 50)   return 'Getting There 📈';
      if (acc >= 40)   return 'Curious Mind 🔍';
      if (acc >= 30)   return 'Lucky Guesser 🍀';
      return 'Chaos Machine 🌀';
    }

    function soloBot(acc)    { return _pickBotLine({ accuracy: acc, correct: 0, total: 0, fastestAnswer: 0, avgSpeed: 0, timeouts: 0 }); }
    function soloBotByTitle(_title, summary) {
      
      if (summary) return _pickBotLine(summary);
      return _pickBotLine({ accuracy: 0, correct: 0, total: 0, fastestAnswer: 0, avgSpeed: 0, timeouts: 0 });
    }
    function soloSubtitle(acc) { return SOLO_SUBTITLES[soloTitle(acc)] ?? ''; }
    function mpWinnerTitle(acc) { return _mpWinnerTitleByAcc(acc ?? 0); }
    
    function mpWinnerBot()      { return _pickAnnouncement(); }
    
    function mpMatchCommentary(ranking, total, questionHistory) { return _mpMatchCommentary(ranking, total, questionHistory); }
    function mpPlayerRoast(name)  { return _pick(MP_ROASTS).replace(/\{name\}/g, name); }
    function mpWinnerRoast(name)  { return _pick(MP_WINNER_ROASTS).replace(/\{name\}/g, name); }

    function mpPlayerTitle(player, ranking, total) {
      const i   = ranking.findIndex(p => p.id === player.id);
      const acc = Scoring.accuracy(player.correctCount ?? 0, total);
      const myAvg = Scoring.calcAvgSpeed(player.responseTimes ?? []);
      const allAvgs = ranking.map(p => Scoring.calcAvgSpeed(p.responseTimes ?? [])).filter(t => t > 0);
      const isFastest = allAvgs.length > 1 && myAvg > 0 && myAvg === Math.min(...allAvgs);
      const maxC  = Math.max(...ranking.map(p => p.correctCount ?? 0));

      if (i === 0)  return _pick(MP_PLAYER_TITLES.winner);
      if (isFastest) return _pick(MP_PLAYER_TITLES.fastest);
      if ((player.correctCount ?? 0) === maxC && i > 0) return _pick(MP_PLAYER_TITLES.mostCorrect);
      if (acc >= 80) return _pick(MP_PLAYER_TITLES.streak);
      if (acc >= 60) return _pick(MP_PLAYER_TITLES.middle);
      if (acc >= 40 && allAvgs.length > 1 && myAvg === Math.max(...allAvgs)) return _pick(MP_PLAYER_TITLES.slowSteady);
      if (acc >= 40) return _pick(MP_PLAYER_TITLES.riskTaker);
      if (acc >= 20) return _pick(MP_PLAYER_TITLES.close);
      return _pick(MP_PLAYER_TITLES.learner);
    }

    return { soloTitle, soloSubtitle, soloBot, soloBotByTitle, mpWinnerTitle, mpWinnerBot, mpMatchCommentary, mpPlayerRoast, mpWinnerRoast, mpPlayerTitle };
  })();

  
  let _confettiRafId     = null;
  let _confettiTimeoutId = null;

  function _launchConfetti() {
    const canvas = document.getElementById('results-confetti-canvas');
    if (!canvas) return;

    
    if (_confettiRafId !== null) {
      cancelAnimationFrame(_confettiRafId);
      _confettiRafId = null;
    }
    if (_confettiTimeoutId !== null) {
      clearTimeout(_confettiTimeoutId);
      _confettiTimeoutId = null;
    }

    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    const COLORS   = ['#6C63FF','#FD79A8','#FDCB6E','#00C9A7','#A29BFE','#FF6B6B','#fff'];
    const SHAPES   = ['rect','circle'];
    const DURATION = 4200;
    const startT   = performance.now();
    const pieces   = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,   y: -10 - Math.random() * 80,
      vx:(Math.random() - 0.5) * 4,      vy: 2 + Math.random() * 4,
      rot:Math.random() * Math.PI * 2,   vrot:(Math.random() - 0.5) * 0.2,
      w:  6 + Math.random() * 8,         h:  4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      alpha: 1,
    }));

    function draw(now) {
      const progress = (now - startT) / DURATION;
      if (progress >= 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        _confettiRafId = null;
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.06;
        p.alpha = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.restore();
      });
      _confettiRafId = requestAnimationFrame(draw);
    }

    _confettiRafId = requestAnimationFrame(draw);

    
    
    _confettiTimeoutId = setTimeout(() => {
      if (_confettiRafId !== null) {
        cancelAnimationFrame(_confettiRafId);
        _confettiRafId = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      _confettiTimeoutId = null;
    }, DURATION + 200);
  }

  
  function _countUpElWithGlow(el, target) {
    if (!el) return;
    const DURATION = 1000;
    const startT = performance.now();
    if (el._countTween) cancelAnimationFrame(el._countTween);
    
    function tick(now) {
      const p = Math.min((now - startT) / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      
      if (p < 1) {
        el._countTween = requestAnimationFrame(tick);
      } else { 
        el.textContent = target; 
        el._countTween = null;
        el.classList.remove('is-counting');
      }
    }
    el._countTween = requestAnimationFrame(tick);
  }

  
  function _spawnScoreParticles(score) {
    const canvas = document.getElementById('solo-score-particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    const COLORS = ['#6C63FF', '#A29BFE', '#00C9A7', '#FDCB6E'];
    const DURATION = 2000;
    const startT = performance.now();
    const particleCount = Math.min(20, Math.floor(score / 50) + 8);
    
    const particles = Array.from({ length: particleCount }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height / 2 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
      size: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
    }));
    
    let rafId;
    function draw(now) {
      const progress = (now - startT) / DURATION;
      if (progress >= 1) { 
        ctx.clearRect(0, 0, canvas.width, canvas.height); 
        return; 
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;
        
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      rafId = requestAnimationFrame(draw);
    }
    
    rafId = requestAnimationFrame(draw);
    setTimeout(() => { 
      cancelAnimationFrame(rafId); 
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
    }, DURATION + 200);
  }

  
  function _countUpEl(el, target) {
    if (!el) return;
    const DURATION = 700;
    const startT = performance.now();
    if (el._countTween) cancelAnimationFrame(el._countTween);
    function tick(now) {
      const p = Math.min((now - startT) / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) el._countTween = requestAnimationFrame(tick);
      else { el.textContent = target; el._countTween = null; }
    }
    el._countTween = requestAnimationFrame(tick);
  }

  
  
  function renderSoloResults(summary, resultsData, playerName, playerAvatar) {
    
    const soloEl  = document.getElementById('results-solo');
    const multiEl = document.getElementById('results-multi');
    if (soloEl)  soloEl.hidden  = false;
    if (multiEl) multiEl.hidden = true;

    const acc   = summary.accuracy;
    const wrong = (summary.total ?? 0) - (summary.correct ?? 0);

    
    const titleEl    = document.getElementById('solo-result-title');
    const subtitleEl = document.getElementById('solo-result-subtitle');
    if (titleEl)    titleEl.textContent    = _ResultsData.soloTitle(acc);
    if (subtitleEl) subtitleEl.textContent = _ResultsData.soloSubtitle(acc);

    
    const scoreEl = document.getElementById('solo-score');
    if (scoreEl) { 
      scoreEl.textContent = '0';
      scoreEl.classList.add('is-counting');
      setTimeout(() => {
        _countUpElWithGlow(scoreEl, summary.score);
        _spawnScoreParticles(summary.score);
      }, 350); 
    }

    
    const statsGrid = document.getElementById('solo-stats-grid');
    if (statsGrid) {
      const fastest = summary.fastestAnswer > 0 ? `${summary.fastestAnswer}s` : '—';
      const avgTime = summary.avgSpeed > 0 ? `${summary.avgSpeed}s` : '—';
      const stats = [
        { icon:'✅', value: summary.correct,  label:'Correct',             hl: acc >= 70 },
        { icon:'❌', value: wrong,            label:'Wrong' },
        { icon:'🎯', value: `${acc}%`,        label:'Accuracy',            hl: acc >= 70 },
        { icon:'⚡', value: fastest,          label:'Fastest Answer' },
        { icon:'⏱',  value: avgTime,          label:'Avg Response Time' },
      ];
      statsGrid.innerHTML = '';
      stats.forEach((s, i) => {
        const card = createElement('div', { class:`res-stat-card${s.hl ? ' res-stat-card--highlight' : ''}`, role:'listitem' });
        card.style.animationDelay = `${0.15 + i * 0.05}s`;
        card.innerHTML = `
          <span class="res-stat-card__icon" aria-hidden="true">${s.icon}</span>
          <span class="res-stat-card__value">${_esc(String(s.value))}</span>
          <span class="res-stat-card__label">${s.label}</span>`;
        statsGrid.appendChild(card);
      });
    }

    
    const botText = document.getElementById('solo-brainbot-text');
    if (botText) botText.textContent = _ResultsData.soloBotByTitle(null, summary);

    
    if (acc >= 80) setTimeout(_launchConfetti, 400);
  }

  
  
  
  function _assignAwards(ranking, total) {
    
    const stats = ranking.map((p, rankIdx) => {
      const allTimes  = p.responseTimes ?? [];                       
      const times     = allTimes.filter(t => t > 0);                
      const answered  = times.length;
      const acc       = Scoring.accuracy(p.correctCount ?? 0, total);
      const avgTime   = Scoring.calcAvgSpeed(times);
      const fastTime  = times.length ? Math.min(...times) : Infinity;
      const slowTime  = times.length ? Math.max(...times) : 0;

      
      let stdDev = 0;
      if (times.length > 1) {
        const mean = times.reduce((a, b) => a + b, 0) / times.length;
        stdDev = Math.round(
          Math.sqrt(times.map(t => (t - mean) ** 2).reduce((a, b) => a + b, 0) / times.length) * 100
        ) / 100;
      }

      
      const half      = Math.floor(total / 2);
      const firstHalf = times.slice(0, half);
      const secndHalf = times.slice(half);
      const avgFirst  = Scoring.calcAvgSpeed(firstHalf);
      const avgSecnd  = Scoring.calcAvgSpeed(secndHalf);
      
      const improvement = (avgFirst > 0 && avgSecnd > 0)
        ? Math.round(((avgFirst - avgSecnd) / avgFirst) * 100) : 0;

      
      const lateSlice = Math.ceil(total / 3);
      const lateStart = Math.max(0, total - lateSlice);
      const lateTimes = allTimes.slice(lateStart).filter(t => t > 0);
      const lateQuick = lateTimes.filter(t => avgTime > 0 && t <= avgTime).length;
      const lateAcc   = lateTimes.length > 0
        ? Math.round((lateQuick / lateTimes.length) * 100) : 0;

      
      const timeouts = allTimes.filter(t => t >= 14).length;

      
      const quickAnswers = times.filter(t => t <= 4).length;

      
      const blazingAnswers = times.filter(t => t <= 3).length;

      
      const slowAnswers = times.filter(t => t >= 10).length;

      
      const scores   = ranking.map(pl => pl.score);
      const margin   = rankIdx === 0 && scores.length > 1
        ? scores[0] - scores[1] : 0;

      
      
      let maxRun = 0, curRun = 0;
      for (const t of allTimes) {
        if (t > 0 && (avgTime <= 0 || t <= avgTime + 1)) { curRun++; maxRun = Math.max(maxRun, curRun); }
        else curRun = 0;
      }
      const bestRun = maxRun;

      
      const perfectRoundScore = answered > 0
        ? Math.round((quickAnswers / answered) * 100) : 0;

      
      const rank = rankIdx;

      return {
        p, rank, acc, avgTime, fastTime, slowTime, stdDev,
        improvement, lateAcc, timeouts, quickAnswers, blazingAnswers,
        slowAnswers, margin, bestRun, perfectRoundScore, answered,
      };
    });

    
    
    
    
    
    
    const AWARDS = [
      
      {
        id: 'brain_emperor',
        emoji: '👑', title: 'Brain Emperor', color: '#FDCB6E',
        statLabel: 'Final Score',
        statVal:   (s, i) => `${s[i].p.score} pts`,
        desc:      () => 'The throne was never in doubt.',
        qualify:   (s, i) => i === 0 && s[i].p.score > 0 ? 200 : 0,
      },
      {
        id: 'perfect_mind',
        emoji: '🧠', title: 'Mastermind', color: '#6C63FF',
        statLabel: 'Accuracy',
        statVal:   (s, i) => `${s[i].acc}%`,
        desc:      () => 'Not a single mistake. Textbook.',
        qualify:   (s, i) => s[i].acc === 100 ? 180 : 0,
      },
      {
        id: 'runaway',
        emoji: '🏆', title: 'Dominant Force', color: '#FDCB6E',
        statLabel: 'Winning Margin',
        statVal:   (s, i) => `+${s[i].margin} pts`,
        desc:      () => 'Everyone else was playing for second place.',
        qualify:   (s, i) => i === 0 && s[i].margin >= 200 ? 160 : 0,
      },
      
      {
        id: 'lightning_reflexes',
        emoji: '⚡', title: 'Lightning Reflexes', color: '#FDCB6E',
        statLabel: 'Fastest Answer',
        statVal:   (s, i) => s[i].fastTime < Infinity ? `${s[i].fastTime}s` : '—',
        desc:      () => 'You barely finished reading before answering.',
        qualify:   (s, i) => {
          if (s[i].fastTime === Infinity) return 0;
          const best = Math.min(...s.map(x => x.fastTime).filter(t => t < Infinity));
          return s[i].fastTime === best ? 140 : 0;
        },
      },
      {
        id: 'rocket_avg',
        emoji: '🚀', title: 'Rocket Speed', color: '#E17055',
        statLabel: 'Avg Response Time',
        statVal:   (s, i) => s[i].avgTime > 0 ? `${s[i].avgTime}s` : '—',
        desc:      () => 'The timer was barely a suggestion.',
        qualify:   (s, i) => {
          if (s[i].avgTime <= 0) return 0;
          const best = Math.min(...s.filter(x => x.avgTime > 0).map(x => x.avgTime));
          return s[i].avgTime === best ? 130 : 0;
        },
      },
      {
        id: 'hair_trigger',
        emoji: '🔫', title: 'Hair Trigger', color: '#FD79A8',
        statLabel: 'Sub-3s Answers',
        statVal:   (s, i) => `${s[i].blazingAnswers} questions`,
        desc:      () => 'Instinct-mode fully activated.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.blazingAnswers));
          return best >= 2 && s[i].blazingAnswers === best ? 120 : 0;
        },
      },
      {
        id: 'risk_taker',
        emoji: '🎲', title: 'Risk Taker', color: '#FD79A8',
        statLabel: 'Quick Answers',
        statVal:   (s, i) => `${s[i].quickAnswers} questions`,
        desc:      () => 'Fast answers, no second-guessing. Bold play.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.quickAnswers));
          return best > 0 && s[i].quickAnswers === best ? 110 : 0;
        },
      },
      {
        id: 'sharpshooter',
        emoji: '🎯', title: 'Sharpshooter', color: '#00C9A7',
        statLabel: 'Accuracy',
        statVal:   (s, i) => `${s[i].acc}%`,
        desc:      () => 'Precision loaded. Shots fired. All landed.',
        qualify:   (s, i) => {
          if (s[i].acc < 80) return 0;
          const best = Math.max(...s.map(x => x.acc));
          return s[i].acc === best ? 150 : 0;
        },
      },
      {
        id: 'precision_player',
        emoji: '💎', title: 'Precision Player', color: '#00CEC9',
        statLabel: 'Correct Answers',
        statVal:   (s, i) => `${s[i].p.correctCount}/${total}`,
        desc:      () => 'Every answer felt deliberate. Surgical.',
        qualify:   (s, i) => s[i].acc >= 70 ? s[i].acc * 1.3 : 0,
      },
      {
        id: 'bullseye',
        emoji: '🏹', title: 'Bullseye', color: '#55EFC4',
        statLabel: 'Hit Rate',
        statVal:   (s, i) => `${s[i].acc}%`,
        desc:      () => 'Aimed. Fired. Hit. Every single time.',
        qualify:   (s, i) => s[i].acc >= 60 ? s[i].acc * 1.1 : 0,
      },
      
      {
        id: 'ice_cold',
        emoji: '🧊', title: 'Ice Cold', color: '#74B9FF',
        statLabel: 'Response Consistency',
        statVal:   (s, i) => s[i].stdDev > 0 ? `±${s[i].stdDev}s` : 'Perfect',
        desc:      () => 'Unshakeable. Same pace, every question.',
        qualify:   (s, i) => {
          if (s[i].stdDev <= 0) return 0;
          const validDevs = s.filter(x => x.stdDev > 0);
          const best = Math.min(...validDevs.map(x => x.stdDev));
          return s[i].stdDev === best ? 105 : 0;
        },
      },
      {
        id: 'consistent_genius',
        emoji: '🛡', title: 'Consistent Genius', color: '#A29BFE',
        statLabel: 'Std Deviation',
        statVal:   (s, i) => s[i].stdDev > 0 ? `±${s[i].stdDev}s` : '—',
        desc:      () => 'Zero variance. Pure clockwork.',
        qualify:   (s, i) => s[i].stdDev > 0 && s[i].stdDev <= 2 ? 80 + (2 - s[i].stdDev) * 10 : 0,
      },
      {
        id: 'slow_burn',
        emoji: '🕯', title: 'Slow Burn', color: '#636E72',
        statLabel: 'Avg Response Time',
        statVal:   (s, i) => s[i].avgTime > 0 ? `${s[i].avgTime}s` : '—',
        desc:      () => 'Methodical. Every second counted.',
        qualify:   (s, i) => {
          if (s[i].avgTime <= 0) return 0;
          const worst = Math.max(...s.filter(x => x.avgTime > 0).map(x => x.avgTime));
          return s[i].avgTime === worst && s[i].acc >= 40 ? 45 : 0;
        },
      },
      
      {
        id: 'clutch_performer',
        emoji: '🌟', title: 'Clutch Performer', color: '#FF6B6B',
        statLabel: 'Late-Game Accuracy',
        statVal:   (s, i) => `${s[i].lateAcc}%`,
        desc:      () => 'When it mattered most, you delivered.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.lateAcc));
          return s[i].lateAcc >= 60 && s[i].lateAcc === best ? 100 : 0;
        },
      },
      {
        id: 'comeback_king',
        emoji: '🚀', title: 'Comeback King', color: '#FD79A8',
        statLabel: 'Speed Improvement',
        statVal:   (s, i) => `+${s[i].improvement}% faster`,
        desc:      () => 'Started slow. Finished on fire.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.improvement));
          return s[i].improvement >= 20 && s[i].improvement === best ? 95 : 0;
        },
      },
      {
        id: 'on_fire',
        emoji: '🔥', title: 'On Fire', color: '#E84393',
        statLabel: 'Longest Hot Streak',
        statVal:   (s, i) => `${s[i].bestRun} in a row`,
        desc:      () => 'Couldn\'t be stopped once you got rolling.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.bestRun));
          return s[i].bestRun >= 3 && s[i].bestRun === best ? 90 : 0;
        },
      },
      {
        id: 'rising_star',
        emoji: '⭐', title: 'Rising Star', color: '#FDCB6E',
        statLabel: 'Second-Half Pace',
        statVal:   (s, i) => s[i].improvement > 0 ? `${s[i].improvement}% faster` : 'Steady',
        desc:      () => 'Got sharper as the pressure rose.',
        qualify:   (s, i) => s[i].improvement >= 10 ? s[i].improvement * 0.8 : 0,
      },
      
      {
        id: 'knowledge_keeper',
        emoji: '📚', title: 'Knowledge Keeper', color: '#6C63FF',
        statLabel: 'Correct Answers',
        statVal:   (s, i) => `${s[i].p.correctCount}/${total}`,
        desc:      () => 'Years of trivia prep finally paying off.',
        qualify:   (s, i) => s[i].acc >= 50 ? s[i].acc * 0.9 : 0,
      },
      {
        id: 'brainstormer',
        emoji: '💡', title: 'Brainstormer', color: '#00C9A7',
        statLabel: 'Balance Score',
        statVal:   (s, i) => {
          if (s[i].acc <= 0 || s[i].avgTime <= 0) return '—';
          return `${s[i].acc}% / ${s[i].avgTime}s`;
        },
        desc:      () => 'Strong accuracy, solid pace. Balanced.',
        qualify:   (s, i) => {
          if (s[i].acc <= 0 || s[i].avgTime <= 0) return 0;
          return (s[i].acc / 100) * (1 / s[i].avgTime) * 60;
        },
      },
      {
        id: 'deep_thinker',
        emoji: '🔭', title: 'Deep Thinker', color: '#6C63FF',
        statLabel: 'Avg Response Time',
        statVal:   (s, i) => s[i].avgTime > 0 ? `${s[i].avgTime}s` : '—',
        desc:      () => 'You considered every angle before committing.',
        qualify:   (s, i) => s[i].slowAnswers >= 2 && s[i].acc >= 40 ? s[i].acc * 0.7 : 0,
      },
      {
        id: 'last_stand',
        emoji: '🗡', title: 'Last Stand', color: '#636E72',
        statLabel: 'Final Place',
        statVal:   (s, i) => `${i + 1} of ${s.length}`,
        desc:      () => 'Fought every round. Respect.',
        qualify:   (s, i) => {
          const isLast = i === s.length - 1 && s.length > 2;
          return isLast && s[i].acc >= 20 ? 35 : 0;
        },
      },
      {
        id: 'underdog',
        emoji: '🐕', title: 'Underdog', color: '#B2BEC3',
        statLabel: 'Score',
        statVal:   (s, i) => `${s[i].p.score} pts`,
        desc:      () => 'Not the score you wanted. But you showed up.',
        qualify:   (s, i) => i === s.length - 1 && s.length > 2 ? 30 : 0,
      },
      
      {
        id: 'lucky_legend',
        emoji: '🍀', title: 'Lucky Legend', color: '#00B894',
        statLabel: 'Accuracy',
        statVal:   (s, i) => `${s[i].acc}%`,
        desc:      () => 'The odds were against you. You didn\'t notice.',
        qualify:   (s, i) => s[i].acc >= 20 && s[i].acc < 50 && s[i].p.score > 0 ? 40 : 0,
      },
      {
        id: 'time_bandit',
        emoji: '⏳', title: 'Time Bandit', color: '#E17055',
        statLabel: 'Near-Timeouts',
        statVal:   (s, i) => `${s[i].slowAnswers} slow answers`,
        desc:      () => 'Always answered. Never with time to spare.',
        qualify:   (s, i) => {
          const best = Math.max(...s.map(x => x.slowAnswers));
          return best >= 2 && s[i].slowAnswers === best ? 38 : 0;
        },
      },
      {
        id: 'glass_cannon',
        emoji: '💣', title: 'Glass Cannon', color: '#FF7675',
        statLabel: 'Fastest Answer',
        statVal:   (s, i) => s[i].fastTime < Infinity ? `${s[i].fastTime}s` : '—',
        desc:      () => 'Blazing fast. Not always right. Spectacularly bold.',
        qualify:   (s, i) => s[i].blazingAnswers >= 2 && s[i].acc < 60 ? 36 : 0,
      },
      {
        id: 'wild_card',
        emoji: '🃏', title: 'Wild Card', color: '#A29BFE',
        statLabel: 'Consistency',
        statVal:   (s, i) => s[i].stdDev > 0 ? `±${s[i].stdDev}s` : '—',
        desc:      () => 'Unpredictable. Chaotic. Somehow effective.',
        qualify:   (s, i) => s[i].stdDev >= 3 && s[i].acc >= 30 ? 34 : 0,
      },
      {
        id: 'survivor',
        emoji: '🏕', title: 'Survivor', color: '#FDCB6E',
        statLabel: 'Questions Answered',
        statVal:   (s, i) => `${s[i].answered}/${total}`,
        desc:      () => 'Made it through every question in one piece.',
        qualify:   (s, i) => s[i].answered === total && s[i].acc < 50 ? 33 : 0,
      },
      
      {
        id: 'trivia_explorer',
        emoji: '🌍', title: 'Trivia Explorer', color: '#74B9FF',
        statLabel: 'Participation',
        statVal:   (s, i) => `${s[i].answered} answered`,
        desc:      () => 'Curiosity is half the battle. You showed up.',
        qualify:   () => 20,
      },
      {
        id: 'participant',
        emoji: '✨', title: 'Spirit of the Game', color: '#DFE6E9',
        statLabel: 'Score',
        statVal:   (s, i) => `${s[i].p.score} pts`,
        desc:      () => 'Every legend has to start somewhere.',
        qualify:   () => 10,
      },
    ];

    
    
    

    const result       = new Array(ranking.length).fill(null);
    const claimedAward = new Set();
    const claimedIdx   = new Set();

    AWARDS.forEach(award => {
      if (claimedAward.has(award.id)) return;
      let bestScore = 0, bestIdx = -1;
      stats.forEach((_, i) => {
        if (claimedIdx.has(i)) return;
        const score = award.qualify(stats, i);
        if (score > bestScore) { bestScore = score; bestIdx = i; }
      });
      if (bestIdx >= 0 && bestScore > 0) {
        result[bestIdx] = award;
        claimedAward.add(award.id);
        claimedIdx.add(bestIdx);
      }
    });

    stats.forEach((_, i) => {
      if (claimedIdx.has(i)) return;
      let bestScore = -1, bestAward = null;
      AWARDS.forEach(award => {
        const score = award.qualify(stats, i);
        if (score > bestScore) { bestScore = score; bestAward = award; }
      });
      result[i] = bestAward ?? AWARDS[AWARDS.length - 1];
    });

    
    return result.map((award, i) => ({
      player:   ranking[i],
      award: {
        emoji:     award.emoji,
        title:     award.title,
        color:     award.color,
        statLabel: award.statLabel,
        statVal:   award.statVal(stats, i),
        desc:      award.desc(stats, i),
      },
    }));
  }

  

  
  function _buildMatchStats(ranking, total, gameDurationMs, questionHistory) {
    const stats = [];

    
    if (gameDurationMs != null && gameDurationMs > 0) {
      const totalSec = Math.round(gameDurationMs / 1000);
      const mins     = Math.floor(totalSec / 60);
      const secs     = totalSec % 60;
      stats.push({
        id:        'total-time',
        emoji:     '⏱',
        label:     'Total Match Time',
        value:     mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
        sub:       `Across ${total} question${total !== 1 ? 's' : ''}`,
        highlight: false,
      });
    }

    
    let fastestTime  = Infinity;
    let fastestPlayer = null;
    ranking.forEach(p => {
      const times = (p.responseTimes ?? []).filter(t => t > 0 && t < 14);
      if (!times.length) return;
      const best = Math.min(...times);
      if (best < fastestTime) { fastestTime = best; fastestPlayer = p; }
    });
    if (fastestPlayer && fastestTime < Infinity) {
      stats.push({
        id:        'fastest-answer',
        emoji:     '⚡',
        label:     'Fastest Answer',
        value:     `${Math.round(fastestTime * 100) / 100}s`,
        sub:       fastestPlayer.name,
        highlight: false,
      });
    }

    
    if (ranking.length > 0 && total > 0) {
      const best = ranking.reduce((a, b) =>
        (b.correctCount ?? 0) > (a.correctCount ?? 0) ? b : a
      );
      const acc = Scoring.accuracy(best.correctCount ?? 0, total);
      if (acc > 0) {
        stats.push({
          id:        'highest-accuracy',
          emoji:     '🧠',
          label:     'Highest Accuracy',
          value:     `${acc}%`,
          sub:       best.name,
          highlight: acc === 100,
        });
      }
    }

    
    if (questionHistory.length > 0) {
      
      const toughest = questionHistory.reduce((min, q) =>
        q.correctCount < min.correctCount ? q : min
      );
      
      if (toughest.correctCount < ranking.length) {
        const qNum     = toughest.questionIndex + 1;
        const correct  = toughest.correctCount;
        const subText  = correct === 0
          ? 'Nobody answered correctly'
          : correct === 1
          ? 'Only 1 player answered correctly'
          : `Only ${correct} players answered correctly`;
        stats.push({
          id:        'toughest-question',
          emoji:     '🎯',
          label:     'Toughest Question',
          value:     `Question ${qNum}`,
          sub:       subText,
          highlight: false,
        });
      }
    }

    
    
    
    
    if (questionHistory.length >= 2) {
      let bestStreakLen    = 0;
      let bestStreakPlayer = null;

      ranking.forEach(p => {
        
        
        let streak = 0, maxStreak = 0;
        questionHistory.forEach(q => {
          const scoreBefore = q.scoresBefore?.[p.id] ?? 0;
          const scoreAfter  = q.scoresAfter?.[p.id] ?? 0;
          if (scoreAfter > scoreBefore) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
          } else {
            streak = 0;
          }
        });
        if (maxStreak > bestStreakLen) {
          bestStreakLen    = maxStreak;
          bestStreakPlayer = p;
        }
      });

      if (bestStreakPlayer && bestStreakLen >= 3) {
        stats.push({
          id:        'best-streak',
          emoji:     '🔥',
          label:     'Best Streak',
          value:     `${bestStreakLen} in a row`,
          sub:       bestStreakPlayer.name,
          highlight: bestStreakLen >= total,
        });
      }
    }

    
    
    
    const COMEBACK_MIN_DEFICIT = Scoring.BASE_POINTS * 2;
    if (questionHistory.length >= 2 && ranking.length > 1) {
      const winner = ranking[0];
      let wasEverBehind = false;
      let maxDeficit    = 0;

      questionHistory.forEach(q => {
        const winnerScore  = q.scoresAfter?.[winner.id] ?? 0;
        const otherScores  = ranking
          .filter(p => p.id !== winner.id)
          .map(p => q.scoresAfter?.[p.id] ?? 0);
        const leaderScore  = Math.max(...otherScores);
        const deficit = leaderScore - winnerScore;
        if (deficit >= COMEBACK_MIN_DEFICIT) {
          wasEverBehind = true;
          maxDeficit = Math.max(maxDeficit, deficit);
        }
      });

      if (wasEverBehind && maxDeficit >= COMEBACK_MIN_DEFICIT) {
        stats.push({
          id:        'biggest-comeback',
          emoji:     '📈',
          label:     'Biggest Comeback',
          value:     winner.name,
          sub:       `Trailed by ${maxDeficit} pts, came back to win`,
          highlight: true,
        });
      }
    }

    
    if (questionHistory.length > 0 && ranking.length > 1) {
      
      let closestGap = Infinity;
      let closestQNum = -1;

      questionHistory.forEach(q => {
        if (q.minScoreGap != null && q.minScoreGap < closestGap) {
          closestGap  = q.minScoreGap;
          closestQNum = q.questionIndex + 1;
        }
      });

      
      
      if (closestQNum > 1 && closestGap <= Scoring.BASE_POINTS * 2) {
        const gapText = closestGap === 0
          ? 'Players were level'
          : `Only ${closestGap} pts separated the players`;
        stats.push({
          id:        'closest-moment',
          emoji:     '💥',
          label:     'Closest Moment',
          value:     `After Q${closestQNum}`,
          sub:       gapText,
          highlight: closestGap === 0,
        });
      }
    }

    
    if (ranking.length > 1) {
      const winner    = ranking[0];
      const runnerUp  = ranking[1];
      const margin    = winner.score - runnerUp.score;
      if (margin > 0) {
        stats.push({
          id:        'winning-margin',
          emoji:     '🏆',
          label:     'Winning Margin',
          value:     `+${margin} pts`,
          sub:       `${winner.name} over ${runnerUp.name}`,
          highlight: false,
        });
      } else if (margin === 0) {
        stats.push({
          id:        'winning-margin',
          emoji:     '🏆',
          label:     'Winning Margin',
          value:     'It\'s a tie!',
          sub:       `${winner.name} & ${runnerUp.name} — dead even`,
          highlight: true,
        });
      }
    }

    
    if (total > 0 && ranking.length > 0) {
      const totalCorrect = ranking.reduce((sum, p) => sum + (p.correctCount ?? 0), 0);
      const totalAnswers = ranking.length * total;
      const avgAcc       = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

      
      let diffEmoji, diffLabel, diffDesc, diffColor;
      if (avgAcc >= 70) {
        diffEmoji = '⭐'; diffLabel = 'Easy';
        diffDesc  = 'Most players answered confidently.';
        diffColor = 'success';
      } else if (avgAcc >= 50) {
        diffEmoji = '⚖️'; diffLabel = 'Balanced';
        diffDesc  = 'A healthy mix of wins and misses.';
        diffColor = 'warning';
      } else if (avgAcc >= 30) {
        diffEmoji = '🔥'; diffLabel = 'Hard';
        diffDesc  = 'These questions challenged everyone.';
        diffColor = 'danger';
      } else {
        diffEmoji = '☠️'; diffLabel = 'Brutal';
        diffDesc  = 'Almost nobody escaped unscathed.';
        diffColor = 'danger';
      }

      stats.push({
        id:        'match-difficulty',
        emoji:     diffEmoji,
        label:     'Match Difficulty',
        value:     diffLabel,
        sub:       diffDesc,
        sub2:      `${avgAcc}% avg accuracy`,
        highlight: false,
        accent:    diffColor,
      });
    }

    return stats;
  }

  
  function _renderMatchStats(ranking, total, gameDurationMs, questionHistory, cinematic) {
    const section   = document.getElementById('mp-matchstats-section');
    const container = document.getElementById('mp-match-stats');
    if (!section || !container) return;

    const stats = _buildMatchStats(ranking, total, gameDurationMs, questionHistory);

    
    if (stats.length === 0) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    container.innerHTML = '';

    stats.forEach((stat, i) => {
      const card = createElement('div', {
        class:        'res-matchstat-card',
        role:         'listitem',
        'aria-label': `${stat.label}: ${stat.value}`,
      });

      card.innerHTML = `
        <div class="res-matchstat-card__emoji" aria-hidden="true">${stat.emoji}</div>
        <div class="res-matchstat-card__body">
          <span class="res-matchstat-card__label">${_esc(stat.label)}</span>
          <span class="res-matchstat-card__value">${_esc(stat.value)}</span>
          <span class="res-matchstat-card__sub">${_esc(stat.sub)}</span>
          ${stat.sub2 ? `<span class="res-matchstat-card__sub2">${_esc(stat.sub2)}</span>` : ''}
        </div>`;

      container.appendChild(card);

      if (!cinematic) {
        
        setTimeout(() => card.classList.add('is-visible'), 200 + i * 100);
      }
    });
  }

   
  function renderMultiResults(ranking, total, gameDurationMs, cinematic = false, questionHistory = []) {
    const soloEl  = document.getElementById('results-solo');
    const multiEl = document.getElementById('results-multi');
    if (soloEl)  soloEl.hidden  = true;
    if (multiEl) multiEl.hidden = false;

    
    if (multiEl) {
      multiEl.classList.toggle('results-multi--cinematic', cinematic);
    }

    const winner = ranking[0];

    
    const heroEl = document.getElementById('mp-winner-section');
    if (winner && heroEl) {
      
      heroEl.classList.remove('is-visible', 'is-cinematic-reveal');

      const acc = total > 0
        ? Scoring.accuracy(winner.correctCount ?? 0, total)
        : 0;

      
      const avatarEl = document.getElementById('mp-winner-avatar');
      const titleEl  = document.getElementById('mp-winner-title');
      const nameEl   = document.getElementById('mp-winner-name');
      const scoreEl  = document.getElementById('mp-winner-score');
      const botEl    = document.getElementById('mp-winner-brainbot-text');

      
      if (avatarEl) {
        avatarEl.style.background = winner.color;
        avatarEl.innerHTML = `<iconify-icon icon="${winner.avatar}" noobserver></iconify-icon>`;
        avatarEl.style.setProperty('--winner-color', winner.color);
      }

      
      if (titleEl) titleEl.textContent = _ResultsData.mpWinnerTitle(acc);

      
      if (nameEl) nameEl.textContent = winner.name;

      
      if (scoreEl) {
        scoreEl.innerHTML = '<span class="mp-winner-score__num">0</span><span class="mp-winner-score__label"> POINTS</span>';
      }

      
      if (botEl) botEl.textContent = `"${_ResultsData.mpMatchCommentary(ranking, total, questionHistory)}"`;

      if (!cinematic) {
        
        setTimeout(() => heroEl.classList.add('is-visible'), 80);
        const numEl = scoreEl?.querySelector('.mp-winner-score__num');
        if (numEl) setTimeout(() => _countUpElWithGlow(numEl, winner.score), 600);
      }
      
    }

    
    const lbEl = document.getElementById('mp-leaderboard');
    if (lbEl) {
      lbEl.innerHTML = '';

      const PLACE_ICONS = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];

      ranking.forEach((player, i) => {
        const acc     = Scoring.accuracy(player.correctCount ?? 0, total);
        const avgTime = Scoring.calcAvgSpeed(player.responseTimes ?? []);
        const avgStr  = avgTime > 0 ? `${avgTime}s` : '—';

        const rankClass = i === 0 ? 'res-lb-row--1st'
                        : i === 1 ? 'res-lb-row--2nd'
                        : i === 2 ? 'res-lb-row--3rd'
                        : '';

        const placeIcon = PLACE_ICONS[i] ?? `${i + 1}`;

        const row = createElement('div', {
          class:        `res-lb-row ${rankClass}`,
          role:         'listitem',
          'aria-label': `${i + 1}st place: ${player.name}, ${player.score} points`,
        });

        row.innerHTML = `
          <span class="res-lb-row__place" aria-hidden="true">${placeIcon}</span>
          <div class="res-lb-row__avatar" style="background:${player.color}" aria-hidden="true">
            <iconify-icon icon="${player.avatar}" noobserver></iconify-icon>
          </div>
          <div class="res-lb-row__info">
            <span class="res-lb-row__name">${_esc(player.name)}</span>
            <div class="res-lb-row__chips">
              <span class="res-lb-row__chip" title="Accuracy">🎯 ${acc}%</span>
              <span class="res-lb-row__chip" title="Correct answers">✅ ${player.correctCount ?? 0}/${total}</span>
              <span class="res-lb-row__chip" title="Avg response time">⚡ ${avgStr}</span>
            </div>
          </div>
          <span class="res-lb-row__score" aria-label="${player.score} points">
            <span class="res-lb-score-num">0</span>
          </span>`;

        lbEl.appendChild(row);

        if (!cinematic) {
          
          const delay = 2000 + i * 220;
          setTimeout(() => {
            row.classList.add('is-visible');
            const numEl = row.querySelector('.res-lb-score-num');
            _countUpEl(numEl, player.score);
          }, delay);
        }
      });
    }

    
    const awardsEl = document.getElementById('mp-awards');
    if (awardsEl && ranking.length > 0) {
      awardsEl.innerHTML = '';

      const assigned = _assignAwards(ranking, total);

      assigned.forEach((entry, i) => {
        const card = createElement('div', {
          class:        'res-award-card',
          role:         'listitem',
          'aria-label': `${entry.player.name}: ${entry.award.title}`,
          style:        `--award-color: ${entry.award.color}`,
        });

        card.innerHTML = `
          <div class="res-award-card__avatar" style="background:${entry.player.color}" aria-hidden="true">
            <iconify-icon icon="${entry.player.avatar}" noobserver></iconify-icon>
          </div>
          <div class="res-award-card__body">
            <span class="res-award-card__player">${_esc(entry.player.name)}</span>
            <span class="res-award-card__badge">
              <span class="res-award-card__emoji" aria-hidden="true">${entry.award.emoji}</span>
              ${_esc(entry.award.title)}
            </span>
            <span class="res-award-card__stat">
              <span class="res-award-card__stat-val">${_esc(entry.award.statVal)}</span>
              <span class="res-award-card__stat-label">${_esc(entry.award.statLabel)}</span>
            </span>
            <span class="res-award-card__desc">${_esc(entry.award.desc)}</span>
          </div>`;

        awardsEl.appendChild(card);

        if (!cinematic) {
          
          const lbFinish = 2000 + ranking.length * 220;
          const delay    = lbFinish + 400 + i * 180;
          setTimeout(() => card.classList.add('is-visible'), delay);
        }
      });
    }

    
    _renderMatchStats(ranking, total, gameDurationMs, questionHistory, cinematic);

    if (!cinematic) {
      
      setTimeout(_launchConfetti, 500);
    }
  }

  
  function revealMpResultsCinematic(ranking, total) {
    const heroEl  = document.getElementById('mp-winner-section');
    const scoreEl = document.getElementById('mp-winner-score');
    const lbEl    = document.getElementById('mp-leaderboard');

    
    
    
    
    const screenEl = document.getElementById('screen-results');
    if (screenEl) _scrollInstant(screenEl, 0);

    
    if (heroEl) {
      
      void heroEl.offsetWidth;
      heroEl.classList.add('is-cinematic-reveal');
    }

    
    if (scoreEl) {
      const numEl = scoreEl.querySelector('.mp-winner-score__num');
      if (numEl && ranking[0]) {
        setTimeout(() => {
          numEl.classList.add('is-counting-cinematic');
          _countUpElWithGlow(numEl, ranking[0].score);
        }, 350);
      }
    }

    
    
    
    setTimeout(() => {
      if (screenEl) _scrollInstant(screenEl, 0);
      _launchConfetti();
    }, 700);

    
    const lbSection      = document.querySelector('.res-leaderboard-section');
    const awardsSection  = document.querySelector('.res-awards-section');
    const actionsSection = document.querySelector('.res-actions');

    
    if (lbSection) {
      setTimeout(() => lbSection.classList.add('is-section-visible'), 1200);
    }

    
    if (lbEl) {
      lbEl.querySelectorAll('.res-lb-row').forEach((row, i) => {
        setTimeout(() => {
          row.classList.add('is-visible');
          const numEl = row.querySelector('.res-lb-score-num');
          _countUpEl(numEl, ranking[i]?.score ?? 0);
        }, 1350 + i * 180);
      });
    }

    
    if (awardsSection) {
      const lbRowCount = ranking.length;
      const awardsDelay = 1350 + lbRowCount * 180 + 250;
      setTimeout(() => awardsSection.classList.add('is-section-visible'), awardsDelay);

      
      const awardsEl = document.getElementById('mp-awards');
      if (awardsEl) {
        awardsEl.querySelectorAll('.res-award-card').forEach((card, i) => {
          setTimeout(() => card.classList.add('is-visible'), awardsDelay + 150 + i * 140);
        });
      }
    }

    
    const matchstatsSection = document.getElementById('mp-matchstats-section');
    if (matchstatsSection && !matchstatsSection.hidden) {
      const lbRowCount    = ranking.length;
      const awardCount    = document.querySelectorAll('.res-award-card').length;
      const statsDelay    = 1350 + lbRowCount * 180 + 250 + 150 + awardCount * 140 + 300;
      setTimeout(() => matchstatsSection.classList.add('is-section-visible'), statsDelay);

      const statsEl = document.getElementById('mp-match-stats');
      if (statsEl) {
        statsEl.querySelectorAll('.res-matchstat-card').forEach((card, i) => {
          setTimeout(() => card.classList.add('is-visible'), statsDelay + 120 + i * 90);
        });
      }
    }

    
    if (actionsSection) {
      const lbRowCount   = ranking.length;
      const awardCount   = document.querySelectorAll('.res-award-card').length;
      const statCount    = document.querySelectorAll('.res-matchstat-card').length;
      const buttonsDelay = 1350 + lbRowCount * 180 + 250 + 150 + awardCount * 140 + 300 + 120 + statCount * 90 + 200;
      setTimeout(() => {
        actionsSection.classList.add('is-section-visible');
        
        const multiEl = document.getElementById('results-multi');
        if (multiEl) multiEl.classList.remove('results-multi--cinematic');
      }, buttonsDelay);
    }
  }

  
  function renderMpLeaderboard(ranking, total) {
    renderMultiResults(ranking, total);
  }

  
  let _toastContainer = null;

  function toast(message, type = 'info', duration = 3000) {
    if (!_toastContainer) {
      _toastContainer = createElement('div', { class: 'toast-container', 'aria-live': 'polite' });
      document.body.appendChild(_toastContainer);
    }
    const icons = { info: 'mdi:information', success: 'mdi:check-circle', error: 'mdi:alert-circle' };
    const el = createElement('div', { class: `toast toast--${type}`, role: 'status' });
    el.innerHTML = `<iconify-icon icon="${icons[type]}" noobserver></iconify-icon><span>${message}</span>`;
    _toastContainer.appendChild(el);

    setTimeout(() => {
      el.style.cssText += 'opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  
  function setLoading(el, isLoading) { el.classList.toggle('is-loading', isLoading); }

  function createElement(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function $id(id)                    { return document.getElementById(id); }
  function $(selector)                { return document.querySelector(selector); }
  function $$(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  function hexToRgba(hex, alpha = 1) {
    const clean   = hex.replace('#', '');
    const bigint  = parseInt(clean, 16);
    return `rgba(${(bigint>>16)&255},${(bigint>>8)&255},${bigint&255},${alpha})`;
  }

  
  function _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  
  function _setById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  return {
    showScreen,
    renderCategories,
    updateCategorySelection,
    renderAchievements,
    
    renderQuestion,
    renderAnswerButtons,
    lockAnswerButtons,
    revealAnswer,
    revealSoloAnswer,
    stackAvatarOnAnswer,
    renderMultiReveal,
    renderNumericReveal,
    renderOrderReveal,
    renderMultiplayerStrip,
    updateMultiplayerStrip,
    updateTimerBar,
    updateTopBar,
    setGameContinueState,
    setHostMessage,
    
    endReadingPhase,
    showReadingPhase,
    showPassDevice,
    showFunFactPopup,
    showWinnerPresentation,
    renderMpLeaderboard,
    renderAvatarPicker,
    
    renderSoloResults,
    renderMultiResults,
    revealMpResultsCinematic,
    
    toast,
    setLoading,
    createElement,
    $id, $, $$,
  };
})();
