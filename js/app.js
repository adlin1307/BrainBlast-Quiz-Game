(async () => {

  
  let categories   = [];
  let achievements = [];
  let roasts       = {};
  let results      = {};
  let avatarDefs   = [];

  async function loadData() {
    [categories, achievements, results, roasts, avatarDefs] = await Promise.all([
      fetch('data/categories.json').then(r => r.json()),
      fetch('data/achievements.json').then(r => r.json()),
      fetch('data/results.json').then(r => r.json()),
      fetch('data/roasts.json').then(r => r.json()),
      fetch('data/avatars.json').then(r => r.json()),
    ]);
  }

  const _soloPlayer = { name: 'You', avatar: 'mdi:ghost', color: '#A29BFE' };

  
  const btnPlay             = document.getElementById('btn-play');
  const btnSettings         = document.getElementById('btn-settings');
  const btnHowToPlay        = document.getElementById('btn-how-to-play');
  const btnAchievements     = document.getElementById('btn-achievements');
  const btnBack             = document.getElementById('btn-back');
  const btnBegin            = document.getElementById('btn-begin');
  const categoryGrid        = document.getElementById('category-grid');
  const modeSolo            = document.getElementById('mode-solo');
  const modeMulti           = document.getElementById('mode-multi');
  const levelCards          = document.querySelectorAll('.level-card');
  const lengthCards         = document.querySelectorAll('.length-card');
  const overlaySettings     = document.getElementById('overlay-settings');
  const overlayHowToPlay    = document.getElementById('overlay-howto');
  const overlayAchievements = document.getElementById('overlay-achievements');
  const overlayMpSetup      = document.getElementById('overlay-mp-setup');
  const btnExitGame         = document.getElementById('btn-exit-game');

  async function init() {
    await Promise.all([loadData(), Questions.load()]);

    Themes.init(categories);
    Popup.init();
    applyPersistedSettings();

    UI.renderCategories(categoryGrid, categories, new Set(), handleCategoryToggle);

    const achievementBody = document.getElementById('achievements-body');
    if (achievementBody) {
      UI.renderAchievements(achievementBody, achievements, Storage.getUnlockedAchievements());
    }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      Popup.bindCloseBtn(btn, document.getElementById(btn.dataset.closeModal));
    });

    Game.setHooks({
      onReadingPhase:   handleReadingPhase,
      onQuestionReady:  handleQuestionReady,
      onAnswerRevealed: handleAnswerRevealed,
      onTimerExpired:   handleTimerExpired,
      onPassDevice:     handlePassDevice,
      onMultiReveal:    handleMultiReveal,
      onFunFact:        handleFunFact,
      onRoundComplete:  handleRoundComplete,
    });

    UI.showScreen('screen-landing');
    Sounds.preload([
      
      Sounds.IDS.MUSIC_LANDING,
      Sounds.IDS.MUSIC_SETUP,
      Sounds.IDS.MUSIC_GAMEPLAY,
      Sounds.IDS.MUSIC_RESULTS,
      
      Sounds.IDS.CLICK,
      Sounds.IDS.CORRECT,
      Sounds.IDS.WRONG,
      Sounds.IDS.COUNTDOWN,
      Sounds.IDS.TIMEUP,
      Sounds.IDS.REVEAL,
      Sounds.IDS.WINNER,
    ]);
    Sounds.Music.toLanding();
    spawnParticles();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Sounds.Music.pause();
        Sounds.Countdown.pause();
      } else {

        if (!_isPaused) {
          Sounds.Music.resume();
          Sounds.Countdown.resume();
        }
      }
    });

    _syncSetupUI();
    bindEvents();
  }

  function applyPersistedSettings() {
    const s = Storage.getSettings();

    Sounds.setSfxEnabled(s.soundEnabled);
    Sounds.setMusicEnabled(s.musicEnabled);
    Sounds.setVolume(s.volume);

    const toggleSound = document.getElementById('toggle-sound');
    const toggleMusic = document.getElementById('toggle-music');
    const sliderVol   = document.getElementById('slider-volume');

    if (toggleSound) {
      toggleSound.checked = s.soundEnabled;
      toggleSound.addEventListener('change', () => {
        Sounds.setSfxEnabled(toggleSound.checked);
        Storage.saveSettings({ soundEnabled: toggleSound.checked });
      });
    }

    if (toggleMusic) {
      toggleMusic.checked = s.musicEnabled;
      toggleMusic.addEventListener('change', () => {
        Sounds.setMusicEnabled(toggleMusic.checked);
        Storage.saveSettings({ musicEnabled: toggleMusic.checked });
      });
    }

    if (sliderVol) {
      sliderVol.value = s.volume * 100;
      sliderVol.addEventListener('input', () => {
        const vol = sliderVol.value / 100;
        Sounds.setVolume(vol);
        Storage.saveSettings({ volume: vol });
      });
    }
  }

  function _syncSetupUI() {
    const setup = Game.getSetup();

    modeSolo?.classList.toggle('is-selected',  setup.mode === 'solo');
    modeMulti?.classList.toggle('is-selected', setup.mode === 'multiplayer');
    modeSolo?.setAttribute('aria-pressed',  setup.mode === 'solo'  ? 'true' : 'false');
    modeMulti?.setAttribute('aria-pressed', setup.mode === 'multiplayer' ? 'true' : 'false');

    UI.updateCategorySelection(categoryGrid, new Set(setup.categories));

    levelCards.forEach(c => {
      const match = setup.difficulty !== null && c.dataset.level === setup.difficulty;
      c.classList.toggle('is-selected', match);
      c.setAttribute('aria-pressed', match ? 'true' : 'false');
    });

    const lengthKeyMap = { 5: 'quick', 10: 'classic', 15: 'ultimate' };
    lengthCards.forEach(c => {
      const match = setup.length !== null && c.dataset.length === (lengthKeyMap[setup.length] ?? '');
      c.classList.toggle('is-selected', match);
      c.setAttribute('aria-pressed', match ? 'true' : 'false');
    });

    _updateBeginButton();
  }

  function _updateBeginButton() {
    const btn  = document.getElementById('btn-begin');
    const hint = document.getElementById('setup-hint');
    if (!btn) return;

    const { valid, reason } = Game.validateSetup();
    btn.disabled = !valid;
    btn.setAttribute('aria-disabled', valid ? 'false' : 'true');

    if (hint) {
      hint.textContent = valid
        ? 'All set — ready to launch!'
        : (reason ?? 'Make all selections to begin');
    }
  }

  function handleCategoryToggle(id) {
    Game.toggleCategory(id);
    UI.updateCategorySelection(categoryGrid, new Set(Game.getSetup().categories));
    _updateBeginButton();
  }

  function selectMode(mode) {
    Game.setMode(mode);
    modeSolo?.classList.toggle('is-selected',  mode === 'solo');
    modeMulti?.classList.toggle('is-selected', mode === 'multiplayer');
    modeSolo?.setAttribute('aria-pressed',  mode === 'solo'  ? 'true' : 'false');
    modeMulti?.setAttribute('aria-pressed', mode === 'multiplayer' ? 'true' : 'false');
    if (mode === 'solo') Multiplayer.reset();
    _updateBeginButton();
  }

  function selectLevel(level, card) {
    Game.setDifficulty(level);
    levelCards.forEach(c => {
      c.classList.toggle('is-selected', c === card);
      c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
    });
    _updateBeginButton();
  }

  function selectLength(key, card) {
    Game.setLength(key);
    lengthCards.forEach(c => {
      c.classList.toggle('is-selected', c === card);
      c.setAttribute('aria-pressed', c === card ? 'true' : 'false');
    });
    _updateBeginButton();
  }

  function beginGame() {
    const btn = document.getElementById('btn-begin');
    if (btn?.disabled) return;  

    const { valid, reason } = Game.validateSetup();
    if (!valid) { UI.toast(reason, 'error'); return; }
    Sounds.click();

    if (Game.getSetup().mode === 'multiplayer') {
      _openMultiplayerSetup();
    } else {
      _startSolo();
    }
  }

  function _startSolo() {
    _clearAllOverlays();
    Game.generate();
    UI.showScreen('screen-game');
    _resetGameScreen();
    _gameStartedAt = Date.now();
    Sounds.Music.toGameplay();
    Game.startQuestion();
  }

  function _clearAllOverlays() {

    Popup.closeAll();
    document.querySelectorAll('.overlay.is-open').forEach(o => {
      o.classList.remove('is-open');
    });
    document.body.style.overflow = '';
  }

  
  let _mpPlayerDefs = [];

  function _openMultiplayerSetup() {
    const av0 = avatarDefs[0] ?? { id: 'avatar-1', icon: 'mdi:ghost',  color: '#A29BFE' };
    const av1 = avatarDefs[1] ?? { id: 'avatar-2', icon: 'mdi:sparkles', color: '#FDCB6E' };
    _mpPlayerDefs = [
      { name: '', avatarId: av0.id, avatar: av0.icon, color: av0.color },
      { name: '', avatarId: av1.id, avatar: av1.icon, color: av1.color },
    ];
    _renderMpSetupForm();
    Popup.open(overlayMpSetup, btnBegin);
  }

  function _getUsedAvatarIds(excludeIdx) {
    return new Set(
      _mpPlayerDefs
        .filter((_, i) => i !== excludeIdx)
        .map(p => p.avatarId)
        .filter(Boolean)
    );
  }

  function _renderMpSetupForm() {
    const container = document.getElementById('mp-players-form');
    if (!container) return;
    container.innerHTML = '';

    _mpPlayerDefs.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'mp-player-row';
      row.innerHTML = `
        <div class="mp-player-avatar" id="mp-avatar-display-${i}"
          style="background:${p.color || '#6C63FF'}">
          <iconify-icon icon="${p.avatar || 'mdi:ghost'}" noobserver></iconify-icon>
        </div>
        <div class="mp-player-fields">
          <input class="mp-player-name" type="text" maxlength="16"
            placeholder="Player ${i + 1}" value="${_esc(p.name)}"
            aria-label="Player ${i + 1} name" />
          <button class="btn btn-ghost mp-pick-avatar-btn" type="button"
            data-player="${i}" aria-label="Choose avatar for player ${i + 1}">
            <iconify-icon icon="mdi:emoticon-happy" noobserver></iconify-icon>
            Pick Avatar
          </button>
        </div>
        <button class="mp-remove-btn btn btn-ghost btn-icon" type="button"
          aria-label="Remove player ${i + 1}"
          ${_mpPlayerDefs.length <= 2 ? 'disabled' : ''}>
          <iconify-icon icon="mdi:close" noobserver></iconify-icon>
        </button>`;
      container.appendChild(row);

      row.querySelector('.mp-player-name').addEventListener('input', e => {
        _mpPlayerDefs[i].name = e.target.value.trim();
      });
      row.querySelector('.mp-remove-btn').addEventListener('click', () => {
        if (_mpPlayerDefs.length <= 2) return;
        _mpPlayerDefs.splice(i, 1);
        _renderMpSetupForm();
      });
      row.querySelector('.mp-pick-avatar-btn').addEventListener('click', () => {
        _openAvatarPicker(i);
      });
    });
  }

  function _openAvatarPicker(playerIdx) {
    const overlay    = document.getElementById('overlay-avatar-picker');
    const pickerGrid = document.getElementById('avatar-picker-grid');
    if (!overlay || !pickerGrid) return;

    const takenIds  = _getUsedAvatarIds(playerIdx);
    const currentId = _mpPlayerDefs[playerIdx]?.avatarId;

    UI.renderAvatarPicker(pickerGrid, avatarDefs, currentId, takenIds, (av) => {
      _mpPlayerDefs[playerIdx].avatarId = av.id;
      _mpPlayerDefs[playerIdx].avatar   = av.icon;
      _mpPlayerDefs[playerIdx].color    = av.color;
      Popup.close(overlay);

      const avatarDisplay = document.getElementById(`mp-avatar-display-${playerIdx}`);
      if (avatarDisplay) {
        avatarDisplay.style.background = av.color;
        avatarDisplay.innerHTML = `<iconify-icon icon="${av.icon}" noobserver></iconify-icon>`;
      }

      _renderMpSetupForm();
    });

    const pickBtn = document.querySelector(`[data-player="${playerIdx}"].mp-pick-avatar-btn`)
                 ?? document.activeElement;
    Popup.push(overlay, pickBtn);
  }

  function _addMpPlayer() {
    if (_mpPlayerDefs.length >= 6) { UI.toast('Maximum 6 players', 'info'); return; }
    const used = new Set(_mpPlayerDefs.map(p => p.avatarId));
    const av   = avatarDefs.find(a => !used.has(a.id))
              ?? avatarDefs[_mpPlayerDefs.length % avatarDefs.length];
    _mpPlayerDefs.push({ name: '', avatarId: av.id, avatar: av.icon, color: av.color });
    _renderMpSetupForm();
  }

  function _confirmMpSetup() {
    const defs = _mpPlayerDefs.map((p, i) => ({
      name:   p.name   || `Player ${i + 1}`,
      avatar: p.avatar || 'mdi:ghost',
      color:  p.color  || '#6C63FF',
    }));
    if (defs.length < 2) { UI.toast('Add at least 2 players', 'error'); return; }

    Multiplayer.init(defs);
    _clearAllOverlays();
    Game.generate();
    UI.showScreen('screen-game');
    _resetGameScreen();
    _gameStartedAt = Date.now();
    Sounds.Music.toGameplay();
    UI.renderMultiplayerStrip(Multiplayer.getPlayers(), Multiplayer.getActivePlayer().id);
    Game.startQuestion();
  }

  function _resetGameScreen() {
    _isPaused = false;
    BrainBot.reset();
    UI.setGameContinueState('hidden');
    UI.setHostMessage('Ready?');

    const grid = document.getElementById('answer-grid');
    if (grid) { grid.innerHTML = ''; grid.className = 'answer-grid'; }

    const card = document.getElementById('question-card');
    if (card) card.classList.add('question-card--placeholder');

    const strip = document.getElementById('game-players');
    const gameScreen = document.getElementById('screen-game');
    const isSolo = Game.getSetup().mode !== 'multiplayer';
    if (strip) strip.hidden = isSolo;
    if (gameScreen) {
      gameScreen.classList.toggle('is-solo', isSolo);
      gameScreen.classList.toggle('is-multiplayer', !isSolo);
    }

    const bar = document.getElementById('game-timer-bar');
    if (bar) {
      const fill = bar.querySelector('.game-timer-bar__fill');
      if (fill) { fill.style.width = '100%'; fill.style.transition = 'none'; }
      bar.classList.remove('is-warning', 'is-orange', 'is-danger');
      requestAnimationFrame(() => {
        if (fill) fill.style.transition = '';
      });
    }
  }

  function handleReadingPhase(question, qNum, total, onReadingDone) {
    const catData  = Themes.get(question.category);
    const catLabel = catData ? catData.label : question.category;

    UI.updateTopBar(Game.getState().score, qNum, total);
    UI.renderQuestion(question, catLabel, Game.getSetup().difficulty);

    UI.renderAnswerButtons(question, () => {});
    UI.lockAnswerButtons();

    UI.setHostMessage('Everyone read the question!');
    UI.setGameContinueState('hidden');
    UI.renderMultiplayerStrip(Multiplayer.getPlayers(), -1); 

    
    UI.showReadingPhase(Game.READING_PHASE_SECONDS, onReadingDone);
  }

  
  function handleQuestionReady(question, qNum, total, timeLimit, playerName) {
    
    
    
    UI.endReadingPhase();

    const setup    = Game.getSetup();
    const catData  = Themes.get(question.category);
    const catLabel = catData ? catData.label : question.category;

    UI.updateTopBar(Game.getState().score, qNum, total);
    UI.renderQuestion(question, catLabel, setup.difficulty);
    UI.renderAnswerButtons(question, (answer) => Game.submitAnswer(answer));
    UI.setGameContinueState('hidden');

    const hostMsg = setup.mode === 'multiplayer' && playerName
      ? `${playerName} — your turn!`
      : BrainBot.react('prompt', { qNum });
    UI.setHostMessage(hostMsg);

    if (setup.mode === 'multiplayer') {
      UI.updateMultiplayerStrip(Multiplayer.getPlayers(), Multiplayer.getActivePlayer()?.id ?? 0);
    }
  }

  
  function handleAnswerRevealed(chosenAnswer, correctAnswer, points, isCorrect, question) {
    const setup = Game.getSetup();
    const state = Game.getState();

    
    if (setup.mode !== 'solo') return;

    UI.updateTopBar(state.score, state.currentIndex + 1, state.total);

    
    UI.revealSoloAnswer(question, chosenAnswer, correctAnswer, isCorrect);
    Sounds.reveal();
    Sounds[isCorrect ? 'correct' : 'wrong']();

    
    
    
    if (chosenAnswer !== null) {
      if (isCorrect) {
        UI.setHostMessage(BrainBot.react('correct', { points, multiplayer: false }));
      } else {
        UI.setHostMessage(BrainBot.react('wrong'));
      }
    }
  }

  
  function handleTimerExpired() {
    Sounds.timeup();
    UI.setHostMessage(BrainBot.react('timeout'));
  }

  
  function handlePassDevice(toPlayerName, onTap) {
    UI.showPassDevice(toPlayerName, onTap);
  }

  
  function handleMultiReveal(revealData, correctAnswer, question) {
    UI.renderMultiReveal(revealData, correctAnswer, question);
    UI.updateMultiplayerStrip(Multiplayer.getPlayers(), -1);

    
    
    Sounds.reveal();

    
    const correctCount = revealData.filter(r => r.isCorrect).length;
    const total        = revealData.length;

    UI.setHostMessage(BrainBot.react('multi', { correctCount, total }));
  }

  
  function handleFunFact(text, onNext, isFinal) {
    UI.showFunFactPopup(text, onNext, isFinal);
  }

  
  function handleRoundComplete(gameResults) {
    Timer.stop();

    const stats = Storage.getStats();
    Storage.saveStats({
      gamesPlayed:    stats.gamesPlayed + 1,
      questionsTotal: stats.questionsTotal + (gameResults.total ?? 0),
      correctTotal:   stats.correctTotal  + (gameResults.correct ?? 0),
    });

    const gameDurationMs = _gameStartedAt > 0 ? Date.now() - _gameStartedAt : null;

    if (gameResults.mode === 'solo') {
      const summary = Scoring.buildSummary({
        correct:       gameResults.correct,
        total:         gameResults.total,
        totalScore:    gameResults.score,
        responseTimes: gameResults.responseTimes,
      }, results.ranks, roasts);
      
      summary.responseTimes = gameResults.responseTimes ?? [];

      UI.renderSoloResults(summary, results, _soloPlayer.name, _soloPlayer.avatar);
      UI.showScreen('screen-results');
      
      Sounds.Music.toResults();
    } else {
      _showMpResults(gameResults.ranking, gameResults.total, gameDurationMs, gameResults.questionHistory ?? []);
    }
  }

  function _startWinnerPresentation(gameResults) {
    
    const gameDurationMs = _gameStartedAt > 0 ? Date.now() - _gameStartedAt : null;
    _showMpResults(gameResults.ranking, gameResults.total, gameDurationMs, gameResults.questionHistory ?? []);
  }

  function _showMpLeaderboard(ranking, total) {
    
    _showMpResults(ranking, total, null);
  }

  function _showMpResults(ranking, total, gameDurationMs, questionHistory = []) {
    _clearAllOverlays();

    
    
    
    const calcOverlay = document.getElementById('overlay-calculating');

    
    const _showCalc = () => {
      if (!calcOverlay) return;
      calcOverlay.removeAttribute('aria-hidden');
      calcOverlay.classList.remove('is-fading-out');
      calcOverlay.classList.add('is-open');
    };

    const _hideCalc = (onDone) => {
      if (!calcOverlay) { onDone(); return; }
      calcOverlay.classList.add('is-fading-out');
      calcOverlay.classList.remove('is-open');
      setTimeout(() => {
        calcOverlay.classList.remove('is-fading-out');
        calcOverlay.setAttribute('aria-hidden', 'true');
        onDone();
      }, 420);
    };

    
    setTimeout(() => {
      _showCalc();

      
      setTimeout(() => {
        _hideCalc(() => {
          
          UI.renderMultiResults(ranking, total, gameDurationMs,  true, questionHistory);
          UI.showScreen('screen-results');

          
          
          
          
          
          Sounds.Music.toResults();

          
          
          
          setTimeout(() => {
            
            
            Sounds.winner();
            UI.revealMpResultsCinematic(ranking, total);
          }, 80);
        });
      }, 1200);
    }, 400);
  }

  

  
  const BrainBot = (() => {
    
    const CORRECT = [
      "WHOA! 🔥",
      "You're cooking.",
      "Brain cells detected.",
      "Too easy.",
      "That looked effortless.",
      "You're on fire!",
      "Locked in.",
      "That was quick!",
      "I barely finished asking.",
      "Keep it going!",
      "Say less. Correct.",
      "Certified big brain.",
      "Knew it immediately, didn't you?",
      "Didn't even flinch.",
      "Clean.",
      "No hesitation. Respect.",
      "Easy money.",
      "You make this look simple.",
      "I see you.",
      "That's the one.",
      "Smart move.",
      "Right on the money.",
    ];

    const WRONG = [
      "Oof...",
      "Bold choice.",
      "Not this time.",
      "That one tricks a lot of people.",
      "Close... kinda.",
      "Your confidence was impressive.",
      "Nice guess!",
      "Happens to the best.",
      "We move.",
      "Almost. Almost.",
      "The heart was in the right place.",
      "Brain had other plans.",
      "Solid attempt.",
      "Tough one.",
      "That's on the curriculum now.",
      "Could've gone either way.",
      "At least you picked something.",
      "I've seen worse.",
      "Next one's yours.",
      "Nobody's perfect.",
      "Even Einstein got some wrong. Probably.",
    ];

    const TIMEOUT = [
      "The timer won.",
      "Were we making coffee?",
      "Still thinking?",
      "Time waits for nobody.",
      "I'll come back later.",
      "No answer is also an answer.",
      "Clock said no.",
      "We'll get the next one.",
      "The countdown didn't care.",
      "Frozen? Happens.",
      "Silence isn't always golden.",
      "Time to regroup.",
      "Tick tock.",
      "The timer is merciless.",
      "That one slipped away.",
      "Too deep in thought.",
    ];

    const STREAK = {
      3: ["🔥 Three in a row!", "Hat trick!", "Three straight — let's go!"],
      5: ["⚡ You're unstoppable!", "Five in a row. Scary.", "Is this even fair anymore?"],
      7: ["👑 Somebody came prepared.", "Seven straight. Legendary.", "At this point I'm just narrating."],
    };

    const MULTI_CORRECT_ALL  = [
      "Everyone got it! 🎉",
      "Full house! Impressive.",
      "All correct — this crew is dangerous.",
      "Not a single slip. Love to see it.",
    ];

    const MULTI_CORRECT_NONE = [
      "Nobody got it. Yikes.",
      "That one humbled the whole room.",
      "Zero for zero. Wow.",
      "Silence across the board.",
    ];

    const MULTI_CORRECT_MOST = [
      "Most got it — close one!",
      "Majority rules.",
      "A few slipped, but solid overall.",
    ];

    const MULTI_CORRECT_FEW  = [
      "Only a few got through.",
      "Rough round for most.",
      "That one was brutal.",
      "Knowledge gap detected.",
    ];

    const MULTI_COMPETITION = [
      "It's getting close...",
      "Pressure's on!",
      "That changes the leaderboard!",
      "We've got a new leader!",
      "Anyone's game right now.",
      "Gap is closing!",
    ];

    const SOLO_PROMPTS = [
      "Ready?",
      "Here we go.",
      "Let's see...",
      "Next up.",
      "Can you get this one?",
      "Think carefully.",
      "Interesting question coming...",
      "You've got this.",
    ];

    
    let _streak    = 0;
    let _lastMsg   = '';

    
    const _recent = { correct: [], wrong: [], timeout: [] };
    const RECENT_CAP = 5; 

    
    function _pick(pool, recentKey) {
      const recent = recentKey ? (_recent[recentKey] ?? []) : [];
      const eligible = pool.filter(m => !recent.includes(m) && m !== _lastMsg);
      const source   = eligible.length > 0 ? eligible : pool;
      const msg      = source[Math.floor(Math.random() * source.length)];

      if (recentKey) {
        _recent[recentKey].push(msg);
        if (_recent[recentKey].length > RECENT_CAP) _recent[recentKey].shift();
      }

      _lastMsg = msg;
      return msg;
    }

    function _pickOne(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    
    function reset() {
      _streak  = 0;
      _lastMsg = '';
      _recent.correct  = [];
      _recent.wrong    = [];
      _recent.timeout  = [];
    }

    
    function react(type, ctx = {}) {
      switch (type) {

        case 'correct': {
          _streak++;
          
          const milestone = [7, 5, 3].find(n => _streak === n);
          if (milestone) {
            return _pickOne(STREAK[milestone]);
          }
          
          if (ctx.multiplayer && Math.random() < 0.25) {
            return _pickOne(MULTI_COMPETITION);
          }
          const base = _pick(CORRECT, 'correct');
          
          if (ctx.points && Math.random() < 0.5) {
            return `${base} +${ctx.points} pts`;
          }
          return base;
        }

        case 'wrong': {
          _streak = 0;
          return _pick(WRONG, 'wrong');
        }

        case 'timeout': {
          _streak = 0;
          return _pick(TIMEOUT, 'timeout');
        }

        case 'multi': {
          const { correctCount, total } = ctx;
          
          const useCompetition = Math.random() < 0.2;
          if (useCompetition) return _pickOne(MULTI_COMPETITION);

          if (correctCount === total)      return _pickOne(MULTI_CORRECT_ALL);
          if (correctCount === 0)          return _pickOne(MULTI_CORRECT_NONE);
          if (correctCount > total / 2)    return _pickOne(MULTI_CORRECT_MOST);
          return _pickOne(MULTI_CORRECT_FEW);
        }

        case 'prompt': {
          const { qNum = 1 } = ctx;
          return SOLO_PROMPTS[(qNum - 1) % SOLO_PROMPTS.length];
        }

        default:
          return 'Ready?';
      }
    }

    return { react, reset };
  })();

  
  function spawnParticles() {
    const container = document.querySelector('.landing-bg__particles');
    if (!container) return;
    const COLORS = ['#6C63FF', '#FD79A8', '#00C9A7', '#FDCB6E', '#A29BFE'];
    const SIZES  = [4, 6, 8, 10, 12];
    for (let i = 0; i < 18; i++) {
      const size  = SIZES[Math.floor(Math.random() * SIZES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const dot   = document.createElement('div');
      dot.className = 'particle';
      Object.assign(dot.style, {
        width:        `${size}px`,
        height:       `${size}px`,
        background:   color,
        top:          `${Math.random() * 100}%`,
        left:         `${Math.random() * 100}%`,
        '--dur':      `${6 + Math.random() * 8}s`,
        '--del':      `${Math.random() * 6}s`,
        '--dx':       `${(Math.random() - 0.5) * 80}px`,
        '--dy':       `${-(20 + Math.random() * 60)}px`,
        borderRadius: '50%',
        boxShadow:    `0 0 ${size * 2}px ${color}`,
      });
      container.appendChild(dot);
    }
  }

  function _esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  
  function _fullReset() {
    _isPaused = false;
    Sounds.Countdown.stop();
    Timer.stop();
    Game.reset();
    _clearAllOverlays();
    _syncSetupUI();
  }

  
  let _isPaused      = false;
  let _gameStartedAt = 0;

  const overlayPause        = document.getElementById('overlay-pause');
  const overlayPauseConfirm = document.getElementById('overlay-pause-confirm');

  
  function openPause() {
    if (_isPaused) return;
    _isPaused = true;

    
    Timer.pause();

    
    const grid = document.getElementById('answer-grid');
    if (grid) {
      grid.querySelectorAll('button:not([disabled])').forEach(b => {
        b.dataset.pauseDisabled = 'true';
        b.disabled = true;
      });
      const input = grid.querySelector('input:not([disabled])');
      if (input) { input.dataset.pauseDisabled = 'true'; input.disabled = true; }
    }

    Sounds.click();
    Sounds.Music.pause();
    Sounds.Countdown.pause();
    Popup.open(overlayPause, document.getElementById('btn-pause-game'));
  }

  
  function resumeGame() {
    if (!_isPaused) return;
    _isPaused = false;

    
    
    
    
    if (overlayPause) overlayPause.classList.remove('is-open');
    
    Popup.close(overlayPause);

    
    const grid = document.getElementById('answer-grid');
    if (grid) {
      grid.querySelectorAll('[data-pause-disabled]').forEach(el => {
        el.disabled = false;
        delete el.dataset.pauseDisabled;
      });
    }

    
    const state = Game.getState();
    if (state.isRunning && !state.answered) {
      Timer.resume();
    }

    Sounds.click();
    Sounds.Music.resume();
    Sounds.Countdown.resume();
  }

  
  function openSettingsFromPause() {
    Sounds.click();

    
    if (overlayPause) overlayPause.classList.remove('is-open');

    
    Popup.open(overlaySettings, document.getElementById('btn-pause-settings'));

    
    
    
    
    

    function _restorePause() {
      
      if (overlayPause) overlayPause.classList.add('is-open');
      
      requestAnimationFrame(() => {
        document.getElementById('btn-pause-settings')?.focus({ preventScroll: true });
      });
    }

    
    
    
    
    const observer = new MutationObserver(() => {
      if (!overlaySettings.classList.contains('is-open')) {
        observer.disconnect();
        _restorePause();
      }
    });
    observer.observe(overlaySettings, { attributes: true, attributeFilter: ['class'] });
  }

  
  function confirmLeaveGame() {
    Sounds.click();
    Popup.push(overlayPauseConfirm, document.getElementById('btn-pause-home'));
  }

  
  function leaveGame() {
    _isPaused = false;
    _fullReset();
    Sounds.Music.toLanding();
    UI.showScreen('screen-landing');
  }

  
  function bindEvents() {
    
    btnPlay?.addEventListener('click', () => { Sounds.click(); Sounds.Music.toSetup(); UI.showScreen('screen-setup'); });
    btnBack?.addEventListener('click', () => { Sounds.click(); Sounds.Music.toLanding(); UI.showScreen('screen-landing'); });
    btnBegin?.addEventListener('click', () => beginGame());

    
    modeSolo?.addEventListener('click', () => { Sounds.click(); selectMode('solo'); });
    modeMulti?.addEventListener('click', () => { Sounds.click(); selectMode('multiplayer'); });

    
    levelCards.forEach(c => c.addEventListener('click', () => {
      Sounds.click(); selectLevel(c.dataset.level, c);
    }));
    lengthCards.forEach(c => c.addEventListener('click', () => {
      Sounds.click(); selectLength(c.dataset.length, c);
    }));

    
    btnSettings?.addEventListener('click', () => { Sounds.click(); Popup.open(overlaySettings, btnSettings); });
    
    document.getElementById('btn-setup-settings')?.addEventListener('click', () => {
      Sounds.click(); Popup.open(overlaySettings, document.getElementById('btn-setup-settings'));
    });
    btnHowToPlay?.addEventListener('click', () => { Sounds.click(); Popup.open(overlayHowToPlay, btnHowToPlay); });
    btnAchievements?.addEventListener('click', () => {
      Sounds.click();
      const body = document.getElementById('achievements-body');
      if (body) UI.renderAchievements(body, achievements, Storage.getUnlockedAchievements());
      Popup.open(overlayAchievements, btnAchievements);
    });

    
    document.getElementById('btn-pause-game')?.addEventListener('click', () => openPause());
    btnExitGame?.addEventListener('click', () => {
      Sounds.click();
      _fullReset();
      Sounds.Music.toSetup();
      UI.showScreen('screen-setup');
    });

    
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => resumeGame());
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => openSettingsFromPause());
    document.getElementById('btn-pause-home')?.addEventListener('click', () => confirmLeaveGame());

    
    document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => {
      Sounds.click();
      
      Popup.close(overlayPauseConfirm);
    });
    document.getElementById('btn-confirm-leave')?.addEventListener('click', () => {
      Sounds.click();
      leaveGame();
    });

    
    document.getElementById('btn-solo-play-again')?.addEventListener('click', () => {
      Sounds.click();
      
      
      
      
      Sounds.Countdown.stop();
      Timer.stop();
      Game.resetState();
      _clearAllOverlays();
      _isPaused = false;
      BrainBot.reset();
      _startSolo();
    });
    document.getElementById('btn-solo-change-setup')?.addEventListener('click', () => {
      Sounds.click(); _fullReset(); Sounds.Music.toSetup(); UI.showScreen('screen-setup');
    });
    document.getElementById('btn-solo-home')?.addEventListener('click', () => {
      Sounds.click(); _fullReset(); Sounds.Music.toLanding(); UI.showScreen('screen-landing');
    });

    
    document.getElementById('btn-mp-rematch')?.addEventListener('click', () => {
      Sounds.click();

      
      
      
      
      
      const ranking = Multiplayer.getRanking();
      const defs = ranking.map(p => ({ name: p.name, avatar: p.avatar, color: p.color }));

      
      if (defs.length >= 2) {
        Multiplayer.init(defs);
      }

      
      
      
      Sounds.Countdown.stop();
      Timer.stop();
      Game.resetState();
      _clearAllOverlays();
      _isPaused = false;

      
      Game.generate();

      
      UI.showScreen('screen-game');
      _resetGameScreen();
      _gameStartedAt = Date.now();
      Sounds.Music.toGameplay();
      UI.renderMultiplayerStrip(Multiplayer.getPlayers(), Multiplayer.getActivePlayer().id);
      Game.startQuestion();
    });
    document.getElementById('btn-mp-new-setup')?.addEventListener('click', () => {
      Sounds.click(); _fullReset(); Sounds.Music.toSetup(); UI.showScreen('screen-setup');
    });
    document.getElementById('btn-mp-home')?.addEventListener('click', () => {
      Sounds.click(); _fullReset(); Sounds.Music.toLanding(); UI.showScreen('screen-landing');
    });

    
    document.getElementById('btn-mp-add-player')?.addEventListener('click', () => _addMpPlayer());
    document.getElementById('btn-mp-start')?.addEventListener('click', () => _confirmMpSetup());

    
    document.addEventListener('keydown', (e) => {
      const onGameScreen = document.getElementById('screen-game')?.classList.contains('is-active');
      if (!onGameScreen) return;

      
      if (overlayPauseConfirm?.classList.contains('is-open')) return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (_isPaused) { resumeGame(); } else { openPause(); }
        return;
      }

      
      if (e.key === 'Escape' && overlayPause?.classList.contains('is-open') && Popup.stackDepth() === 1) {
        e.preventDefault();
        e.stopImmediatePropagation();
        resumeGame();
      }
    }, true); 
  }

  await init();

})();
