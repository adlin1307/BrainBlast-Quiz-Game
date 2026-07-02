

const Themes = (() => {
  
  let _categories = [];

  
  function init(categories) {
    _categories = categories;
  }

  
  function apply(el, categoryId) {
    const cat = _categories.find(c => c.id === categoryId);
    if (!cat) return;

    el.dataset.theme = cat.id;
    el.style.setProperty('--theme-color', cat.color);
    el.style.setProperty('--theme-glow',  hexToRgba(cat.color, 0.35));
  }

  
  function clear(el) {
    delete el.dataset.theme;
    el.style.removeProperty('--theme-color');
    el.style.removeProperty('--theme-glow');
  }

  
  function applyToBody(categoryId) {
    if (!categoryId) {
      document.body.removeAttribute('data-theme');
      return;
    }
    const cat = _categories.find(c => c.id === categoryId);
    if (cat) document.body.dataset.theme = cat.id;
  }

  
  function hexToRgba(hex, alpha = 1) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >>  8) & 255;
    const b =  bigint        & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  
  function get(id) {
    return _categories.find(c => c.id === id);
  }

  
  function getAll() {
    return [..._categories];
  }

  return { init, apply, clear, applyToBody, get, getAll };
})();
