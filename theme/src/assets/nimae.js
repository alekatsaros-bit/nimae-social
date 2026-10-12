(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* search panel */
  $$('[data-search-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = $('#search-panel'); if (!p) return;
      var open = p.hasAttribute('hidden');
      if (open) { p.removeAttribute('hidden'); var i = $('input[type=search]', p); if (i) i.focus(); } else { p.setAttribute('hidden', ''); }
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* tabs (homepage favourites) */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('[role=tab]', root);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) {
          var on = o === t; o.setAttribute('aria-selected', on ? 'true' : 'false');
          var p = document.getElementById(o.getAttribute('aria-controls'));
          if (p) { if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); }
        });
      });
    });
  });


  /* card swatches: switch the photo and link to that colour */
  document.addEventListener('click', function (e) {
    var sw = e.target.closest && e.target.closest('button.swatch');
    if (!sw) return;
    var card = sw.closest('.card'); if (!card) return;
    var media = card.querySelector('.card__media');
    var front = card.querySelector('img[data-front]'), back = card.querySelector('img[data-back]');
    var f = sw.getAttribute('data-front'), b = sw.getAttribute('data-back');
    if (f && front) { front.removeAttribute('srcset'); front.src = f; }
    if (back) {
      if (b) { back.hidden = false; back.src = b; media.classList.add('has-back'); } else { back.hidden = true; media.classList.remove('has-back'); }
    } else if (b && media) {
      var im = document.createElement('img'); im.src = b; im.alt = ''; im.setAttribute('data-back', ''); im.width = 720; im.height = 900;
      media.insertBefore(im, front ? front.nextSibling : media.firstChild); media.classList.add('has-back');
    }
    var href = sw.getAttribute('data-href');
    if (href) card.querySelectorAll('[data-card-link]').forEach(function (a) { a.href = href; });
    card.querySelectorAll('button.swatch').forEach(function (o) { o.setAttribute('aria-pressed', o === sw ? 'true' : 'false'); });
  });


  /* vary colours down each grid: no two neighbours in the same colour, prefer colours where the cream ν shows */
  function hexRgb(h){ h=(h||'').replace('#',''); if(h.length!==6) return null; return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function lum(c){ return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255; }
  function cdist(a,b){ if(!a||!b) return 200; var r=(a[0]+b[0])/2; return Math.sqrt((2+r/256)*Math.pow(a[0]-b[0],2)+4*Math.pow(a[1]-b[1],2)+(2+(255-r)/256)*Math.pow(a[2]-b[2],2)); }
  function diversify(container){
    var cards=[].slice.call(container.querySelectorAll('.card')).filter(function(c){ return !c.hidden; });
    var prev=[], used={};
    cards.forEach(function(card){
      var sws=[].slice.call(card.querySelectorAll('button.swatch[data-front]'));
      if(sws.length<2){ var only=card.querySelector('button.swatch'); prev.unshift(only?hexRgb(only.getAttribute('data-hex')):null); return; }
      var best=null, bestScore=-1e9;
      sws.forEach(function(sw, i){
        var c=hexRgb(sw.getAttribute('data-hex')); if(!c) return;
        var L=lum(c), score=0;
        score += L<0.58 ? 120 : (L<0.68 ? 40 : -150);
        score += Math.min(cdist(c,prev[0]),300)*0.9 + Math.min(cdist(c,prev[1]),300)*0.4 + Math.min(cdist(c,prev[2]),300)*0.2;
        var key=sw.getAttribute('data-hex'); score -= (used[key]||0)*25;
        if(L<0.12) score -= 40;
        score -= i*2;
        if(score>bestScore){ bestScore=score; best=sw; }
      });
      if(best){
        var key=best.getAttribute('data-hex'); used[key]=(used[key]||0)+1;
        var wrap=best.parentNode; if(wrap.firstChild!==best) wrap.insertBefore(best, wrap.firstChild);
        best.click();
        prev.unshift(hexRgb(key));
      }
    });
  }
  window.nimaeDiversify=diversify;

  /* collection: category chips + sort (client side) */
  $$('[data-collection]').forEach(function (root) {
    var grid = $('[data-grid]', root); if (!grid) return;
    var cards = $$('.card', grid);
    var kind = 'all', sort = 'feat';
    var countEl = $('[data-count]', root), emptyEl = $('[data-empty]', root);
    function apply() {
      var shown = 0;
      cards.forEach(function (c) { var ok = kind === 'all' || c.getAttribute('data-kind') === kind; c.hidden = !ok; if (ok) shown++; });
      var sorted = cards.slice().sort(function (a, b) {
        if (sort === 'up') return +a.dataset.price - +b.dataset.price;
        if (sort === 'down') return +b.dataset.price - +a.dataset.price;
        if (sort === 'new') return +b.dataset.created - +a.dataset.created;
        return +a.dataset.index - +b.dataset.index;
      });
      sorted.forEach(function (c) { grid.appendChild(c); });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' προϊόν' : ' προϊόντα');
      if (emptyEl) emptyEl.hidden = shown !== 0;
      diversify(grid);
    }
    $$('[data-kind-filter]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        kind = b.getAttribute('data-kind-filter');
        $$('[data-kind-filter]', root).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        apply();
      });
    });
    $$('[data-sort]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        sort = b.getAttribute('data-sort');
        $$('[data-sort]', root).forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        apply();
      });
    });
    diversify(grid);
    /* hide chips with no products */
    $$('[data-kind-filter]', root).forEach(function (b) {
      var k = b.getAttribute('data-kind-filter');
      if (k !== 'all' && !cards.some(function (c) { return c.getAttribute('data-kind') === k; })) b.hidden = true;
    });
  });

  /* delivery estimate: 5 to 12 working days, Greek holidays skipped */
  var M = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  var HOL = ['1-1', '1-6', '3-25', '5-1', '8-15', '10-28', '12-25', '12-26'];
  function addWorkdays(n) {
    var d = new Date(), k = 0;
    while (k < n) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6 && HOL.indexOf((d.getMonth() + 1) + '-' + d.getDate()) < 0) k++; }
    return d;
  }
  function eta() {
    var a = addWorkdays(5), b = addWorkdays(12);
    var fa = a.getMonth() === b.getMonth() ? String(a.getDate()) : a.getDate() + ' ' + M[a.getMonth()];
    return 'Παραγγείλετε σήμερα και θα το έχετε από ' + fa + ' έως ' + b.getDate() + ' ' + M[b.getMonth()] + '.';
  }

  /* product page */
  $$('[data-product]').forEach(function (root) {
    var json = $('[data-product-json]', root); if (!json) return;
    var data = JSON.parse(json.textContent);
    var variants = data.variants;
    var form = $('form.product-form', root);
    var idInput = $('[data-variant-id]', root);
    var addBtn = $('[data-add]', root);
    var priceEl = $('[data-price]', root);
    var colourLabel = $('[data-colour-label]', root);
    var etaEl = $('[data-eta]', root);
    var errEl = $('[data-error]', root);
    var gallery = $('[data-gallery]', root);
    var ci = root.getAttribute('data-colour-index');
    var optionButtons = $$('[data-option]', root);
    var nOptions = 0;
    optionButtons.forEach(function (b) { nOptions = Math.max(nOptions, +b.getAttribute('data-option') + 1); });
    var selected = [];
    var first = variants.filter(function (v) { return String(v.id) === String(idInput.value); })[0] || variants.filter(function (v) { return v.available; })[0] || variants[0];
    for (var i = 0; i < nOptions; i++) selected[i] = null;
    if (ci !== '' && ci !== null && first) selected[+ci] = first.options[+ci];
    if (etaEl) etaEl.textContent = eta();

    function match(sel) {
      return variants.filter(function (v) { return sel.every(function (val, i) { return val === null || v.options[i] === val; }); });
    }
    function render() {
      optionButtons.forEach(function (b) {
        var oi = +b.getAttribute('data-option'), val = b.getAttribute('data-value');
        b.setAttribute('aria-pressed', selected[oi] === val ? 'true' : 'false');
        if (String(oi) !== String(ci)) {
          var test = selected.slice(); test[oi] = val;
          var ok = match(test).some(function (v) { return v.available; });
          b.setAttribute('aria-disabled', ok ? 'false' : 'true');
        }
      });
      if (colourLabel && ci !== '' && selected[+ci]) colourLabel.textContent = selected[+ci];
      var complete = selected.every(function (v) { return v !== null; });
      var hits = match(selected);
      var v = complete ? hits[0] : null;
      if (v) { idInput.value = v.id; if (priceEl) priceEl.textContent = v.price; }
      if (addBtn) {
        if (!complete) { addBtn.disabled = false; addBtn.textContent = 'Επιλέξτε μέγεθος'; }
        else if (v && v.available) { addBtn.disabled = false; addBtn.textContent = 'Προσθήκη στο καλάθι'; }
        else { addBtn.disabled = true; addBtn.textContent = 'Εξαντλήθηκε'; }
      }
      /* gallery: show this colour's photos */
      if (gallery && ci !== '' && selected[+ci]) {
        var cv = match(selected.map(function (s, i) { return i === +ci ? s : null; }))[0];
        var key = cv && cv.key;
        var imgs = $$('img', gallery);
        var any = key && imgs.some(function (im) { return im.getAttribute('data-key') === key; });
        imgs.forEach(function (im) { im.hidden = any ? im.getAttribute('data-key') !== key : false; });
      }
    }
    optionButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-disabled') === 'true') return;
        selected[+b.getAttribute('data-option')] = b.getAttribute('data-value');
        if (errEl) errEl.hidden = true;
        render();
      });
    });
    var sizeLink = $('[data-open-size]', root);
    if (sizeLink) sizeLink.addEventListener('click', function () { var d = document.getElementById('size-guide'); if (d) d.open = true; });

    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!selected.every(function (v) { return v !== null; })) {
        if (errEl) { errEl.textContent = 'Επιλέξτε μέγεθος για να συνεχίσετε.'; errEl.hidden = false; }
        return;
      }
      addBtn.disabled = true;
      fetch(window.Shopify && Shopify.routes ? Shopify.routes.root + 'cart/add.js' : '/cart/add.js', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items: [{ id: +idInput.value, quantity: 1 }] })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j.description || 'Κάτι πήγε στραβά.');
          addBtn.textContent = 'Προστέθηκε στο καλάθι';
          return fetch('/cart.js').then(function (r) { return r.json(); }).then(function (c) {
            var cnt = document.querySelector('[data-cart-count]');
            var link = document.querySelector('a[href$="/cart"]');
            if (!cnt && link) { cnt = document.createElement('span'); cnt.className = 'count'; cnt.setAttribute('data-cart-count', ''); link.appendChild(cnt); }
            if (cnt) cnt.textContent = c.item_count;
            if (link) link.setAttribute('aria-label', 'Καλάθι, ' + c.item_count + ' προϊόντα');
            setTimeout(function () { window.location.href = '/cart'; }, 600);
          });
        })
        .catch(function (err) { if (errEl) { errEl.textContent = err.message; errEl.hidden = false; } addBtn.disabled = false; render(); });
    });
    render();
  });

  $$('.scroller').forEach(function (sc) { diversify(sc); });

  /* product recommendations */
  $$('[data-recs]').forEach(function (el) {
    var url = el.getAttribute('data-url'); if (!url || el.children.length) return;
    fetch(url).then(function (r) { return r.text(); }).then(function (t) {
      var d = document.createElement('div'); d.innerHTML = t;
      var inner = d.querySelector('[data-recs]');
      if (inner && inner.children.length) el.innerHTML = inner.innerHTML;
    }).catch(function () {});
  });

  /* cart quantity buttons */
  $$('[data-qty]').forEach(function (q) {
    var input = $('input', q);
    $$('[data-step]', q).forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = Math.max(0, (+input.value || 0) + (+b.getAttribute('data-step')));
        var f = document.getElementById('cart-form');
        if (f) { var h = document.createElement('input'); h.type = 'hidden'; h.name = 'update'; h.value = '1'; f.appendChild(h); f.submit(); }
      });
    });
    input.addEventListener('change', function () { var f = document.getElementById('cart-form'); if (f) { var h = document.createElement('input'); h.type = 'hidden'; h.name = 'update'; h.value = '1'; f.appendChild(h); f.submit(); } });
  });

  /* sizes page */
  var sz = document.querySelector('[data-sizes]');
  if (sz) {
    var C = JSON.parse(document.getElementById('sizes-data').textContent);
    var state = { cat: 'fouter', idx: null };
    var catsEl = $('[data-size-cats]', sz), prodsEl = $('[data-size-prods]', sz), tableEl = $('[data-size-table]', sz);
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function draw() {
      $$('button', catsEl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === state.cat ? 'true' : 'false'); });
      var list = C.map(function (c, i) { return [c, i]; }).filter(function (x) { return x[0][2] === state.cat; }).sort(function (a, b) { return a[0][0].localeCompare(b[0][0], 'el'); });
      if (!list.length) { prodsEl.innerHTML = ''; tableEl.innerHTML = ''; return; }
      var idx = state.idx !== null && C[state.idx] && C[state.idx][2] === state.cat ? state.idx : list[0][1];
      prodsEl.innerHTML = list.map(function (x) { return '<button type="button" class="size-chip" aria-pressed="' + (x[1] === idx) + '" data-idx="' + x[1] + '">' + esc(x[0][0]) + '</button>'; }).join('');
      var cur = C[idx];
      var heads = cur[3], rows = cur[4], na = cur[6] || [];
      var h = '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px"><h2 class="serif" style="margin:0;font-size:28px;line-height:34px">' + esc(cur[0]) + '</h2></div>';
      h += '<span class="muted" style="font-size:15px">' + esc(cur[1]) + '</span>';
      h += '<span class="muted" style="font-size:13px">' + esc(cur[5]) + '</span>';
      h += '<div class="table-scroll"><table class="size-table"><thead><tr><th>Εκ.</th>' + heads.map(function (x) { return '<th' + (na.indexOf(x) >= 0 ? ' class="na"' : '') + '>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>';
      h += rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th>' + r.slice(1).map(function (v, i) { return '<td' + (na.indexOf(heads[i]) >= 0 ? ' class="na"' : '') + '>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('');
      h += '</tbody></table></div>';
      if (cur[7]) h += '<span class="muted" style="font-size:13px">' + esc(cur[7]) + '</span>';
      tableEl.innerHTML = h;
      $$('button', prodsEl).forEach(function (b) { b.addEventListener('click', function () { state.idx = +b.getAttribute('data-idx'); draw(); }); });
    }
    $$('button', catsEl).forEach(function (b) { b.addEventListener('click', function () { state.cat = b.getAttribute('data-cat'); state.idx = null; draw(); }); });
    draw();
  }
})();
