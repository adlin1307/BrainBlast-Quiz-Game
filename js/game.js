const Game = (() => {

  
  const _setup = {
    mode:       null,   
    categories: new Set(),
    difficulty: null,   
    length:     null,   
  };

  const LENGTHS = { quick: 5, classic: 10, ultimate: 15 };
  const READING_PHASE_SECONDS = 5;

  
  

  function setMode(mode)        { _setup.mode = mode; }
  function setDifficulty(level) { _setup.difficulty = level; }
  function setLength(key)       {
    const val = key ? (LENGTHS[key] ?? null) : null;
    _setup.length = val;
  }

  function toggleCategory(id) {
    _setup.categories.has(id)
      ? _setup.categories.delete(id)
      : _setup.categories.add(id);
  }

  function getSetup() {
    return {
      mode:       _setup.mode,
      categories: [..._setup.categories],
      difficulty: _setup.difficulty,
      length:     _setup.length,
    };
  }

  function validateSetup() {
    if (!_setup.mode)
      return { valid: false, reason: 'Please choose a game mode (Solo or Multiplayer).' };
    if (_setup.categories.size === 0)
      return { valid: false, reason: 'Please select at least one category.' };
    if (!_setup.difficulty)
      return { valid: false, reason: 'Please choose a difficulty level.' };
    if (!_setup.length)
      return { valid: false, reason: 'Please choose how many questions you want.' };
    return { valid: true };
  }

  
  const _state = {
    questions:         [],
    currentIndex:      0,
    score:             0,
    correctCount:      0,
    responseTimes:     [],
    timeLimit:         30,
    isRunning:         false,
    answered:          false,
    questionStartedAt: 0,
    timerStarted:      false,
  };

  
  
  
  
  
  const _pending = new Set();

  function _schedule(fn, ms) {
    const id = setTimeout(() => {
      _pending.delete(id);
      fn();
    }, ms);
    _pending.add(id);
    return id;
  }

  function _cancelPendingCallbacks() {
    _pending.forEach(id => clearTimeout(id));
    _pending.clear();
  }

  const _hooks = {
    onReadingPhase:   null,
    onQuestionReady:  null,
    onAnswerRevealed: null,
    onTimerExpired:   null,
    onPassDevice:     null,
    onMultiReveal:    null,
    onFunFact:        null,
    onRoundComplete:  null,
  };

  function setHooks(hooks) { Object.assign(_hooks, hooks); }

  
  function generate() {
    const setup = getSetup();
    
    const difficulty = setup.difficulty ?? 'explorer';
    const count      = setup.length     ?? 10;

    _state.questions   = Questions.select({
      categories: setup.categories,
      difficulty,
      count,
    }).map(q => Questions.shuffleOptions(q));

    _state.currentIndex  = 0;
    _state.score         = 0;
    _state.correctCount  = 0;
    _state.responseTimes = [];
    _state.timeLimit     = Questions.getTimeLimit(difficulty);
    _state.isRunning     = false;
    _state.answered      = false;
  }

  
  function startQuestion() {
    if (_state.currentIndex >= _state.questions.length) {
      _finishRound();
      return;
    }

    const q = _state.questions[_state.currentIndex];
    _state.answered     = false;
    _state.timerStarted = false; 

    if (_setup.mode === 'multiplayer') {
      Multiplayer.beginQuestion();
      
      
      
      if (_hooks.onReadingPhase) {
        _hooks.onReadingPhase(
          q,
          _state.currentIndex + 1,
          _state.questions.length,
          () => _passDeviceThenBeginTurn(true), 
        );
      } else {
        _passDeviceThenBeginTurn(true);
      }
    } else {
      
      _beginPlayerTurn();
    }
  }

  function _beginPlayerTurn() {
    const q = _state.questions[_state.currentIndex];
    _state.answered  = false;
    _state.isRunning = true;
    
    
    
    if (!_state.timerStarted) {
      _state.questionStartedAt = Date.now();
    }

    const activePlayer = _setup.mode === 'multiplayer'
      ? Multiplayer.getActivePlayer()
      : null;

    if (_hooks.onQuestionReady) {
      _hooks.onQuestionReady(
        q,
        _state.currentIndex + 1,
        _state.questions.length,
        _state.timeLimit,
        activePlayer ? activePlayer.name : null,
      );
    }

    
    
    
    
    
    if (!_state.timerStarted) {
      _state.timerStarted = true;
      _startQuestionTimer();
    } else {
      
      
      
      Timer.resume();
      Sounds.Countdown.resume();
    }
  }

  
  function _startQuestionTimer() {
    
    Sounds.Countdown.start();
    Timer.start(
      _state.timeLimit,
      (remaining, total) => {
        UI.updateTimerBar(remaining, total);
      },
      () => { if (!_state.answered) _onTimerExpired(); },
    );
  }

  
  function _passDeviceThenBeginTurn(startTimer = false) {
    const player = Multiplayer.getActivePlayer();
    const name   = player ? player.name : 'Player';

    if (startTimer && !_state.timerStarted) {
      
      
      
      _state.isRunning         = true;
      _state.questionStartedAt = Date.now();
      _state.timerStarted      = true;
      _startQuestionTimer();
    }

    if (_hooks.onPassDevice) {
      _hooks.onPassDevice(name, () => _beginPlayerTurn());
    } else {
      _beginPlayerTurn();
    }
  }

  function submitAnswer(chosenAnswer) {
    if (_state.answered || !_state.isRunning) return;

    Timer.pause();
    _state.answered  = true;
    _state.isRunning = false;

    
    Sounds.Countdown.stop();

    const q        = _state.questions[_state.currentIndex];
    const timeUsed = Math.min(
      _state.timeLimit,
      (Date.now() - _state.questionStartedAt) / 1000,
    );

    const handler   = Questions.getTypeHandler(q.type);
    const isCorrect = handler.validate(chosenAnswer, q);
    const pts       = isCorrect ? Scoring.calculatePoints(_setup.difficulty) : 0;

    if (_setup.mode === 'solo') {
      _state.responseTimes.push(timeUsed);
      if (isCorrect) { _state.score += pts; _state.correctCount++; }
      
      
      
      
      _schedule(() => {
        if (_hooks.onAnswerRevealed) {
          _hooks.onAnswerRevealed(chosenAnswer, q.answer, pts, isCorrect, q);
        }
        
        _schedule(() => _showFunFact(q, () => _advanceSoloQuestion()), 3000);
      }, 400);
    } else {
      
      
      const player = Multiplayer.getActivePlayer();
      if (player) Multiplayer.recordAnswer(player.id, chosenAnswer, timeUsed);
      
      _schedule(() => _afterMultiAnswer(), 600);
    }
  }

  function _afterMultiAnswer() {
    if (Multiplayer.allAnswered()) {
      _triggerMultiReveal();
    } else {
      
      
      Multiplayer.nextPlayer();
      _state.timerStarted = false;
      _passDeviceThenBeginTurn();
    }
  }

  function _onTimerExpired() {
    _state.answered  = true;
    _state.isRunning = false;

    
    Sounds.Countdown.stop();

    const q = _state.questions[_state.currentIndex];

    if (_setup.mode === 'multiplayer') {
      const player = Multiplayer.getActivePlayer();
      if (player) Multiplayer.recordAnswer(player.id, null, _state.timeLimit);
    } else {
      _state.responseTimes.push(_state.timeLimit);
    }

    if (_hooks.onTimerExpired) _hooks.onTimerExpired();

    
    
    _schedule(() => {
      if (_setup.mode === 'solo') {
        
        if (_hooks.onAnswerRevealed) {
          _hooks.onAnswerRevealed(null, q.answer, 0, false, q);
        }
        
        _schedule(() => _showFunFact(q, () => _advanceSoloQuestion()), 3000);
      } else {
        
        _schedule(() => _afterMultiAnswer(), 600);
      }
    }, 500);
  }

  function _triggerMultiReveal() {
    
    Sounds.Countdown.stop();
    const q = _state.questions[_state.currentIndex];
    const handler = Questions.getTypeHandler(q.type);
    let revealData;

    if (handler.isNumeric) {
      Multiplayer.applyNumericScores(q.answer, _setup.difficulty);
      revealData = Multiplayer.getNumericRevealData(q.answer);
    } else if (handler.isOrdered) {
      Multiplayer.applyOrderScores(q.answer, _setup.difficulty);
      revealData = Multiplayer.getOrderRevealData(q.answer);
    } else {
      Multiplayer.applyScores(q.answer, _setup.difficulty);
      revealData = Multiplayer.getRevealData(q.answer);
    }

    if (_hooks.onMultiReveal) {
      _hooks.onMultiReveal(revealData, q.answer, q);
    }

    
    _schedule(() => _showFunFact(q, () => _advanceMultiQuestion()), 4000);
  }

  function _advanceSoloQuestion() {
    _state.currentIndex++;
    if (_state.currentIndex >= _state.questions.length) {
      _finishRound();
    } else {
      startQuestion();
    }
  }

  function _advanceMultiQuestion() {
    _state.currentIndex++;
    if (_state.currentIndex >= _state.questions.length) {
      _finishRound();
    } else {
      startQuestion();
    }
  }

  function _showFunFact(q, onNext) {
    if (q && q.funFact && _hooks.onFunFact) {
      
      
      const isFinal = _state.currentIndex >= _state.questions.length - 1;
      _hooks.onFunFact(q.funFact, onNext, isFinal);
    } else {
      onNext();
    }
  }

  
  function _finishRound() {
    Timer.stop();
    _state.isRunning = false;
    if (_hooks.onRoundComplete) _hooks.onRoundComplete(_buildResults());
  }

  function _buildResults() {
    if (_setup.mode === 'multiplayer') {
      return {
        mode:            'multiplayer',
        ranking:         Multiplayer.getRanking(),
        total:           _state.questions.length,
        questionHistory: Multiplayer.getQuestionHistory(),
      };
    }
    return {
      mode:          'solo',
      score:         _state.score,
      correct:       _state.correctCount,
      total:         _state.questions.length,
      responseTimes: [..._state.responseTimes],
      difficulty:    _setup.difficulty,
    };
  }

  
  function getCurrentQuestion() {
    return _state.questions[_state.currentIndex] ?? null;
  }

  function getState() {
    return {
      currentIndex: _state.currentIndex,
      total:        _state.questions.length,
      score:        _state.score,
      correctCount: _state.correctCount,
      isRunning:    _state.isRunning,
      answered:     _state.answered,
    };
  }

  
  function reset() {
    _cancelPendingCallbacks();
    Timer.stop();
    Sounds.Countdown.stop();
    _setup.categories.clear();
    _setup.mode       = null;
    _setup.difficulty = null;
    _setup.length     = null;

    _resetState();
    Multiplayer.reset();
  }

  
  
  function resetState() {
    _cancelPendingCallbacks();
    Timer.stop();
    Sounds.Countdown.stop();
    _resetState();
  }

  function _resetState() {
    _state.questions         = [];
    _state.currentIndex      = 0;
    _state.score             = 0;
    _state.correctCount      = 0;
    _state.responseTimes     = [];
    _state.timeLimit         = 30;
    _state.isRunning         = false;
    _state.answered          = false;
    _state.questionStartedAt = 0;
    _state.timerStarted      = false;
  }

  return {
    setMode, setDifficulty, setLength, toggleCategory,
    getSetup, validateSetup,
    setHooks, generate, startQuestion, submitAnswer,
    getCurrentQuestion, getState,
    reset, resetState,
    LENGTHS,
    READING_PHASE_SECONDS,
  };
})();
