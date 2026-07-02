

const Scoring = (() => {
  
  const BASE_POINTS = 100;

  
  const DIFFICULTY_MULTIPLIER = {
    explorer:    1.0,
    challenger:  1.5,
    mastermind:  2.0,
  };

  
  function calculatePoints(difficulty) {
    const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;
    return Math.round(BASE_POINTS * multiplier);
  }

  
  function calculateRankedPoints(rank, total, difficulty) {
    const base = calculatePoints(difficulty);
    if (rank === 0) return base;
    if (rank === 1) return Math.round(base * 0.6);
    if (rank === 2) return Math.round(base * 0.3);
    return 0;
  }

  
  function accuracy(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  
  function getRank(accuracyPct, ranks) {
    return ranks.find(r => accuracyPct >= r.min) ?? ranks[ranks.length - 1];
  }

  
  function getRoastTier(accuracyPct) {
    if (accuracyPct === 100) return 'perfect';
    if (accuracyPct >= 70)   return 'great';
    if (accuracyPct >= 40)   return 'average';
    return 'poor';
  }

  
  function pickRoast(roasts, tier) {
    const pool = roasts[tier] ?? roasts.average;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  
  function buildSummary(raw, ranks, roasts) {
    const acc           = accuracy(raw.correct, raw.total);
    const rank          = getRank(acc, ranks);
    const roastTier     = getRoastTier(acc);
    const roast         = pickRoast(roasts, roastTier);
    const times         = raw.responseTimes ?? [];
    const avgSpeed      = calcAvgSpeed(times);
    const answered      = times.filter(t => t > 0);
    const fastestAnswer = answered.length
      ? Math.round(Math.min(...answered) * 10) / 10
      : 0;

    return {
      score:    raw.totalScore,
      correct:  raw.correct,
      total:    raw.total,
      accuracy: acc,
      avgSpeed,
      fastestAnswer,
      rank,
      roast,
    };
  }

  
  function calcAvgSpeed(times) {
    if (!times.length) return 0;
    const sum = times.reduce((a, b) => a + b, 0);
    return Math.round((sum / times.length) * 10) / 10;
  }

  return {
    calculatePoints,
    calculateRankedPoints,
    accuracy,
    getRank,
    getRoastTier,
    pickRoast,
    buildSummary,
    calcAvgSpeed,
    BASE_POINTS,
    DIFFICULTY_MULTIPLIER,
  };
})();
