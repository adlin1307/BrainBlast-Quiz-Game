

const Popup = (() => {

  
  const _stack = [];

  

  
  function open(overlayEl, trigger) {
    if (!overlayEl) return;
    
    if (_top() === overlayEl) return;

    _closeAll();

    _push(overlayEl, trigger || document.activeElement);
  }

  
  function push(overlayEl, trigger) {
    if (!overlayEl) return;
    if (_top() === overlayEl) return;
    _push(overlayEl, trigger || document.activeElement);
  }

  
  function close(overlayEl) {
    if (!overlayEl) {
      
      const entry = _stack[_stack.length - 1];
      if (entry) _pop(entry.overlayEl);
    } else {
      _pop(overlayEl);
    }
  }

  
  function closeAll() {
    _closeAll();
  }

  

  function _top() {
    return _stack.length ? _stack[_stack.length - 1].overlayEl : null;
  }

  function _push(overlayEl, triggerEl) {
    
    const prevTop = _top();
    if (prevTop) {
      prevTop.removeEventListener('pointerdown', _onBackdropClick);
    }

    _stack.push({ overlayEl, triggerEl });
    overlayEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    
    overlayEl.addEventListener('pointerdown', _onBackdropClick);

    
    
    requestAnimationFrame(() => {
      const firstFocusable = _getFocusable(overlayEl)[0];
      if (firstFocusable) firstFocusable.focus({ preventScroll: true });
    });
  }

  function _pop(overlayEl) {
    const idx = _stack.findIndex(e => e.overlayEl === overlayEl);
    if (idx === -1) return;

    
    const removed = _stack.splice(idx);

    removed.forEach(({ overlayEl: el }) => {
      el.classList.remove('is-open');
      el.removeEventListener('pointerdown', _onBackdropClick);
    });

    
    if (_stack.length === 0) {
      document.body.style.overflow = '';
    }

    
    const { triggerEl } = removed[0];
    if (triggerEl && typeof triggerEl.focus === 'function') {
      triggerEl.focus({ preventScroll: true });
    }

    
    const newTop = _top();
    if (newTop) {
      newTop.addEventListener('pointerdown', _onBackdropClick);
      
      requestAnimationFrame(() => {
        const firstFocusable = _getFocusable(newTop)[0];
        if (firstFocusable) firstFocusable.focus({ preventScroll: true });
      });
    }
  }

  function _closeAll() {
    while (_stack.length) {
      const { overlayEl } = _stack.pop();
      overlayEl.classList.remove('is-open');
      overlayEl.removeEventListener('pointerdown', _onBackdropClick);
    }
    document.body.style.overflow = '';
  }

  function _onBackdropClick(e) {
    
    if (e.target !== e.currentTarget) return;
    
    if (e.currentTarget === _top()) close(e.currentTarget);
  }

  

  function _onKeyDown(e) {
    const topOverlay = _top();
    if (!topOverlay) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close(topOverlay);
      return;
    }

    if (e.key === 'Tab') {
      const focusable = _getFocusable(topOverlay);
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  

  function _getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.closest('[hidden]'));
  }

  
  function bindCloseBtn(btn, overlayEl) {
    if (!btn || !overlayEl) return;
    
    const fresh = btn.cloneNode(true);
    btn.replaceWith(fresh);
    fresh.addEventListener('click', () => close(overlayEl));
  }

  
  function init() {
    document.addEventListener('keydown', _onKeyDown);
  }

  
  function stackDepth() { return _stack.length; }

  return { init, open, push, close, closeAll, bindCloseBtn, stackDepth };
})();
