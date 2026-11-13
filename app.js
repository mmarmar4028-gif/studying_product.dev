/* Движок сайта: навигация, рендер тем, интерактивные виджеты, тесты, итоговый зачёт */
(function () {
  const TOPICS = (window.TOPICS || []).slice().sort((a, b) => a.id - b.id);
  const COLORS = { 1: '#e0562c', 2: '#2f5fd0', 3: '#1b8a5a', 4: '#c27c0e', 5: '#6a45d1', 6: '#0c8a8c', 7: '#c2185b', 8: '#4e5d6c' };
  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');
  const strip = document.getElementById('progressStrip');
  const EXAM_N = 24, EXAM_PASS = 15;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- тема оформления ----------
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = store.get('pd-theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.onclick = () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('pd-theme', next);
  };

  // ---------- утилиты ----------
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
  const fmtMoney = (n) => { const s = n < 0 ? '−' : ''; const a = Math.abs(n); return s + (a >= 1e6 ? (a / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' млн ₽' : fmt(a) + ' ₽'); };
  const best = (id) => store.get('pd-quiz-' + id, null);
  const doneSet = (id) => new Set(store.get('pd-done-' + id, []));
  const color = (id) => COLORS[id] || '#2f5fd0';
  const setTopicColor = (c) => document.documentElement.style.setProperty('--topic', c);

  // ---------- навигация ----------
  function renderTabs(active) {
    tabs.innerHTML = '';
    tabs.append(h('a', { href: '#/', class: 'tab' + (active === 'home' ? ' active' : '') }, '🏠 Главная'));
    TOPICS.forEach(t => {
      const b = best(t.id);
      tabs.append(h('a', { href: '#/topic/' + t.id, class: 'tab' + (active === t.id ? ' active' : '') + (t.soon ? ' soon' : ''), style: { '--c': color(t.id) }, title: t.title },
        h('span', { class: 'n' }, String(t.id)), t.short, b && b.pct >= 70 ? h('span', { class: 'ok', title: 'Тест пройден' }, '✓') : null));
    });
    tabs.append(h('a', { href: '#/exam', class: 'tab exam-tab' + (active === 'exam' ? ' active' : '') }, '🎯 Пробный зачёт'));
    const act = tabs.querySelector('.active');
    if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function updateStrip(t) {
    if (!t || t.soon) { strip.hidden = true; return; }
    strip.hidden = false;
    const pct = Math.round(doneSet(t.id).size / t.sections.length * 100);
    strip.firstChild.style.width = pct + '%';
  }

  function route() {
    const m = location.hash.match(/^#\/topic\/(\d+)/);
    app.innerHTML = '';
    if (m && TOPICS.find(x => x.id === +m[1])) {
      const t = TOPICS.find(x => x.id === +m[1]);
      setTopicColor(color(t.id)); renderTabs(t.id); renderTopic(t); updateStrip(t);
    } else if (location.hash.startsWith('#/exam')) {
      setTopicColor('#c27c0e'); renderTabs('exam'); updateStrip(null); renderExam();
    } else {
      setTopicColor('#2f5fd0'); renderTabs('home'); updateStrip(null); renderHome();
    }
    const anchor = location.hash.split('#')[2];
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); } else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- главная ----------
  function renderHome() {
    const ready = TOPICS.filter(t => !t.soon);
    const passed = ready.filter(t => (best(t.id) || {}).pct >= 70).length;
    const steps = ready.reduce((s, t) => s + doneSet(t.id).size, 0), stepsAll = ready.reduce((s, t) => s + t.sections.length, 0);
    const ex = best('exam');
    app.append(
      h('section', { class: 'hero' },
        h('p', { class: 'eyebrow' }, 'Подготовка к зачёту'),
        h('h1', {}, 'Разработка программного продукта'),
        h('p', { class: 'lead' }, 'Весь курс по темам. В каждой теме сначала «что изучим», потом объяснение по шагам, формулы и схемы с разбором, практика и тест, который объясняет ошибки. В конце есть пробный зачёт в настоящем формате.')),
      h('div', { class: 'card summary' },
        h('h2', {}, 'Твой прогресс'),
        h('div', { class: 'stats-row' },
          h('div', { class: 'stat' }, h('b', {}, `${steps}/${stepsAll}`), h('span', {}, 'шагов изучено')),
          h('div', { class: 'stat' }, h('b', {}, `${passed}/${ready.length}`), h('span', {}, 'тестов сдано (≥70%)')),
          h('div', { class: 'stat' }, h('b', {}, ex ? `${ex.score}/${ex.total}` : '—'), h('span', {}, 'лучший пробный зачёт'))),
        h('div', { class: 'row', style: { marginTop: '14px' } },
          h('a', { class: 'btn primary', href: '#/topic/' + ((ready.find(t => doneSet(t.id).size < t.sections.length) || ready[0]).id) }, 'Продолжить учиться →'),
          h('a', { class: 'btn', href: '#/exam' }, '🎯 Пробный зачёт'))),
      h('div', { class: 'card' },
        h('h2', {}, 'Как устроен зачёт'),
        h('ul', { html: '<li>Итоговый тест из <b>24 вопросов</b>.</li><li>Проходной балл: <b>15 правильных</b> (≈ 63%).</li><li>На каждом занятии проходит деловая игра. <b>Топ-10</b> игроков получают <b>3 автоматических «плюса»</b> на вопросы зачёта по выбору.</li><li>Пробный зачёт на этом сайте берёт 24 случайных вопроса из всех готовых тем и засчитывается так же, от 15 правильных.</li>' })),
      h('div', { class: 'card' },
        h('h2', {}, 'Как читать этот сайт: цвет = смысл'),
        h('p', { class: 'muted' }, 'Каждый цвет всегда означает одно и то же. Так мозг быстрее находит главное при повторении.'),
        h('div', { class: 'legend', html: '<div class="def"><b>📘 Определение</b><br>термин, который надо знать</div><div class="exam"><b>🎯 На зачёт</b><br>выучить почти дословно</div><div class="warn"><b>⚠️ Важно / ловушка</b><br>частая ошибка или тонкость</div><div class="tip"><b>💡 Пояснение / пример</b><br>простыми словами</div><div class="formula"><b>📐 Формула</b><br>с разбором каждой буквы</div><div class="scheme"><b>🧩 Схема</b><br>картинка со слайда и как её читать</div><div class="practice"><b>✋ Практика</b><br>интерактивное задание</div>' })),
      h('div', { class: 'card' },
        h('h2', {}, 'Карта курса'),
        h('p', { html: 'Курс построен на метафоре: продукт должен быть <b>правильной вещью</b> (нужен людям и выгоден) и должен быть <b>сделан правильно</b>.' }),
        h('div', { class: 'matrix', html: '<div class="lbl">Делать правильные вещи</div><div class="cell a">Продуктовое мышление<br>(темы 1–2)</div><div class="cell b">Экономика продукта<br>(тема 3)</div><div class="lbl">Делать вещи правильно</div><div class="cell c">Команда и процесс<br>(темы 4–5)</div><div class="cell d">Технические практики<br>(темы 5–7)</div>' }),
        h('p', { class: 'muted', style: { fontSize: '14.5px' } }, 'Тема 8 (финальная игра) соединяет всё вместе: исследования, юнит-экономику, команды и инфраструктуру.')),
      h('h2', { style: { marginTop: '26px' } }, 'Темы'),
      (() => {
        const g = h('div', { class: 'topic-grid' });
        TOPICS.forEach(t => {
          const b = best(t.id), d = t.soon ? 0 : doneSet(t.id).size;
          g.append(h('a', { href: '#/topic/' + t.id, class: 'topic-card' + (t.soon ? ' soon' : ''), style: { '--c': color(t.id) } },
            h('div', { class: 'n' }, `ТЕМА ${t.id}` + (t.soon ? ' · скоро' : '')),
            h('div', { class: 't' }, t.title),
            h('div', { class: 's' }, t.soon ? 'Появится, когда будет загружена презентация' : `Шагов: ${d}/${t.sections.length} · Тест: ${b ? b.score + '/' + b.total : 'не пройден'}`),
            h('div', { class: 'bar' }, h('i', { style: { width: (t.soon ? 0 : Math.round(d / t.sections.length * 100)) + '%' } }))));
        });
        return g;
      })());
  }

  // ---------- тема ----------
  function renderTopic(t) {
    if (t.soon) {
      app.append(h('div', { class: 'topic-hero' }, h('p', { class: 'eyebrow' }, `Тема ${t.id}`), h('h1', {}, t.title)),
        h('div', { class: 'card' }, h('p', {}, 'Эта тема появится, когда будет загружена соответствующая презентация.'),
          t.game ? h('p', { html: `Игра к теме, скорее всего: <a href="${t.game.url}" target="_blank" rel="noopener">${t.game.name}</a>.` }) : null));
      return;
    }
    const secs = t.sections;
    const done = doneSet(t.id);
    const toc = h('div', { class: 'toc' });
    const drawToc = () => {
      toc.innerHTML = '';
      secs.forEach((s, i) => toc.append(h('a', { href: `#/topic/${t.id}#s${i + 1}`, class: done.has(i) ? 'done' : '' }, done.has(i) ? '✓' : `${i + 1}.`, s.title)));
      toc.append(h('a', { href: `#/topic/${t.id}#cheat` }, '📋 Шпаргалка'), h('a', { href: `#/topic/${t.id}#quiz` }, '📝 Тест'));
    };
    drawToc();
    app.append(
      h('div', { class: 'topic-hero' },
        h('p', { class: 'eyebrow' }, `Тема ${t.id} · ${t.lecture}`),
        h('h1', {}, t.title),
        t.subtitle ? h('p', { class: 'lead' }, t.subtitle) : null),
      h('div', { class: 'card summary' },
        h('h2', {}, '🗺 Что мы изучим'),
        h('p', { html: t.summary.intro }),
        h('ol', {}, t.summary.points.map(p => h('li', { html: p }))),
        h('p', { class: 'muted', style: { fontSize: '14.5px', marginTop: '10px' } }, 'Читай по шагам. В конце каждого шага нажми «Шаг понятен»: полоска вверху покажет, сколько пройдено.'),
        toc));
    secs.forEach((s, i) => {
      const card = h('section', { class: 'card' + (done.has(i) ? ' done' : ''), id: 's' + (i + 1) },
        h('div', { class: 'step-label' }, `Шаг ${i + 1} из ${secs.length}`),
        h('h2', {}, h('span', { class: 'num' }, String(i + 1)), s.title));
      s.blocks.forEach(b => card.append(renderBlock(b)));
      const btn = h('button', { class: 'done-btn' + (done.has(i) ? ' on' : '') }, done.has(i) ? '✓ Шаг понятен' : 'Отметить: шаг понятен');
      btn.onclick = () => {
        if (done.has(i)) done.delete(i); else done.add(i);
        store.set('pd-done-' + t.id, [...done]);
        btn.className = 'done-btn' + (done.has(i) ? ' on' : ''); btn.textContent = done.has(i) ? '✓ Шаг понятен' : 'Отметить: шаг понятен';
        card.classList.toggle('done', done.has(i)); drawToc(); updateStrip(t);
        if (done.has(i) && secs[i + 1]) document.getElementById('s' + (i + 2)).scrollIntoView({ behavior: 'smooth' });
      };
      card.append(h('div', { class: 'done-row' }, btn));
      app.append(card);
    });
    if (t.cheatsheet) app.append(h('section', { class: 'card summary', id: 'cheat' }, h('h2', {}, '📋 Шпаргалка: главное за 2 минуты'), h('ul', {}, t.cheatsheet.map(c => h('li', { html: c })))));
    if (t.game) app.append(h('div', { class: 'card game-link' },
      h('div', {}, h('b', {}, '🎮 Игра профессора: ' + t.game.name), h('div', { class: 'muted', style: { fontSize: '14.5px' }, html: t.game.text })),
      h('a', { class: 'btn primary', href: t.game.url, target: '_blank', rel: 'noopener' }, 'Открыть игру ↗')));
    app.append(renderQuiz({ key: t.id, title: '📝 Тест по теме', pool: () => shuffle(t.quiz) }));
    const idx = TOPICS.indexOf(t), prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
    app.append(h('div', { class: 'pager' },
      prev ? h('a', { class: 'btn', href: '#/topic/' + prev.id }, '← ' + prev.short) : h('span'),
      next && !next.soon ? h('a', { class: 'btn primary', href: '#/topic/' + next.id }, next.short + ' →') : h('a', { class: 'btn primary', href: '#/exam' }, '🎯 Пробный зачёт →')));
  }

  const KIND_LABEL = { def: '📘 Определение', exam: '🎯 На зачёт', warn: '⚠️ Важно', tip: '💡 Пояснение', scheme: '🧩 Как читать схему' };
  function renderBlock(b) {
    switch (b.type) {
      case 'html': return h('div', { html: b.html });
      case 'callout': { const k = b.kind || 'tip'; return h('div', { class: 'callout ' + k, html: `<span class="kind">${KIND_LABEL[k] || ''}</span>` + (b.title ? `<span class="ttl">${b.title}</span>` : '') + b.html }); }
      case 'scheme': return h('div', {},
        h('div', { class: 'diagram', html: `<div class="cap">🧩 Схема${b.title ? ': ' + b.title : ''}</div>` + b.html }),
        b.explain ? h('div', { class: 'callout scheme', html: `<span class="kind">${KIND_LABEL.scheme}</span>` + b.explain }) : null);
      case 'formula': return renderFormula(b);
      case 'widget': return renderWidget(b);
      default: return h('div');
    }
  }
  function renderFormula(f) {
    return h('div', { class: 'formula' },
      h('div', { class: 'step-label' }, '📐 Формула' + (f.name ? ': ' + f.name : '')),
      h('div', { class: 'expr', html: f.expr }),
      h('div', { class: 'parts' }, f.parts.map(([s, d]) => h('div', { class: 'part' }, h('span', { class: 'sym', html: s }), h('span', { html: d })))),
      f.why ? h('div', { class: 'why', html: '<b>Зачем нужна:</b> ' + f.why }) : null,
      f.example ? h('div', { class: 'why', style: { marginTop: '6px' }, html: '<b>Пример:</b> ' + f.example }) : null);
  }

  // ---------- виджеты ----------
  const W = {};
  function renderWidget(w) {
    const box = h('div', { class: 'widget' },
      h('div', { class: 'widget-head' }, h('span', { class: 'tag' }, '✋ Практика'), h('h3', {}, w.title)),
      w.intro ? h('p', { class: 'muted', style: { fontSize: '15.5px' }, html: w.intro }) : null);
    const body = h('div'); box.append(body);
    (W[w.kind] || (() => body.append('Нет виджета ' + w.kind)))(body, w);
    return box;
  }

  W.flashcards = (el, w) => {
    el.append(h('div', { class: 'cards' }, w.cards.map(([f, b]) => {
      const c = h('div', { class: 'flash', onclick: () => c.classList.toggle('flipped') },
        h('div', { class: 'flash-inner' }, h('div', { class: 'flash-face flash-front' }, f), h('div', { class: 'flash-face flash-back', html: b })));
      return c;
    })));
  };

  W.classify = (el, w) => {
    let done = 0, right = 0;
    const score = h('div', { class: 'muted', style: { fontSize: '14.5px', marginTop: '8px' } });
    const upd = () => score.textContent = `Отвечено ${done} из ${w.items.length}, верно ${right}.`;
    const list = h('div');
    shuffle(w.items).forEach(it => {
      const row = h('div', { class: 'cls-item' }, h('div', { class: 'cls-text', html: it.text }));
      const btns = h('div', { class: 'row' }), fbBox = h('div');
      w.buckets.forEach(bk => {
        const btn = h('button', { class: 'btn small', onclick: () => {
          if (row.classList.contains('done')) return;
          row.classList.add('done'); done++;
          const ok = bk === it.bucket; if (ok) right++;
          btn.classList.add(ok ? 'right' : 'wrong');
          if (!ok) [...btns.children].find(b => b.textContent === it.bucket).classList.add('right');
          fbBox.append(h('div', { class: 'fb ' + (ok ? 'good' : 'bad'), html: (ok ? '✓ Верно.' : `✗ Неверно, правильно: «${it.bucket}».`) + (it.why ? `<span class="why">${it.why}</span>` : '') }));
          upd();
        } }, bk);
        btns.append(btn);
      });
      row.append(btns, fbBox); list.append(row);
    });
    upd(); el.append(list, score);
  };

  W.order = (el, w) => {
    const pool = h('div', { class: 'order-pool' }), picked = h('div', { class: 'order-picked' }), fb = h('div');
    let order = [], shuffled = shuffle(w.items);
    const draw = () => {
      pool.innerHTML = ''; picked.innerHTML = '';
      shuffled.forEach(x => { if (!order.includes(x)) pool.append(h('button', { class: 'order-chip', onclick: () => { order.push(x); fb.innerHTML = ''; draw(); } }, x)); });
      order.forEach((x, i) => picked.append(h('button', { class: 'order-chip', title: 'Убрать', onclick: () => { order.splice(i, 1); fb.innerHTML = ''; draw(); } }, `${i + 1}. ${x}`)));
      if (!order.length) picked.append(h('div', { class: 'muted', style: { fontSize: '14.5px' } }, 'Нажимай на пункты в правильном порядке'));
    };
    const check = () => {
      if (order.length < w.items.length) { fb.innerHTML = '<div class="fb bad">Сначала расставь все пункты.</div>'; return; }
      let ok = 0;
      [...picked.children].forEach((c, i) => { const r = order[i] === w.items[i]; if (r) ok++; c.classList.add(r ? 'ok' : 'no'); });
      fb.innerHTML = ok === w.items.length
        ? `<div class="fb good">✓ Всё верно!${w.explain ? `<span class="why">${w.explain}</span>` : ''}</div>`
        : `<div class="fb bad">На своём месте ${ok} из ${w.items.length}. Правильно: ${w.items.map((x, i) => `<b>${i + 1}.</b> ${x}`).join(' → ')}${w.explain ? `<span class="why">${w.explain}</span>` : ''}</div>`;
    };
    draw();
    el.append(h('div', { class: 'order-cols' }, h('div', {}, h('div', { class: 'col-title' }, 'Пункты'), pool), h('div', {}, h('div', { class: 'col-title' }, 'Твой порядок'), picked)),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: check }, 'Проверить'), h('button', { class: 'btn', onclick: () => { order = []; shuffled = shuffle(w.items); fb.innerHTML = ''; draw(); } }, 'Заново')), fb);
  };

  W.match = (el, w) => {
    const options = [...new Set(w.pairs.map(p => p[1]))];
    const rows = shuffle(w.pairs).map(([l, r, why]) => {
      const sel = h('select', {}, h('option', { value: '' }, '— выбери —'), shuffle(options).map(o => h('option', { value: o }, o)));
      const fb = h('div');
      return { row: h('div', {}, h('div', { class: 'match-row' }, h('div', { html: l }), sel), fb), sel, r, fb, why };
    });
    const res = h('div');
    el.append(...rows.map(x => x.row), h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn primary', onclick: () => {
        let ok = 0;
        rows.forEach(x => {
          const r = x.sel.value === x.r; if (r) ok++;
          x.sel.className = r ? 'ok' : 'no';
          x.fb.innerHTML = r ? '' : `<div class="fb bad">Правильно: «${x.r}».${x.why ? `<span class="why">${x.why}</span>` : ''}</div>`;
        });
        res.innerHTML = `<div class="fb ${ok === rows.length ? 'good' : 'bad'}">Верно ${ok} из ${rows.length}.</div>`;
      } }, 'Проверить')), res);
  };

  // слайдеры: helper
  function sliders(el, state, defs, onChange) {
    defs.forEach(([k, label, min, max, step, f]) => {
      const val = h('b', {}, f(state[k]));
      const inp = h('input', { type: 'range', min, max, step, value: state[k], 'aria-label': label, oninput: (e) => { state[k] = +e.target.value; val.textContent = f(state[k]); onChange(); } });
      el.append(h('div', { class: 'slider' }, h('div', { class: 'lab' }, h('span', {}, label), val), inp));
    });
  }
  const line = (label, value, cls = '') => `<div class="result-line ${cls}"><span>${label}</span><b>${value}</b></div>`;

  W.burnrate = (el) => {
    const s = { cost: 500000, team: 10, iters: 10, weeks: 2, success: 10 };
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      const burn = s.cost * s.team, months = s.iters * s.weeks / 4, check = burn * months, per = check / (s.success / 100);
      out.innerHTML = line(`Burn rate = ${fmt(s.cost)} × ${s.team}`, fmtMoney(burn) + ' / мес') + line(`Время = ${s.iters} × ${s.weeks} нед.`, `${s.iters * s.weeks} нед. ≈ ${months.toLocaleString('ru-RU')} мес.`) + line('Стоимость проверки 1 гипотезы', fmtMoney(check)) + line(`Чтобы найти 1 удачную (÷ ${s.success}%)`, fmtMoney(per), 'total neg');
    };
    sliders(el, s, [
      ['cost', 'Стоимость 1 человека в месяц', 100000, 1000000, 50000, v => fmt(v) + ' ₽'],
      ['team', 'Размер команды, чел.', 1, 30, 1, v => v],
      ['iters', 'Число итераций (спринтов)', 1, 20, 1, v => v],
      ['weeks', 'Длина итерации, недель', 1, 4, 1, v => v],
      ['success', 'Доля успешных гипотез', 5, 100, 5, v => v + '%']], calc);
    calc();
    el.append(out, h('p', { class: 'muted', style: { fontSize: '14px', marginTop: '8px' } }, 'По умолчанию цифры из лекции. Подвигай ползунки: что сильнее всего снижает итоговую сумму?'));
  };

  // Юнит-экономика по модели профессора (слайды «Экономическая модель»)
  W.unitecon = (el, w) => {
    const s = Object.assign({ price: 600, margin: 30, churn: 50, conv: 5, ads: 1000000, lead: 10, fix: 2000000 }, w.start || {});
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      const leads = s.ads / s.lead, clients = leads * s.conv / 100, orders = 100 / s.churn;
      const arpu = s.price * s.margin / 100 * orders, cpa = s.ads / clients;
      const revenue = clients * orders * s.price, cogs = revenue * (1 - s.margin / 100), gross = revenue - cogs;
      const net = gross - s.ads - s.fix;
      out.innerHTML =
        `<div class="step-label">Привлечение</div>` + line('Лиды = реклама ÷ цена лида', fmt(leads)) + line('Клиенты = лиды × конверсия', fmt(clients)) + line('Заказов на клиента = 1 ÷ отток', orders.toLocaleString('ru-RU', { maximumFractionDigits: 2 })) +
        `<div class="step-label" style="margin-top:10px">Юнит-экономика (на 1 клиента)</div>` + line('ARPU = цена × маржа × заказы', fmtMoney(arpu), 'pos') + line('CPA = реклама ÷ клиенты', fmtMoney(cpa), 'neg') + line('ARPU − CPA', fmtMoney(arpu - cpa), arpu - cpa >= 0 ? 'pos' : 'neg') +
        `<div class="step-label" style="margin-top:10px">Profit and loss</div>` + line('Выручка', fmtMoney(revenue)) + line('− Себестоимость (CoGS)', fmtMoney(-cogs), 'neg') + line('= Валовая прибыль', fmtMoney(gross)) + line('− Реклама', fmtMoney(-s.ads), 'neg') + line('− Фиксированные расходы', fmtMoney(-s.fix), 'neg') +
        line('= Чистая прибыль', fmtMoney(net), 'total ' + (net >= 0 ? 'pos' : 'neg'));
    };
    const left = h('div');
    sliders(left, s, [
      ['price', 'Цена (AvPrice)', 100, 2000, 50, v => fmt(v) + ' ₽'],
      ['margin', 'Маржа', 5, 80, 1, v => v + '%'],
      ['churn', 'Отток (Churn)', 10, 100, 5, v => v + '%'],
      ['conv', 'Конверсия лид → клиент', 1, 30, 1, v => v + '%'],
      ['ads', 'Расходы на рекламу', 100000, 5000000, 100000, v => fmtMoney(v)],
      ['lead', 'Цена лида', 1, 50, 1, v => v + ' ₽'],
      ['fix', 'Фиксированные расходы', 0, 5000000, 250000, v => fmtMoney(v)]], calc);
    calc();
    el.append(h('div', { class: 'calc-grid' }, left, out),
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn small', onclick: () => { el.innerHTML = ''; W.unitecon(el, { start: { price: 600, margin: 30, churn: 50, conv: 5, ads: 1000000, lead: 10, fix: 2000000 } }); } }, 'Пример 1 из лекции (−1,2 млн)'),
        h('button', { class: 'btn small', onclick: () => { el.innerHTML = ''; W.unitecon(el, { start: { price: 650, margin: 33, churn: 65, conv: 11, ads: 1000000, lead: 10, fix: 1500000 } }); } }, 'Пример 2 из лекции (+1,13 млн)')));
  };

  W.funnel = (el) => {
    const s = { steps: 5, keep: 50 };
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      let v = 100, rows = '';
      for (let i = 1; i <= s.steps; i++) { v = v * s.keep / 100; rows += line(`После шага ${i}`, v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + '%'); }
      out.innerHTML = rows + line(`Итоговая конверсия = (${s.keep}%)<sup>${s.steps}</sup>`, v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + '%', 'total');
    };
    sliders(el, s, [['steps', 'Сколько шагов в воронке', 1, 8, 1, v => v], ['keep', 'Сколько % доходит до следующего шага', 10, 95, 5, v => v + '%']], calc);
    calc(); el.append(out);
  };

  // Велосити команды (игра «Найм»)
  W.team = (el) => {
    const P = { 'Аналитик': { price: [10, 20, 30], prod: [4, 8, 12] }, 'Разработчик': { price: [10, 30, 40], prod: [1, 2, 4] }, 'Тестер': { price: [10, 20, 30], prod: [4, 6, 8] } };
    const L = ['Джуниор', 'Миддл', 'Сеньор'];
    const s = { 'Аналитик': [0, 0, 1], 'Разработчик': [0, 0, 1], 'Тестер': [0, 1, 0] };
    const grid = h('div'), out = h('div', { class: 'result-box' });
    const calc = () => {
      let cost = 0, people = 0; const prod = {};
      Object.keys(P).forEach(r => { prod[r] = 0; s[r].forEach((n, i) => { cost += n * P[r].price[i]; prod[r] += n * P[r].prod[i]; people += n; }); });
      const vel = Math.min(...Object.values(prod));
      const slow = Object.keys(prod).filter(r => prod[r] === vel);
      out.innerHTML = Object.keys(prod).map(r => line(`Производительность: ${r.toLowerCase()}и`, prod[r], prod[r] === vel ? 'neg' : 'pos')).join('') +
        line('Велосити команды = минимум из трёх', vel, 'total') + line('Затраты команды', cost) + line('Затраты на 1 единицу скорости', vel ? (cost / vel).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : '∞') +
        `<div class="fb ${vel ? 'bad' : 'bad'}" style="margin-top:8px">Узкое место: <b>${slow.join(', ').toLowerCase()}</b>. Нанимать других бесполезно, пока не усилишь эту часть.</div>` +
        (people > 9 ? `<div class="fb bad">В команде ${people} человек — больше 9! Время начнёт уходить на коммуникацию.</div>` : '');
    };
    Object.keys(P).forEach(r => {
      grid.append(h('div', { class: 'step-label', style: { marginTop: '10px' } }, r));
      L.forEach((lv, i) => {
        const span = h('span', {}, String(s[r][i]));
        grid.append(h('div', { class: 'stepper' }, h('span', {}, `${lv} · цена ${P[r].price[i]}, польза ${P[r].prod[i]}`),
          h('div', { class: 'ctl' }, h('button', { 'aria-label': 'меньше', onclick: () => { s[r][i] = Math.max(0, s[r][i] - 1); span.textContent = s[r][i]; calc(); } }, '−'), span,
            h('button', { 'aria-label': 'больше', onclick: () => { s[r][i] = Math.min(9, s[r][i] + 1); span.textContent = s[r][i]; calc(); } }, '+'))));
      });
    });
    calc();
    el.append(h('div', { class: 'calc-grid' }, grid, out));
  };

  // Техдолг: быстро или правильно
  W.techdebt = (el) => {
    let sprint, debt, done, log;
    const BASE = 10;
    const stat = h('div', { class: 'mf-stats' }), logEl = h('div', { class: 'mf-log' }), info = h('div');
    const vel = () => Math.max(1, Math.round(BASE * Math.max(0.2, 1 - debt / 60)));
    const reset = () => { sprint = 0; debt = 0; done = 0; log = []; info.innerHTML = ''; draw(); };
    const act = (mode) => {
      if (sprint >= 12) return;
      sprint++;
      const v = vel();
      if (mode === 'right') { done += v; log.unshift(`Спринт ${sprint}: правильно → +${v} SP фич`); }
      if (mode === 'fast') { done += v * 3; debt += v * 2; log.unshift(`Спринт ${sprint}: быстро → +${v * 3} SP фич, но +${v * 2} в техдолг`); }
      if (mode === 'pay') { const p = Math.min(debt, v * 2); debt -= p; log.unshift(`Спринт ${sprint}: гасим техдолг → −${p}`); }
      if (debt > 0) { const inc = Math.round(debt * 0.1); debt += inc; if (inc) log.unshift(`  …техдолг вырос сам на ${inc} (проценты)`); }
      if (sprint >= 12) info.innerHTML = `<div class="fb good">12 спринтов позади. Сделано <b>${done} SP</b>, техдолг <b>${debt}</b>. Попробуй другую стратегию и сравни!</div>`;
      draw();
    };
    const draw = () => {
      stat.innerHTML = `<div class="mf-stat"><b>${sprint}/12</b><span>Спринт</span></div><div class="mf-stat"><b>${vel()}</b><span>Скорость, SP</span></div><div class="mf-stat"><b>${debt}</b><span>Техдолг</span></div>`;
      logEl.innerHTML = `<b>Сделано фич: ${done} SP</b><br>` + (log.join('<br>') || 'Выбирай действие на каждый спринт.');
    };
    el.append(stat, h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => act('right') }, '🛠 Сделать правильно'),
      h('button', { class: 'btn', onclick: () => act('fast') }, '⚡ Сделать быстро (×3)'),
      h('button', { class: 'btn', onclick: () => act('pay') }, '🧹 Гасить техдолг'),
      h('button', { class: 'btn', onclick: reset }, 'Заново')), info, logEl,
      h('p', { class: 'muted', style: { fontSize: '13.5px', marginTop: '8px' } }, 'Упрощённая модель по правилам игр «Technical Debt», «Rhythm» и «Development»: «быстро» даёт в 3 раза больше, но разница уходит в техдолг. Техдолг сам растёт на 10% за спринт и снижает скорость команды. Точные числа в играх профессора другие.'));
    reset();
  };

  // DORA: определить уровень
  W.dora = (el) => {
    const q = [
      ['Время восстановления сервиса при аварии (MTTR)', ['Менее часа', 'Менее дня', 'От недели до месяца']],
      ['Время от коммита до прода (Lead time)', ['Менее часа', 'От дня до недели', 'От недели до месяца', 'От месяца до полугода']],
      ['Частота внедрений в прод (Deployment frequency)', ['Несколько раз в день', 'Раз в день', 'От раза в неделю до раза в месяц']],
      ['Доля неуспешных внедрений (Change failure rate)', ['0–15%', '40–60%']]];
    const score = [[0, 1, 3], [0, 1, 2, 3], [0, 1, 2], [0, 3]];
    const names = ['Элита', 'Высокий', 'Средний', 'Низкий'];
    const sels = q.map(([label, opts]) => h('select', {}, opts.map((o, i) => h('option', { value: i }, o))));
    const out = h('div');
    const calc = () => {
      const lv = sels.map((s, i) => score[i][+s.value]);
      const worst = Math.max(...lv);
      out.innerHTML = `<div class="result-box">${q.map(([l], i) => line(l, names[lv[i]])).join('')}${line('Общий уровень (по самой слабой метрике)', names[worst], 'total')}</div>`;
    };
    sels.forEach((s, i) => { s.onchange = calc; el.append(h('div', { class: 'match-row' }, h('div', {}, q[i][0]), s)); });
    calc(); el.append(out);
  };

  // Надёжность системы: модули последовательно, серверы параллельно (игры «Надёжность ПО/серверов», «Горизонтальное масштабирование»)
  W.reliability = (el) => {
    const SERVERS = { 'Lazure 85%': 85, 'Gcloud 90%': 90, 'Bundex 95%': 95 };
    const mods = [{ name: 'A', r: 70, srv: ['Lazure 85%', 'Bundex 95%'] }, { name: 'B', r: 80, srv: ['Gcloud 90%'] }, { name: 'C', r: 90, srv: ['Lazure 85%', 'Gcloud 90%'] }];
    const box = h('div'), out = h('div', { class: 'result-box' });
    const pct = x => (x * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '%';
    const calc = () => {
      let total = 1, rows = '';
      mods.forEach(m => {
        const reps = m.srv.map(s => m.r / 100 * SERVERS[s] / 100);
        const modRel = reps.length ? 1 - reps.reduce((p, r) => p * (1 - r), 1) : 0;
        total *= modRel;
        rows += line(`Модуль ${m.name}: ${reps.length ? reps.map(pct).join(' ∥ ') : 'нет серверов'}`, pct(modRel));
      });
      out.innerHTML = rows + line('Система = A × B × C', pct(total), 'total ' + (total >= 0.9 ? 'pos' : 'neg')) +
        `<div class="fb ${total >= 0.99 ? 'good' : total >= 0.9 ? 'good' : 'bad'}" style="margin-top:8px">${total >= 0.99 ? 'Цель 99% достигнута!' : total >= 0.9 ? 'Цель 90% достигнута. Попробуй дотянуть до 99%.' : 'Пока ниже 90%. Добавь серверы самому слабому модулю.'}</div>`;
    };
    const draw = () => {
      box.innerHTML = '';
      mods.forEach(m => {
        const val = h('b', {}, m.r + '%');
        const row = h('div', { class: 'mini', style: { marginBottom: '8px' } },
          h('div', { class: 'slider' }, h('div', { class: 'lab' }, h('span', {}, `Надёжность кода модуля ${m.name}`), val),
            h('input', { type: 'range', min: 50, max: 100, step: 5, value: m.r, oninput: e => { m.r = +e.target.value; val.textContent = m.r + '%'; calc(); } })),
          h('div', { class: 'row' }, m.srv.map((s, i) => h('button', { class: 'btn small', title: 'Убрать сервер', onclick: () => { m.srv.splice(i, 1); draw(); } }, '🖥 ' + s + ' ✕')),
            h('select', { style: { width: 'auto' }, onchange: e => { if (e.target.value) { m.srv.push(e.target.value); draw(); } } }, h('option', { value: '' }, '+ сервер'), Object.keys(SERVERS).map(s => h('option', { value: s }, s)))));
        box.append(row);
      });
      calc();
    };
    draw();
    el.append(h('div', { class: 'calc-grid' }, box, out),
      h('p', { class: 'muted', style: { fontSize: '13.5px', marginTop: '8px' } }, 'Надёжность копии модуля = надёжность кода × надёжность сервера. Копии одного модуля работают параллельно: модуль упадёт, только если упадут все копии. Модули соединены последовательно: система работает, только если работают все. По умолчанию стоит пример со слайда игры «Горизонтальное масштабирование» (≈59,5%).'));
  };

  // Девятки доступности
  W.nines = (el) => {
    const opts = [90, 99, 99.9, 99.99, 99.999, 99.9999];
    const sel = h('select', { style: { maxWidth: '240px' } }, opts.map(o => h('option', { value: o }, o.toLocaleString('ru-RU') + '%')));
    sel.value = '99.9';
    const out = h('div', { class: 'result-box' });
    const fmtDur = m => m >= 1440 ? (m / 1440).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' дн.' : m >= 60 ? (m / 60).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' ч' : m >= 1 ? m.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' мин' : (m * 60).toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' сек';
    const calc = () => { const a = +sel.value, down = 1 - a / 100; out.innerHTML = line('Простой в год', fmtDur(down * 525600)) + line('Простой в месяц', fmtDur(down * 43800)) + line('Простой в неделю', fmtDur(down * 10080)); };
    sel.onchange = calc; calc();
    el.append(h('div', { class: 'row' }, h('span', {}, 'Доступность (SLA):'), sel), out);
  };

  // NPS
  W.nps = (el) => {
    const s = { pro: 50, pas: 30, det: 20 };
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      const tot = s.pro + s.pas + s.det || 1, p = s.pro / tot * 100, d = s.det / tot * 100, nps = p - d;
      out.innerHTML = line('Промоутеры (9–10)', p.toFixed(0) + '%', 'pos') + line('Пассивы (7–8)', (s.pas / tot * 100).toFixed(0) + '%') + line('Детракторы (0–6)', d.toFixed(0) + '%', 'neg') + line('NPS = % промоутеров − % детракторов', (nps > 0 ? '+' : '') + nps.toFixed(0), 'total ' + (nps >= 0 ? 'pos' : 'neg'));
    };
    sliders(el, s, [['pro', 'Сколько ответили 9–10', 0, 100, 1, v => v + ' чел.'], ['pas', 'Сколько ответили 7–8', 0, 100, 1, v => v + ' чел.'], ['det', 'Сколько ответили 0–6', 0, 100, 1, v => v + ' чел.']], calc);
    calc(); el.append(out);
  };

  // Финальная игра: цвет эффективности рекламы
  W.adcolor = (el) => {
    const s = { price: 30, margin: 20, churn: 80, cpa: 20 };
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      const arpu = s.price * s.margin / 100, ltv = arpu / (s.churn / 100);
      const zone = s.cpa < arpu ? ['🟢 Зелёный', 'pos', 'Реклама окупается уже на первом платеже клиента.'] : s.cpa < ltv ? ['🟡 Жёлтый', '', 'Реклама окупится за несколько ходов, пока клиент платит.'] : ['🔴 Красный', 'neg', 'Прямой убыток: клиент за всю жизнь принесёт меньше, чем стоил.'];
      out.innerHTML = line('ARPU = цена × маржа (за ход)', arpu.toLocaleString('ru-RU', { maximumFractionDigits: 1 })) + line('LTV = ARPU ÷ отток', ltv.toLocaleString('ru-RU', { maximumFractionDigits: 1 })) + line('CPA', s.cpa) + line('Зона', zone[0], 'total ' + zone[1]) + `<div class="fb ${zone[1] === 'neg' ? 'bad' : 'good'}" style="margin-top:8px">${zone[2]}</div>`;
    };
    sliders(el, s, [['price', 'Цена подписки за ход', 10, 100, 5, v => v], ['margin', 'Маржа', 5, 80, 5, v => v + '%'], ['churn', 'Отток за ход', 10, 100, 5, v => v + '%'], ['cpa', 'CPA (цена привлечения клиента)', 1, 60, 1, v => v]], calc);
    calc(); el.append(out);
  };

  W.stages = (el, w) => {
    const detail = h('div', { class: 'stage-detail', html: w.placeholder || 'Нажми на элемент, чтобы увидеть описание.' });
    const wrap = h('div', { class: 'stages' });
    w.stages.forEach(st => {
      const b = h('button', { class: 'stage ' + (st.g || ''), onclick: () => { wrap.querySelectorAll('.stage').forEach(x => x.classList.remove('active')); b.classList.add('active'); detail.innerHTML = `<b>${st.name}</b><br>${st.text}`; } }, st.name);
      wrap.append(b);
    });
    if (w.legend) el.append(h('div', { class: 'mf-legend', html: w.legend }));
    el.append(wrap, detail);
  };

  W.leancanvas = (el) => {
    const blocks = [
      ['Problem<br>Проблема', 'r-product', '1/2', '1/3', '<b>Проблема (Problem).</b> 1–3 главные боли клиента. Здесь же <b>Existing Alternatives</b>: чем клиент решает задачу сейчас. Шаг 1 продуктового риска и шаг 1 рыночного.'],
      ['Solution<br>Решение', 'r-product', '2/3', '1/2', '<b>Решение (Solution).</b> Как закрываем каждую боль. Шаг 2 продуктового риска.'],
      ['Key Metrics<br>Метрики', 'r-product', '2/3', '2/3', '<b>Ключевые метрики (Key Metrics).</b> По каким цифрам поймём, что продукт работает. Шаг 4 продуктового риска.'],
      ['UVP<br>Уникальное ценностное предложение', 'r-product', '3/4', '1/3', '<b>UVP.</b> Одна фраза о том, чем мы лучше альтернатив. Шаг 3 продуктового риска. Обычно это <b>самое рискованное предположение</b> (его проверяют RAT).'],
      ['Unfair Advantage<br>Нечестное преимущество', 'r-none', '4/5', '1/2', '<b>Нечестное преимущество.</b> То, что конкурент не может быстро скопировать или купить.'],
      ['Channels<br>Каналы', 'r-customer', '4/5', '2/3', '<b>Каналы (Channels).</b> Как дотянемся до клиентов. Шаг 3 клиентского риска.'],
      ['Customer Segments<br>Сегменты / Early adopters', 'r-customer', '5/6', '1/3', '<b>Сегменты клиентов</b> (шаг 1) и <b>ранние последователи</b> (шаг 2): у кого боль сильнее всего и кто купит первым.'],
      ['Cost Structure<br>Расходы', 'r-market', '1/3', '3/4', '<b>Структура расходов.</b> Шаг 4 рыночного риска.'],
      ['Revenue Streams<br>Доходы', 'r-market', '3/6', '3/4', '<b>Потоки доходов.</b> Шаги 2–3 рыночного риска.']];
    const detail = h('div', { class: 'stage-detail', style: { marginTop: '10px' }, html: 'Нажми на блок шаблона.' });
    const grid = h('div', { class: 'lean' });
    blocks.forEach(([t, cls, col, row, txt]) => {
      const b = h('button', { class: cls, style: { gridColumn: col, gridRow: row }, html: t, onclick: () => { grid.querySelectorAll('button').forEach(x => x.classList.remove('active')); b.classList.add('active'); detail.innerHTML = txt; } });
      grid.append(b);
    });
    el.append(grid, h('div', { class: 'mf-legend', style: { marginTop: '8px' }, html: '<span style="color:#c97a2b">■</span> Продуктовый риск: проблема → решение → UVP → метрики &nbsp; <span style="color:#4f8fd6">■</span> Клиентский: сегменты → ранние последователи → каналы &nbsp; <span style="color:#a8b830">■</span> Рыночный: альтернативы → доходы → расходы' }), detail);
  };

  W.marketfit = (el) => {
    const N = 9;
    let mode = 'iter', vals, released, pendingAdd, pendingDel, moves, score, log, revealed, bigSel, over;
    const statsEl = h('div', { class: 'mf-stats' }), gridEl = h('div', { class: 'mf-grid' }), ctrl = h('div', { class: 'row', style: { justifyContent: 'center' } });
    const logEl = h('div', { class: 'mf-log' }), info = h('div', { class: 'fb', style: { display: 'none' } }), modeRow = h('div', { class: 'row', style: { marginBottom: '6px' } });
    const nb = i => { const r = Math.floor(i / N), c = i % N, a = []; if (r) a.push(i - N); if (r < N - 1) a.push(i + N); if (c) a.push(i - 1); if (c < N - 1) a.push(i + 1); return a; };
    function gen() {
      const v = new Array(N * N).fill(null); const shape = new Set([Math.floor(Math.random() * N * N)]);
      while (shape.size < 27) { const arr = [...shape]; const from = arr[Math.floor(Math.random() * arr.length)]; const ns = nb(from).filter(x => !shape.has(x)); if (ns.length) shape.add(ns[Math.floor(Math.random() * ns.length)]); }
      shape.forEach(i => v[i] = 1);
      shuffle([...Array(N * N).keys()].filter(i => !shape.has(i))).forEach((i, k) => v[i] = k < 27 ? 0 : -1);
      return v;
    }
    function reset() { vals = gen(); released = new Set(); pendingAdd = new Set(); pendingDel = new Set(); moves = 0; score = 0; log = []; revealed = false; bigSel = []; over = false; info.style.display = 'none'; draw(); }
    const current = () => { const s = new Set([...released, ...pendingAdd]); pendingDel.forEach(x => s.delete(x)); return s; };
    const canBuild = i => { const cur = current(); if (cur.has(i)) return false; if (!cur.size) return true; return nb(i).some(x => cur.has(x)); };
    const canBig = i => !bigSel.includes(i) && (!bigSel.length || nb(i).some(x => bigSel.includes(x)));
    function click(i) {
      if (over || revealed) return;
      if (mode === 'big') { if (bigSel.includes(i)) bigSel = []; else if (bigSel.length < 9 && canBig(i)) bigSel.push(i); draw(); return; }
      if (moves >= 40) return;
      const cur = current();
      if (cur.has(i)) { if (pendingAdd.has(i)) pendingAdd.delete(i); else pendingDel.add(i); moves++; }
      else if (canBuild(i)) { if (pendingDel.has(i)) pendingDel.delete(i); else pendingAdd.add(i); moves++; }
      else return;
      if (moves >= 40) finish();
      draw();
    }
    function release() {
      if (mode === 'big') {
        if (bigSel.length < 9) return;
        score = bigSel.reduce((s, i) => s + vals[i], 0); revealed = true; over = true;
        info.className = 'fb ' + (score > 0 ? 'good' : 'bad'); info.style.display = 'block';
        info.innerHTML = `Итог большого релиза: <b>${score > 0 ? '+' : ''}${score}</b>. Зелёная рамка: успешная гипотеза (+1), красная: вредная (−1), без рамки: пустышка (0). Угадать 9 фич вслепую почти невозможно, а узнаёшь об этом только в конце.`;
        draw(); return;
      }
      if (moves >= 40 || (!pendingAdd.size && !pendingDel.size)) return;
      moves++;
      let delta = 0; pendingAdd.forEach(i => delta += vals[i]); pendingDel.forEach(i => delta -= vals[i]);
      pendingAdd.forEach(i => released.add(i)); pendingDel.forEach(i => released.delete(i));
      const a = pendingAdd.size, r = pendingDel.size; pendingAdd = new Set(); pendingDel = new Set();
      score = [...released].reduce((s, i) => s + vals[i], 0);
      log.unshift(`Ход ${moves}: релиз (+${a} / −${r} фич) → результат <b>${delta > 0 ? '+' : ''}${delta}</b>, ценность продукта: <b>${score}</b>`);
      if (moves >= 40) finish();
      draw();
    }
    function finish() { over = true; info.className = 'fb good'; info.style.display = 'block'; info.innerHTML = `Ходы закончились. Ценность выпущенного продукта: <b>${score}</b>. Нажми «Открыть все», чтобы увидеть фигуру.`; }
    function draw() {
      modeRow.innerHTML = '';
      [['iter', 'Итеративные релизы (40 ходов)'], ['big', 'Большой релиз (9 фич сразу)']].forEach(([m, l]) => modeRow.append(h('button', { class: 'btn small' + (mode === m ? ' primary' : ''), onclick: () => { mode = m; reset(); } }, l)));
      statsEl.innerHTML = mode === 'iter'
        ? `<div class="mf-stat"><b>${score}</b><span>Ценность</span></div><div class="mf-stat"><b>${moves}/40</b><span>Ходы</span></div><div class="mf-stat"><b>+${pendingAdd.size}/−${pendingDel.size}</b><span>Не выпущено</span></div>`
        : `<div class="mf-stat"><b>${bigSel.length}/9</b><span>Выбрано</span></div><div class="mf-stat"><b>${revealed ? score : '?'}</b><span>Результат</span></div><div class="mf-stat"><b>1</b><span>Попытка</span></div>`;
      gridEl.innerHTML = '';
      const cur = current();
      for (let i = 0; i < N * N; i++) {
        let cls = 'mf-cell';
        if (mode === 'iter') {
          if (released.has(i) && !pendingDel.has(i)) cls += ' built';
          if (pendingAdd.has(i)) cls += ' pending';
          if (pendingDel.has(i)) cls += ' removing';
          if (!over && !cur.has(i) && canBuild(i) && cur.size) cls += ' can';
        } else {
          if (bigSel.includes(i)) cls += ' built'; else if (!revealed && bigSel.length && bigSel.length < 9 && canBig(i)) cls += ' can';
        }
        if (revealed) cls += ' v' + vals[i];
        gridEl.append(h('button', { class: cls, onclick: () => click(i), 'aria-label': 'Клетка ' + (i + 1) }, revealed ? (vals[i] > 0 ? '+1' : String(vals[i])) : ''));
      }
      ctrl.innerHTML = '';
      ctrl.append(
        h('button', { class: 'btn primary', onclick: release, disabled: mode === 'big' ? (bigSel.length < 9 || revealed) : (over || (!pendingAdd.size && !pendingDel.size)) }, mode === 'big' ? 'Выпустить большой релиз' : 'Выпустить релиз (1 ход)'),
        h('button', { class: 'btn', onclick: () => { revealed = !revealed; draw(); } }, revealed ? 'Скрыть' : 'Открыть все'),
        h('button', { class: 'btn', onclick: reset }, 'Начать заново'));
      logEl.innerHTML = mode === 'iter' ? (log.join('<br>') || 'Здесь будет история релизов.') : 'В режиме «Большой релиз» обратная связь только в самом конце.';
    }
    el.append(modeRow, statsEl,
      h('div', { class: 'mf-legend', html: 'Поле 9×9: треть клеток успешные (+1) и образуют <b>одну связную фигуру</b>, треть пустышки (0), треть вредные (−1). Клик по клетке добавляет фичу (1 ход), клик по своей фиче удаляет её (1 ход), релиз тоже стоит 1 ход. Новые фичи ставятся только рядом с уже сделанными. Видно только <b>суммарный результат релиза</b>.' }),
      gridEl, ctrl, info, logEl,
      h('div', { class: 'callout tip', style: { marginTop: '10px' }, html: '<span class="kind">💡 Стратегия</span>Выпускай релиз после каждой 1–2 фич: так видно, какая фича дала +1 или −1. Вредные фичи удаляй и расти туда, где был плюс: успешные клетки касаются друг друга.' }));
    reset();
  };

  // ---------- тест ----------
  function renderQuiz(cfg) {
    const sec = h('section', { class: 'card quiz-card', id: 'quiz' });
    const scoreBar = h('div', { class: 'quiz-score' }), list = h('div'), banner = h('div');
    let state, qs;
    const start = (only) => {
      qs = only || cfg.pool();
      state = { answered: 0, right: 0, wrong: [], retry: !!only };
      list.innerHTML = ''; banner.innerHTML = '';
      qs.forEach((q, qi) => list.append(renderQ(q, qi, qs.length)));
      upd();
    };
    const upd = () => {
      const total = qs.length;
      scoreBar.innerHTML = '';
      scoreBar.append(h('span', {}, `Отвечено ${state.answered}/${total} · верно ${state.right}`), h('span', { class: 'meter' }, h('i', { style: { width: Math.round(state.answered / total * 100) + '%' } })),
        h('button', { class: 'btn small', onclick: () => { start(); sec.scrollIntoView(); } }, cfg.exam ? 'Новый вариант' : 'Заново'));
      if (state.answered === total) {
        const pct = Math.round(state.right / total * 100);
        const pass = cfg.exam ? state.right >= EXAM_PASS : pct >= 70;
        const isFull = !state.retry;
        if (isFull) { const prev = best(cfg.key); if (!prev || prev.score < state.right) store.set('pd-quiz-' + cfg.key, { score: state.right, total, pct }); }
        renderTabs(cfg.exam ? 'exam' : cfg.key);
        banner.innerHTML = '';
        banner.append(h('div', { class: 'result-banner ' + (pass ? 'pass' : 'fail') },
          h('b', { class: 'big' }, `${state.right} из ${total}`),
          h('div', { html: cfg.exam ? (pass ? '🎉 Зачёт сдан! Нужно было 15, у тебя ' + state.right + '.' : `Пока не хватает ${EXAM_PASS - state.right} правильных до 15. Посмотри, из каких тем ошибки, и повтори их.`) : (pass ? '🎉 Тема засчитана (70% и больше).' : 'Перечитай шпаргалку и попробуй ещё раз.') }),
          state.wrong.length ? h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn primary', onclick: () => { start(shuffle(state.wrong)); sec.scrollIntoView(); } }, `🔁 Повторить только ошибки (${state.wrong.length})`)) : null));
      }
    };
    function renderQ(q, qi, total) {
      const box = h('div', { class: 'quiz-q' }, h('div', { class: 'qn' }, `ВОПРОС ${qi + 1} ИЗ ${total}`, q.src ? h('span', { class: 'src' }, q.src) : null), h('div', { class: 'qt', html: q.q }));
      const opts = h('div', { class: 'opts' }), extra = h('div');
      shuffle(q.opts.map((o, i) => i)).forEach((i, pos) => {
        const b = h('button', { class: 'opt', onclick: () => {
          if (box.classList.contains('answered')) return;
          box.classList.add('answered'); state.answered++;
          const ok = i === q.a;
          if (ok) state.right++; else state.wrong.push(q);
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) opts.querySelector(`[data-i="${q.a}"]`).classList.add('right');
          const why = q.why && q.why[i] ? `<p style="margin:4px 0 0"><b>Почему этот вариант неверен:</b> ${q.why[i]}</p>` : '';
          extra.append(h('div', { class: 'explain ' + (ok ? 'good' : 'bad'), html: ok ? `<span class="h">✓ Верно!</span>${q.explain}` : `<span class="h">✗ Ошибка. Правильно: «${q.opts[q.a]}»</span>${why}<p style="margin:4px 0 0"><b>Объяснение:</b> ${q.explain}</p>` }));
          upd();
        } }, h('span', { class: 'letter' }, 'АБВГДЕ'[pos]), h('span', { html: q.opts[i] }));
        b.dataset.i = i; opts.append(b);
      });
      box.append(opts);
      if (q.hint) { const hb = h('button', { class: 'hint-btn', onclick: () => hb.replaceWith(h('div', { class: 'hint', html: '💡 ' + q.hint })) }, '💡 Показать подсказку'); box.append(hb); }
      box.append(extra);
      return box;
    }
    sec.append(h('h2', {}, cfg.title), h('p', { class: 'muted', style: { fontSize: '15.5px' } }, cfg.desc || 'Выбирай ответ. Если ошибёшься, сразу увидишь правильный вариант и объяснение. Подсказку можно открыть до ответа. В конце можно повторить только ошибки.'), list, banner, scoreBar);
    start();
    return sec;
  }

  // ---------- пробный зачёт ----------
  function renderExam() {
    const ready = TOPICS.filter(t => !t.soon && t.quiz);
    const pool = () => {
      const per = Math.floor(EXAM_N / ready.length); let rest = EXAM_N - per * ready.length;
      let out = [];
      shuffle(ready).forEach(t => { const n = per + (rest-- > 0 ? 1 : 0); out = out.concat(shuffle(t.quiz).slice(0, n).map(q => Object.assign({}, q, { src: 'Тема ' + t.id }))); });
      return shuffle(out);
    };
    app.append(h('div', { class: 'topic-hero' }, h('p', { class: 'eyebrow' }, 'Формат настоящего зачёта'), h('h1', {}, '🎯 Пробный зачёт'),
      h('p', { class: 'lead' }, `${EXAM_N} случайных вопросов из всех готовых тем (сейчас их ${ready.length}). Чтобы сдать, нужно ${EXAM_PASS} правильных. Над каждым вопросом видно, из какой он темы: так понятно, что повторить.`)),
      renderQuiz({ key: 'exam', exam: true, title: 'Вопросы', desc: 'Подсказки есть, но на настоящем зачёте их не будет. Попробуй сначала без них.', pool }));
  }

  route();
})();
