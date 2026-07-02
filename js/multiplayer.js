

const Multiplayer = (() => {
  
  let _players      = [];
  let _activeIdx    = 0;
  
  let _roundAnswers = {};

  
  let _questionHistory = [];
  let _questionIndex   = 0;

  
  function init(defs) {
    _players = defs.map((p, i) => ({
      id:            i,
      name:          p.name   || `Player ${i + 1}`,
      avatar:        p.avatar || 'mdi:ghost',
      color:         p.color  || '#6C63FF',
      score:         0,
      responseTimes: [],
      correctCount:  0,
    }));
    _activeIdx       = 0;
    _roundAnswers    = {};
    _questionHistory = [];
    _questionIndex   = 0;
  }

  
  function getPlayers()      { return [..._players]; }
  function getActivePlayer() { return _players[_activeIdx] ?? null; }
  function getActiveIndex()  { return _activeIdx; }

  function nextPlayer() {
    _activeIdx = (_activeIdx + 1) % _players.length;
    return getActivePlayer();
  }

  function isFirstPlayer() { return _activeIdx === 0; }

  
  function beginQuestion() {
    
    const scoresBefore = {};
    _players.forEach(p => { scoresBefore[p.id] = p.score; });
    _roundAnswers = {};
    _roundAnswers._scoresBefore = scoresBefore;
    _activeIdx    = 0;
  }

  function recordAnswer(playerId, answer, timeUsed) {
    _roundAnswers[playerId] = { answer, timeUsed };
  }

  function allAnswered() {
    return _players.every(p => _roundAnswers[p.id] !== undefined);
  }

  
  function getRevealData(correctAnswer) {
    return _players.map(p => {
      const rec = _roundAnswers[p.id];
      return {
        player:    p,
        answer:    rec ? rec.answer   : null,
        timeUsed:  rec ? rec.timeUsed : 0,
        isCorrect: rec ? String(rec.answer) === String(correctAnswer) : false,
      };
    });
  }

  
  function getOrderRevealData(correctArray) {
    return _players.map(p => {
      const rec = _roundAnswers[p.id];
      const chosen = rec ? rec.answer : null;
      const isCorrect = Array.isArray(chosen) && Array.isArray(correctArray) &&
        chosen.length === correctArray.length &&
        chosen.every((v, i) => v === correctArray[i]);
      return { player: p, answer: chosen, timeUsed: rec?.timeUsed ?? 0, isCorrect };
    });
  }

  
  function getNumericRevealData(correctNum) {
    const items = _players.map(p => {
      const rec   = _roundAnswers[p.id];
      const val   = rec ? Number(rec.answer) : null;
      const diff  = val !== null && !isNaN(val) ? Math.abs(val - correctNum) : Infinity;
      return { player: p, answer: val, timeUsed: rec?.timeUsed ?? 0, diff };
    });
    return items.sort((a, b) => a.diff - b.diff);
  }

  
  function applyScores(correctAnswer, difficulty) {
    const pts = Scoring.calculatePoints(difficulty);
    let correctThisRound = 0;
    _players.forEach(p => {
      const rec = _roundAnswers[p.id];
      if (!rec) return;
      p.responseTimes.push(rec.timeUsed);
      if (String(rec.answer) === String(correctAnswer)) {
        p.correctCount++;
        p.score += pts;
        correctThisRound++;
      }
    });
    _logQuestionHistory(correctThisRound);
  }

  
  function applyOrderScores(correctArray, difficulty) {
    const pts = Scoring.calculatePoints(difficulty);
    let correctThisRound = 0;
    _players.forEach(p => {
      const rec = _roundAnswers[p.id];
      if (!rec) return;
      p.responseTimes.push(rec.timeUsed);
      const chosen = rec.answer;
      const isCorrect = Array.isArray(chosen) && Array.isArray(correctArray) &&
        chosen.length === correctArray.length &&
        chosen.every((v, i) => v === correctArray[i]);
      if (isCorrect) { p.correctCount++; p.score += pts; correctThisRound++; }
    });
    _logQuestionHistory(correctThisRound);
  }

  
  function applyNumericScores(correctNum, difficulty) {
    const ranked = getNumericRevealData(correctNum);
    let correctThisRound = 0;
    ranked.forEach((item, rank) => {
      const p   = _players.find(pl => pl.id === item.player.id);
      const rec = _roundAnswers[p?.id];
      if (!p || !rec) return;
      p.responseTimes.push(rec.timeUsed);
      const pts = Scoring.calculateRankedPoints(rank, _players.length, difficulty);
      if (pts > 0) { p.score += pts; p.correctCount++; correctThisRound++; }
    });
    _logQuestionHistory(correctThisRound);
  }

  
  function _logQuestionHistory(correctThisRound) {
    
    const scoresAfter = {};
    _players.forEach(p => { scoresAfter[p.id] = p.score; });

    
    const scores = _players.map(p => p.score).sort((a, b) => b - a);
    let minGap = Infinity;
    for (let i = 1; i < scores.length; i++) {
      const gap = scores[i - 1] - scores[i];
      if (gap < minGap) minGap = gap;
    }

    _questionHistory.push({
      questionIndex:    _questionIndex,
      correctCount:     correctThisRound,
      scoresAfter,
      scoresBefore:     _roundAnswers._scoresBefore ?? {},
      minScoreGap:      scores.length > 1 ? minGap : null,
    });
    _questionIndex++;
  }

  function getRanking() {
    return [..._players].sort((a, b) => b.score - a.score);
  }

  function buildSummaries(ranks, roasts) {
    return _players.map(p => Scoring.buildSummary({
      correct:       p.correctCount,
      total:         p.responseTimes.length,
      totalScore:    p.score,
      responseTimes: p.responseTimes,
    }, ranks, roasts));
  }

  function reset() {
    _players         = [];
    _activeIdx       = 0;
    _roundAnswers    = {};
    _questionHistory = [];
    _questionIndex   = 0;
  }

  
  function getQuestionHistory() { return [..._questionHistory]; }

  return {
    init, reset,
    getPlayers, getActivePlayer, getActiveIndex, nextPlayer, isFirstPlayer,
    beginQuestion, recordAnswer, allAnswered,
    getRevealData, getOrderRevealData, getNumericRevealData,
    applyScores, applyOrderScores, applyNumericScores,
    getRanking, buildSummaries, getQuestionHistory,
  };
})();
