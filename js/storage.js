

const Storage = (() => {
  const KEYS = {
    SETTINGS:      'bb_settings',
    ACHIEVEMENTS:  'bb_achievements',
    BEST_SCORES:   'bb_best_scores',
    STATS:         'bb_stats',
  };

  
  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      
      console.warn('[BrainBlast] localStorage write failed for key:', key);
    }
  }

  
  function remove(key) {
    localStorage.removeItem(key);
  }

  
  const DEFAULT_SETTINGS = {
    soundEnabled:  true,
    musicEnabled:  true,
    volume:        0.7,
    animations:    true,
  };

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...get(KEYS.SETTINGS, {}) };
  }

  function saveSettings(partial) {
    set(KEYS.SETTINGS, { ...getSettings(), ...partial });
  }

  
  function getUnlockedAchievements() {
    return get(KEYS.ACHIEVEMENTS, []);
  }

  function unlockAchievement(id) {
    const current = getUnlockedAchievements();
    if (!current.includes(id)) {
      set(KEYS.ACHIEVEMENTS, [...current, id]);
      return true; 
    }
    return false;
  }

  
  function getBestScores() {
    return get(KEYS.BEST_SCORES, {});
  }

  function saveBestScore(categoryId, score) {
    const scores = getBestScores();
    if ((scores[categoryId] ?? -1) < score) {
      scores[categoryId] = score;
      set(KEYS.BEST_SCORES, scores);
      return true; 
    }
    return false;
  }

  
  const DEFAULT_STATS = {
    gamesPlayed:    0,
    questionsTotal: 0,
    correctTotal:   0,
  };

  function getStats() {
    return { ...DEFAULT_STATS, ...get(KEYS.STATS, {}) };
  }

  function saveStats(partial) {
    set(KEYS.STATS, { ...getStats(), ...partial });
  }

  
  return {
    get, set, remove,
    getSettings, saveSettings,
    getUnlockedAchievements, unlockAchievement,
    getBestScores, saveBestScore,
    getStats, saveStats,
  };
})();
