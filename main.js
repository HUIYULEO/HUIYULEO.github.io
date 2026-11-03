(function () {
  var KEY = 'leo-site-lang';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nodes = document.querySelectorAll('[data-en][data-zh]');
  var buttons = document.querySelectorAll('[data-set-lang]');
  var titles = { en: 'Huiyu Lu · Leo', zh: '卢绘宇 · Leo' };
  var CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;

  // Split text into animatable pieces. chars: word spans holding letter spans; words: words (CJK: per char).
  function split(el) {
    var mode = el.getAttribute('data-split');
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    var frag = document.createDocumentFragment();
    var i = 0;
    text.split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
      if (mode === 'chars') {
        var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        Array.from(tok).forEach(function (c) {
          var s = document.createElement('span'); s.className = 'ch'; s.textContent = c;
          s.style.setProperty('--i', i++); w.appendChild(s);
        });
        frag.appendChild(w);
      } else {
        // words; CJK runs are broken into single characters so they can wrap and stagger
        var parts = CJK.test(tok) ? tok.match(/[A-Za-z0-9]+|./gu) : [tok];
        parts.forEach(function (p) {
          var s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
          s.textContent = p; s.style.setProperty('--i', i++); frag.appendChild(s);
        });
      }
    });
    el.textContent = '';
    el.appendChild(frag);
  }

  function apply(lang) {
    if (lang !== 'zh') lang = 'en';
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    nodes.forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang);
      if (el.hasAttribute('data-split')) split(el);
    });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)); });
    document.title = titles[lang];
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved || 'en');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, b.dataset.setLang); } catch (e) {}
      apply(b.dataset.setLang);
    });
  });

  var ph = document.querySelector('[data-placeholder="email"]');
  if (ph) ph.addEventListener('click', function (e) { e.preventDefault(); });

  var sections = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var cards = document.querySelectorAll('.card');
  var hero = document.querySelector('.hero');

  if (reduce || !('IntersectionObserver' in window)) {
    sections.forEach(function (el) { el.classList.add('in'); });
    cards.forEach(function (el) { el.classList.add('inview'); });
    return;
  }

  // Reveal sections once
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  sections.forEach(function (el) { io.observe(el); });

  // Run card / hero loops only while visible
  var vis = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.target === hero) hero.classList.toggle('offscreen', !en.isIntersecting);
      else en.target.classList.toggle('inview', en.isIntersecting);
    });
  });
  cards.forEach(function (c) { vis.observe(c); });
  if (hero) vis.observe(hero);

  // Scroll-linked: hero decomposes, section rules' shapes slide
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight;
      if (hero) {
        var p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.9)));
        hero.style.setProperty('--p', p.toFixed(3));
      }
      sections.forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var sp = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.4)));
        s.style.setProperty('--sp', sp.toFixed(3));
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Cursor: shapes lean gently toward the pointer (fine pointers only)
  if (hero && window.matchMedia('(pointer: fine)').matches) {
    var mt = false, mx = 0, my = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (mt) return; mt = true;
      requestAnimationFrame(function () {
        mt = false;
        hero.style.setProperty('--mx', mx.toFixed(3));
        hero.style.setProperty('--my', my.toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0);
    });
  }
})();
