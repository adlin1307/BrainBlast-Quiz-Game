

const Sounds = (() => {

  
  
  
  const IDS = {
    
    CLICK:       'click',
    CORRECT:     'correct',
    WRONG:       'wrong',
    TICK:        'tick',
    WIN:         'win',
    LOSE:        'lose',
    COUNTDOWN:   'countdown',
    ACHIEVEMENT: 'achievement',
    REVEAL:      'reveal',
    WINNER:      'winner',
    TIMEUP:      'timeup',
    
    MUSIC_LANDING:  'music_landing',
    MUSIC_SETUP:    'music_setup',
    MUSIC_GAMEPLAY: 'music_gameplay',
    MUSIC_RESULTS:  'music_results',
  };

  
  
  
  let _sfxEnabled   = true;
  let _musicEnabled = true;
  let _volume       = 0.7;   

  
  const _registry = {};

  
  
  

  
  function register(id, path, opts = {}) {
    const type = opts.type ?? 'sfx';
    _registry[id] = {
      path,
      type,
      loop:      opts.loop      ?? (type === 'music'),
      exclusive: opts.exclusive ?? true,
      volume:    opts.volume    ?? 1,
      audioEl:   null,
    };
  }

  
  function preload(ids) {
    if (!Array.isArray(ids)) return;
    ids.forEach(id => {
      const entry = _registry[id];
      if (!entry || entry.audioEl) return;
      entry.audioEl = _createAudioEl(entry);
    });
  }

  
  
  

  function _createAudioEl(entry) {
    const el = new Audio(entry.path);
    el.loop    = entry.loop;
    el.volume  = _effectiveVolume(entry);
    el.preload = 'auto';
    return el;
  }

  function _effectiveVolume(entry) {
    return Math.min(1, Math.max(0, _volume * (entry.volume ?? 1)));
  }

  function _syncVolumes() {
    Object.values(_registry).forEach(entry => {
      if (entry.audioEl) {
        
        
        if (!_Fade.isFading(entry)) {
          entry.audioEl.volume = _effectiveVolume(entry);
        }
      }
    });
  }

  
  
  
  
  const _Fade = (() => {
    
    const _active = new Map();

    
    function fade(el, targetVol, durationMs, onDone) {
      
      _cancel(el);

      const startVol  = el.volume;
      const delta     = targetVol - startVol;
      const startTime = performance.now();

      if (Math.abs(delta) < 0.001 || durationMs <= 0) {
        el.volume = targetVol;
        onDone?.();
        return;
      }

      function tick(now) {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        el.volume = Math.min(1, Math.max(0, startVol + delta * progress));
        if (progress < 1) {
          _active.set(el, requestAnimationFrame(tick));
        } else {
          _active.delete(el);
          onDone?.();
        }
      }

      _active.set(el, requestAnimationFrame(tick));
    }

    function _cancel(el) {
      const id = _active.get(el);
      if (id !== undefined) {
        cancelAnimationFrame(id);
        _active.delete(el);
      }
    }

    function cancelAll() {
      _active.forEach((id) => cancelAnimationFrame(id));
      _active.clear();
    }

    function isFading(entry) {
      return entry.audioEl ? _active.has(entry.audioEl) : false;
    }

    return { fade, cancelAll, isFading };
  })();

  
  
  

  function play(id) {
    if (!_sfxEnabled) return;
    const entry = _registry[id];
    if (!entry || !entry.path || entry.type === 'music') return;

    if (!entry.audioEl) entry.audioEl = _createAudioEl(entry);

    const el = entry.audioEl;
    el.volume = _effectiveVolume(entry);

    if (entry.exclusive) el.currentTime = 0;

    el.play().catch(() => {});
  }

  
  
  
  
  const Music = (() => {
    const FADE_OUT  = 400;   
    const FADE_IN   = 500;   
    const FADE_STOP = 350;   

    let _currentId = null;
    let _paused    = false;

    
    function _el(entry) {
      if (!entry.audioEl) entry.audioEl = _createAudioEl(entry);
      return entry.audioEl;
    }

    
    function fadeTo(toId, fadeMs) {
      const outDuration = fadeMs ?? FADE_OUT;
      const inDuration  = fadeMs ?? FADE_IN;

      
      if (toId && toId === _currentId) {
        const entry = _registry[toId];
        if (entry?.audioEl && !entry.audioEl.paused) return;
      }

      const prevId   = _currentId;
      _currentId     = toId;
      _paused        = false;

      
      if (prevId && prevId !== toId) {
        const prevEntry = _registry[prevId];
        if (prevEntry?.audioEl) {
          const prevEl = prevEntry.audioEl;
          _Fade.fade(prevEl, 0, outDuration, () => {
            prevEl.pause();
            prevEl.currentTime = 0;
          });
        }
      }

      
      if (!toId) return; 

      const entry = _registry[toId];
      if (!entry || !entry.path) return; 

      if (!_musicEnabled) return; 

      const el      = _el(entry);
      el.loop       = entry.loop;
      el.volume     = 0;  

      
      
      const startDelay = prevId && prevId !== toId ? Math.floor(outDuration * 0.4) : 0;

      setTimeout(() => {
        if (_currentId !== toId) return; 
        el.play()
          .then(() => {
            _Fade.fade(el, _effectiveVolume(entry), inDuration);
          })
          .catch(() => {
            
          });
      }, startDelay);
    }

    
    function stop(fadeMs) {
      const duration  = fadeMs ?? FADE_STOP;
      const stoppingId = _currentId;
      _currentId = null;
      _paused    = false;

      if (!stoppingId) return;
      const entry = _registry[stoppingId];
      if (!entry?.audioEl) return;

      const el = entry.audioEl;
      _Fade.fade(el, 0, duration, () => {
        el.pause();
        el.currentTime = 0;
      });
    }

    
    function pause() {
      if (_paused) return;
      _paused = true;
      if (!_currentId) return;
      const entry = _registry[_currentId];
      if (entry?.audioEl && !entry.audioEl.paused) {
        
        _Fade.cancelAll();
        entry.audioEl.pause();
      }
    }

    
    function resume() {
      if (!_paused) return;
      _paused = false;
      if (!_currentId || !_musicEnabled) return;
      const entry = _registry[_currentId];
      if (!entry?.audioEl) return;

      entry.audioEl.play()
        .then(() => {
          
          _Fade.fade(entry.audioEl, _effectiveVolume(entry), FADE_IN);
        })
        .catch(() => {});
    }

    
    function onEnabledChanged(enabled) {
      if (!enabled) {
        
        if (_currentId) {
          const entry = _registry[_currentId];
          if (entry?.audioEl) {
            _Fade.fade(entry.audioEl, 0, FADE_STOP, () => {
              entry.audioEl.pause();
            });
          }
        }
      } else {
        
        if (_currentId) {
          const entry = _registry[_currentId];
          if (entry?.audioEl) {
            entry.audioEl.volume = 0;
            entry.audioEl.play()
              .then(() => _Fade.fade(entry.audioEl, _effectiveVolume(entry), FADE_IN))
              .catch(() => {});
          } else if (entry && entry.path) {
            
            const el = _el(entry);
            el.volume = 0;
            el.play()
              .then(() => _Fade.fade(el, _effectiveVolume(entry), FADE_IN))
              .catch(() => {});
          }
        }
      }
    }

    

    
    function toLanding()  { fadeTo(IDS.MUSIC_LANDING);  }

    
    function toSetup()    { fadeTo(IDS.MUSIC_SETUP);    }

    
    function toGameplay() { fadeTo(IDS.MUSIC_GAMEPLAY); }

    
    function toResults()  { fadeTo(IDS.MUSIC_RESULTS);  }

    return { fadeTo, stop, pause, resume, toLanding, toSetup, toGameplay, toResults, onEnabledChanged };
  })();

  
  
  

  function setSfxEnabled(val) {
    _sfxEnabled = Boolean(val);
    Countdown.onSfxEnabledChanged(_sfxEnabled);
  }

  function setMusicEnabled(val) {
    _musicEnabled = Boolean(val);
    Music.onEnabledChanged(_musicEnabled);
  }

  
  function setEnabled(val) {
    setSfxEnabled(val);
  }

  function setVolume(val) {
    _volume = Math.min(1, Math.max(0, Number(val)));
    _syncVolumes();
    
    
  }

  
  
  
  
  const Countdown = (() => {
    
    let _el    = null;
    
    let _going = false;

    
    function _getEl() {
      if (_el) return _el;
      const entry = _registry[IDS.COUNTDOWN];
      if (!entry || !entry.path) return null;
      
      
      _el        = new Audio(entry.path);
      _el.loop   = true;
      _el.volume = _effectiveVolume(entry);
      _el.preload = 'auto';
      return _el;
    }

    
    function start() {
      const el = _getEl();
      if (!el) return;
      _going         = true;
      el.loop        = true;
      el.currentTime = 0;
      el.volume      = _effectiveVolume(_registry[IDS.COUNTDOWN]);
      if (!_sfxEnabled) return; 
      el.play().catch(() => {});
    }

    
    function stop() {
      _going = false;
      const el = _getEl();
      if (!el) return;
      el.pause();
      el.currentTime = 0;
    }

    
    function pause() {
      const el = _getEl();
      if (!el || el.paused) return;
      el.pause();
    }

    
    function resume() {
      if (!_going) return;          
      const el = _getEl();
      if (!el) return;
      if (!_sfxEnabled) return;     
      el.volume = _effectiveVolume(_registry[IDS.COUNTDOWN]);
      el.play().catch(() => {});
    }

    
    function onSfxEnabledChanged(enabled) {
      const el = _getEl();
      if (!el) return;
      if (!enabled) {
        if (!el.paused) el.pause();
      } else {
        if (_going && el.paused) {
          el.volume = _effectiveVolume(_registry[IDS.COUNTDOWN]);
          el.play().catch(() => {});
        }
      }
    }

    return { start, stop, pause, resume, onSfxEnabledChanged };
  })();

  
  
  

  function click()       { play(IDS.CLICK);       }
  function correct()     { play(IDS.CORRECT);     }
  function wrong()       { play(IDS.WRONG);        }
  function tick()        { play(IDS.TICK);         }
  function win()         { play(IDS.WIN);          }
  function lose()        { play(IDS.LOSE);         }
  function achievement() { play(IDS.ACHIEVEMENT); }
  function reveal()      { play(IDS.REVEAL);       }
  function winner()      { play(IDS.WINNER);       }
  function timeup()      { play(IDS.TIMEUP);       }

  
  
  
  
  
  
  
  register(IDS.MUSIC_LANDING,  'assets/audio/music/landing.mp3',  { type: 'music', volume: 0.55 });
  register(IDS.MUSIC_SETUP,    'assets/audio/music/setup.mp3',    { type: 'music', volume: 0.50 });
  register(IDS.MUSIC_GAMEPLAY, 'assets/audio/music/gameplay.mp3', { type: 'music', volume: 0.40 });
  register(IDS.MUSIC_RESULTS,  'assets/audio/music/results.mp3',  { type: 'music', volume: 0.45 });

  
  
  register(IDS.CLICK,       'assets/audio/sfx/button.mp3',    { volume: 0.7 });
  register(IDS.CORRECT,     'assets/audio/sfx/correct.mp3',   { volume: 0.9 });
  register(IDS.WRONG,       'assets/audio/sfx/wrong.mp3',     { volume: 0.9 });
  register(IDS.COUNTDOWN,   'assets/audio/sfx/countdown.mp3', { volume: 0.8 });
  register(IDS.TIMEUP,      'assets/audio/sfx/timeup.mp3',    { volume: 0.9 });
  register(IDS.REVEAL,      'assets/audio/sfx/reveal.mp3',    { volume: 0.85 });
  register(IDS.WINNER,      'assets/audio/sfx/winner.mp3',    { volume: 1.0, exclusive: true });
  
  

  
  
  
  return {
    
    register,
    preload,

    
    setSfxEnabled,
    setMusicEnabled,
    setEnabled,     
    setVolume,

    
    play,

    
    Music,

    
    click, correct, wrong, tick, win, lose, achievement,
    reveal, winner, timeup,

    
    Countdown,

    
    IDS,
  };
})();
