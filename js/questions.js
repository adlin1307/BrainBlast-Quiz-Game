

const Questions = (() => {

  
  let _pool = [];

  async function load() {
    try {
      const res = await fetch('data/questions.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _pool = await res.json();
    } catch (err) {
      console.warn('[Questions] Failed to load:', err.message);
      _pool = [];
    }
  }

  
  
  
  
  const DIFF_MAP = {
    explorer:   'easy',
    challenger: 'medium',
    mastermind: 'hard',
  };

  
  
  function select({ categories = [], difficulty = 'explorer', count = 10 }) {
    const qDifficulty = DIFF_MAP[difficulty] ?? 'easy';

    
    
    
    const catIds = categories.length > 0 ? [...categories] : _uniqueCategories(qDifficulty);

    
    const pools = new Map();
    for (const cat of catIds) {
      const qs = _pool.filter(q => q.difficulty === qDifficulty && q.category === cat);
      if (qs.length > 0) pools.set(cat, shuffle(qs));
    }

    
    
    
    
    const activeCats  = [...pools.keys()];
    const numCats     = activeCats.length;

    
    const quotas = new Map();

    if (numCats === 0) {
      
      
      return [];
    }

    const baseShare  = Math.floor(count / numCats);
    let   remainder  = count - baseShare * numCats;

    
    const sortedBySize = [...activeCats].sort(
      (a, b) => (pools.get(b)?.length ?? 0) - (pools.get(a)?.length ?? 0)
    );

    for (const cat of sortedBySize) {
      const extra = remainder > 0 ? 1 : 0;
      quotas.set(cat, baseShare + extra);
      remainder -= extra;
    }

    
    
    const selected  = [];
    
    const leftovers = new Map();
    let   shortfall = 0;

    for (const cat of activeCats) {
      const pool  = pools.get(cat);
      const quota = quotas.get(cat) ?? baseShare;
      const take  = Math.min(quota, pool.length);

      selected.push(...pool.slice(0, take));

      
      if (pool.length > take) {
        leftovers.set(cat, pool.slice(take));
      }

      shortfall += quota - take; 
    }

    
    
    
    if (shortfall > 0) {
      
      
      const spillover = _interleave([...leftovers.values()]);
      const take      = Math.min(shortfall, spillover.length);
      selected.push(...spillover.slice(0, take));
      shortfall -= take;
    }

    
    
    
    if (shortfall > 0) {
      const fullPool = _pool.filter(
        q => q.difficulty === qDifficulty &&
             (categories.length === 0 || categories.includes(q.category))
      );
      while (selected.length < count) {
        selected.push(...shuffle(fullPool));
      }
    }

    
    return shuffle(selected).slice(0, count);
  }

  
  function _uniqueCategories(qDifficulty) {
    const seen = new Set();
    for (const q of _pool) {
      if (q.difficulty === qDifficulty) seen.add(q.category);
    }
    return [...seen];
  }

  
  function _interleave(arrays) {
    const result = [];
    const max    = Math.max(0, ...arrays.map(a => a.length));
    for (let i = 0; i < max; i++) {
      for (const arr of arrays) {
        if (i < arr.length) result.push(arr[i]);
      }
    }
    return result;
  }

  
  const TIME_LIMITS = { explorer: 30, challenger: 30, mastermind: 30 };

  function getTimeLimit(difficulty) {
    return TIME_LIMITS[difficulty] ?? 30;
  }

  
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shuffleOptions(q) {
    
    const noShuffle = ['true-false', 'fact-or-myth', 'arrange-order', 'closest-year', 'closest-number', 'guess-image'];
    if (noShuffle.includes(q.type)) return q;
    return { ...q, options: shuffle(q.options) };
  }

  
  const _typeRegistry = {};

  function registerType(name, handler) {
    _typeRegistry[name] = handler;
  }

  function getTypeHandler(name) {
    return _typeRegistry[name] ?? _typeRegistry['multiple-choice'];
  }

  

  registerType('multiple-choice', {
    validate: (chosen, q) => chosen === q.answer,
    keys: ['A', 'B', 'C', 'D'],
    isNumeric:  false,
    isOrdered:  false,
  });

  registerType('true-false', {
    validate: (chosen, q) => chosen === q.answer,
    keys: ['A', 'B'],
    isNumeric:  false,
    isOrdered:  false,
  });

  registerType('fact-or-myth', {
    validate: (chosen, q) => chosen === q.answer,
    keys: ['A', 'B'],
    isNumeric:  false,
    isOrdered:  false,
  });

  registerType('odd-one-out', {
    validate: (chosen, q) => chosen === q.answer,
    keys: ['A', 'B', 'C', 'D'],
    isNumeric:  false,
    isOrdered:  false,
  });

  
  registerType('closest-year', {
    validate: (chosen, q) => Number(chosen) === q.answer,
    keys: [],
    isNumeric:  true,
    isOrdered:  false,
  });

  registerType('closest-number', {
    validate: (chosen, q) => Number(chosen) === q.answer,
    keys: [],
    isNumeric:  true,
    isOrdered:  false,
  });

  
  registerType('arrange-order', {
    validate: (chosen, q) => {
      if (!Array.isArray(chosen) || !Array.isArray(q.answer)) return false;
      return chosen.every((item, i) => item === q.answer[i]);
    },
    keys: [],
    isNumeric:  false,
    isOrdered:  true,
  });

  
  registerType('guess-image', {
    validate: (chosen, q) => chosen === q.answer,
    keys: ['A', 'B', 'C', 'D'],
    isNumeric:  false,
    isOrdered:  false,
  });

  return {
    load, select, shuffle, shuffleOptions,
    getTimeLimit,
    registerType, getTypeHandler,
    getAll: () => [..._pool],
  };
})();
