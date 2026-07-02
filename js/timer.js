

const Timer = (() => {
  let _intervalId = null;
  let _remaining  = 0;
  let _total      = 0;
  let _startedAt  = 0;   
  let _onTick     = null;
  let _onExpire   = null;

  
  function start(seconds, onTick, onExpire) {
    stop();
    _total      = seconds;
    _remaining  = seconds;
    _onTick     = onTick;
    _onExpire   = onExpire;
    _startedAt  = Date.now();

    _tick(); 

    _intervalId = setInterval(() => {
      _remaining--;
      _startedAt = Date.now();
      _tick();
      if (_remaining <= 0) stop();
    }, 1000);
  }

  function _tick() {
    if (typeof _onTick === 'function') _onTick(_remaining, _total);
    if (_remaining <= 0 && typeof _onExpire === 'function') _onExpire();
  }

  
  function pause() {
    clearInterval(_intervalId);
    _intervalId = null;
  }

  
  function resume() {
    if (_intervalId === null && _remaining > 0) {
      _startedAt  = Date.now();
      _intervalId = setInterval(() => {
        _remaining--;
        _startedAt = Date.now();
        _tick();
        if (_remaining <= 0) stop();
      }, 1000);
    }
  }

  
  function stop() {
    clearInterval(_intervalId);
    _intervalId = null;
  }

  function getRemaining() { return _remaining; }
  function getTotal()     { return _total; }

  
  function getElapsed() {
    return _total - _remaining + (Date.now() - _startedAt) / 1000;
  }

  
  function getFillPct(remaining, total) {
    return total > 0 ? (remaining / total) * 100 : 0;
  }

  
  function getStageClass(pct) {
    if (pct > 60)  return '';
    if (pct > 40)  return 'is-warning';
    if (pct > 20)  return 'is-orange';
    return 'is-danger';
  }

  
  function updateDOM(wrapperEl, remaining, total) {
    if (!wrapperEl) return;
    const fill = wrapperEl.querySelector('.game-timer-bar__fill');
    if (!fill) return;

    const pct = getFillPct(remaining, total);
    fill.style.width = `${pct}%`;

    
    wrapperEl.classList.remove('is-warning', 'is-orange', 'is-danger');
    const stage = getStageClass(pct);
    if (stage) wrapperEl.classList.add(stage);
  }

  return {
    start, pause, resume, stop,
    getRemaining, getTotal, getElapsed,
    getFillPct, getStageClass, updateDOM,
  };
})();
