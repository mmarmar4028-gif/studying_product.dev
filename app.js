/* Движок сайта: навигация, рендер тем, интерактивные виджеты, тесты */
(function () {
  const TOPICS = (window.TOPICS || []).slice().sort((a, b) => a.id - b.id);
  const app = document.getElementById('app');
  const tabs = document.getElementById('tabs');

  // ---------- хранилище (безопасно) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- тема ----------
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = store.get('pd-theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.onclick = () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
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
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
    return el;
  };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
  const fmtMoney = (n) => n >= 1e6 ? (n / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' млн ₽' : fmt(n) + ' ₽';
  const best = (id) => store.get('pd-quiz-' + id, null);

  // ---------- навигация ----------
  function renderTabs(active) {
    tabs.innerHTML = '';
    tabs.append(h('a', { href: '#/', class: 'tab' + (active === 'home' ? ' active' : '') }, 'Главная'));
    TOPICS.forEach(t => {
      const b = best(t.id);
      const a = h('a', { href: '#/topic/' + t.id, class: 'tab' + (active === t.id ? ' active' : '') + (t.soon ? ' soon' : '') },
        b && b.pct >= 70 ? h('span', { class: 'dot', title: 'Тест пройден' }) : null, `${t.id}. ${t.short}`);
      tabs.append(a);
    });
    const act = tabs.querySelector('.active');
    if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function route() {
    const m = location.hash.match(/^#\/topic\/(\d+)/);
    app.innerHTML = '';
    if (m) {
      const t = TOPICS.find(x => x.id === +m[1]);
      if (t) { renderTabs(t.id); renderTopic(t); }
      else { renderTabs('home'); renderHome(); }
    } else { renderTabs('home'); renderHome(); }
    const anchor = location.hash.split('#')[2];
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
    else window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- главная ----------
  function renderHome() {
    const ready = TOPICS.filter(t => !t.soon);
    app.append(
      h('section', { class: 'hero' },
        h('p', { class: 'eyebrow' }, 'Подготовка к зачёту'),
        h('h1', {}, 'Разработка программного продукта'),
        h('p', { class: 'lead' }, 'От идеи до релиза: как создавать продукты, которые нужны людям. Здесь собран весь курс по темам. В каждой теме сначала идёт короткое «что изучим», потом объяснение по шагам, формулы с разбором, интерактивные задания и тест с объяснением ошибок.')
      ),
      h('div', { class: 'card summary' },
        h('h2', {}, 'Как устроен зачёт'),
        h('ul', { html: '<li>Итоговый тест из <b>24 вопросов</b>.</li><li>Проходной балл: <b>15 правильных ответов</b> (≈ 63%).</li><li>На каждом занятии есть деловая игра. <b>Топ-10</b> игроков занятия получают награду: <b>3 автоматических «плюса»</b> на вопросы зачёта по выбору. На первом занятии было «топ-20%», со второго правило смягчили до «топ-10».</li><li>Посещения не отмечаются, но кого нет на занятии, тот не участвует в игре за награду.</li>' }),
        h('div', { class: 'callout tip', html: '<span class="ttl">Как заниматься</span>Иди по темам по порядку: каждая следующая опирается на предыдущую. Сначала прочитай теорию, потом выполни задания и тест. Тест засчитан, если набрано 70% и больше; тогда вкладка темы получает зелёную точку. Игры профессора для практики лежат на <a href="https://productgamer.ru/" target="_blank" rel="noopener">productgamer.ru</a>. Ссылка на нужную игру есть в каждой теме.' })
      ),
      h('div', { class: 'card' },
        h('h2', {}, 'Карта курса'),
        h('p', { html: 'Метафора, на которой построен курс: продукт должен быть <b>правильной вещью</b> (нужен людям и выгоден) и должен быть <b>сделан правильно</b> (хорошим процессом и с хорошими техническими практиками).' }),
        (() => { const m = h('div', { class: 'matrix' });
          m.innerHTML ='<div class="lbl">Делать правильные вещи</div><div class="cell">Продуктовое мышление</div><div class="cell">Экономика продукта</div><div class="lbl">Делать вещи правильно</div><div class="cell">Процесс разработки</div><div class="cell">Технические практики разработки</div>';
          return m; })()
      ),
      h('h2', { style: 'margin-top:26px' }, 'Темы'),
      (() => {
        const g = h('div', { class: 'topic-grid' });
        TOPICS.forEach(t => {
          const b = best(t.id);
          g.append(h('a', { href: '#/topic/' + t.id, class: 'topic-card' + (t.soon ? ' soon' : '') },
            h('div', { class: 'n' }, `ТЕМА ${t.id}` + (t.soon ? ' · скоро' : '')),
            h('div', { class: 't' }, t.title),
            h('div', { class: 's' }, t.soon ? 'Появится, когда будет загружена презентация' : (b ? `Лучший результат теста: ${b.score}/${b.total}` : 'Тест ещё не пройден')),
            h('div', { class: 'bar' }, h('i', { style: `width:${b ? b.pct : 0}%` }))
          ));
        });
        return g;
      })(),
      h('p', { class: 'muted', style: 'margin-top:14px;font-size:14px' }, `Готово тем: ${ready.length} из 8.`)
    );
  }

  // ---------- страница темы ----------
  function renderTopic(t) {
    if (t.soon) {
      app.append(h('p', { class: 'eyebrow' }, `Тема ${t.id}`), h('h1', {}, t.title),
        h('div', { class: 'card' }, h('p', {}, 'Эта тема появится, когда будет загружена соответствующая презентация.'),
          t.game ? h('p', { html: `Игра к теме, скорее всего: <a href="${t.game.url}" target="_blank" rel="noopener">${t.game.name}</a>.` }) : null));
      return;
    }
    const secs = t.sections;
    app.append(
      h('p', { class: 'eyebrow' }, `Тема ${t.id} · ${t.lecture}`),
      h('h1', {}, t.title),
      t.subtitle ? h('p', { class: 'lead' }, t.subtitle) : null,
      h('div', { class: 'card summary' },
        h('h2', {}, 'Что мы изучим'),
        h('p', { html: t.summary.intro }),
        h('ol', {}, t.summary.points.map(p => h('li', { html: p }))),
        h('div', { class: 'toc' }, secs.map((s, i) => h('a', { href: `#/topic/${t.id}#s${i + 1}` }, `${i + 1}. ${s.title}`)),
          h('a', { href: `#/topic/${t.id}#cheat` }, 'Шпаргалка'), h('a', { href: `#/topic/${t.id}#quiz` }, 'Тест'))
      )
    );
    secs.forEach((s, i) => {
      const card = h('section', { class: 'card', id: 's' + (i + 1) },
        h('div', { class: 'step-label' }, `Шаг ${i + 1} из ${secs.length}`),
        h('h2', {}, h('span', { class: 'num' }, String(i + 1)), s.title));
      s.blocks.forEach(b => card.append(renderBlock(b)));
      app.append(card);
    });
    if (t.cheatsheet) {
      app.append(h('section', { class: 'card summary', id: 'cheat' }, h('h2', {}, 'Шпаргалка: главное за 2 минуты'),
        h('ul', {}, t.cheatsheet.map(c => h('li', { html: c })))));
    }
    if (t.game) {
      app.append(h('div', { class: 'card game-link' },
        h('div', {}, h('b', {}, '🎮 Практика в игре профессора: ' + t.game.name), h('div', { class: 'muted', style: 'font-size:14px', html: t.game.text })),
        h('a', { class: 'btn primary', href: t.game.url, target: '_blank', rel: 'noopener' }, 'Открыть игру')));
    }
    app.append(renderQuiz(t));
    const idx = TOPICS.indexOf(t);
    const prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
    app.append(h('div', { class: 'pager' },
      prev ? h('a', { class: 'btn', href: '#/topic/' + prev.id }, '← ' + prev.short) : h('span'),
      next ? h('a', { class: 'btn', href: '#/topic/' + next.id }, next.short + ' →') : h('span')));
  }

  function renderBlock(b) {
    switch (b.type) {
      case 'html': return h('div', { html: b.html });
      case 'callout': return h('div', { class: 'callout ' + (b.kind || 'tip'), html: (b.title ? `<span class="ttl">${b.title}</span>` : '') + b.html });
      case 'formula': return renderFormula(b);
      case 'widget': return renderWidget(b);
      default: return h('div');
    }
  }

  function renderFormula(f) {
    return h('div', { class: 'formula' },
      f.name ? h('div', { class: 'step-label' }, '📐 Формула: ' + f.name) : null,
      h('div', { class: 'expr', html: f.expr }),
      h('div', { class: 'parts' }, f.parts.map(([s, d]) => h('div', { class: 'part' }, h('span', { class: 'sym', html: s }), h('span', { html: d })))),
      f.why ? h('div', { class: 'why', html: '<b>Зачем нужна:</b> ' + f.why }) : null,
      f.example ? h('div', { class: 'why', style: 'margin-top:6px', html: '<b>Пример:</b> ' + f.example }) : null);
  }

  // ---------- виджеты ----------
  const WIDGETS = {};
  function renderWidget(w) {
    const box = h('div', { class: 'widget' },
      h('div', { class: 'widget-head' }, h('span', { class: 'tag' }, 'Интерактив'), h('h3', {}, w.title)),
      w.intro ? h('p', { class: 'muted', style: 'font-size:15px', html: w.intro }) : null);
    const body = h('div');
    box.append(body);
    (WIDGETS[w.kind] || (() => body.append('Нет виджета ' + w.kind)))(body, w);
    return box;
  }

  WIDGETS.flashcards = (el, w) => {
    el.append(h('div', { class: 'cards' }, w.cards.map(([f, b]) => {
      const c = h('div', { class: 'flash', onclick: () => c.classList.toggle('flipped') },
        h('div', { class: 'flash-inner' }, h('div', { class: 'flash-face flash-front' }, f), h('div', { class: 'flash-face flash-back', html: b })));
      return c;
    })));
  };

  WIDGETS.classify = (el, w) => {
    let done = 0, right = 0;
    const score = h('div', { class: 'muted', style: 'font-size:14px;margin-top:8px' });
    const upd = () => score.textContent = `Отвечено ${done} из ${w.items.length}, верно ${right}.`;
    const list = h('div');
    shuffle(w.items).forEach(it => {
      const row = h('div', { class: 'cls-item' }, h('div', { class: 'cls-text', html: it.text }));
      const btns = h('div', { class: 'row' });
      const fbBox = h('div');
      w.buckets.forEach(bk => {
        const btn = h('button', { class: 'btn small', onclick: () => {
          if (row.classList.contains('done')) return;
          row.classList.add('done'); done++;
          const ok = bk === it.bucket;
          if (ok) right++;
          btn.classList.add(ok ? 'right' : 'wrong');
          if (!ok) [...btns.children].find(b => b.textContent === it.bucket).classList.add('right');
          fbBox.append(h('div', { class: 'fb ' + (ok ? 'good' : 'bad'), html: (ok ? '✓ Верно.' : `✗ Неверно, правильно: «${it.bucket}».`) + (it.why ? `<span class="why">${it.why}</span>` : '') }));
          upd();
        } }, bk);
        btns.append(btn);
      });
      row.append(btns, fbBox);
      list.append(row);
    });
    upd();
    el.append(list, score);
  };

  WIDGETS.order = (el, w) => {
    const pool = h('div', { class: 'order-pool' }), picked = h('div', { class: 'order-picked' });
    const fb = h('div');
    let order = [];
    const draw = () => {
      pool.innerHTML = ''; picked.innerHTML = '';
      shuffled.forEach(x => { if (!order.includes(x)) pool.append(h('button', { class: 'order-chip', onclick: () => { order.push(x); fb.innerHTML = ''; draw(); } }, x)); });
      order.forEach((x, i) => picked.append(h('button', { class: 'order-chip', title: 'Убрать', onclick: () => { order.splice(i, 1); fb.innerHTML = ''; draw(); } }, `${i + 1}. ${x}`)));
      if (!order.length) picked.append(h('div', { class: 'muted', style: 'font-size:14px' }, 'Нажимай на пункты слева в правильном порядке'));
    };
    let shuffled = shuffle(w.items);
    const check = () => {
      if (order.length < w.items.length) { fb.innerHTML = '<div class="fb bad">Сначала расставь все пункты.</div>'; return; }
      let ok = 0;
      [...picked.children].forEach((c, i) => { const r = order[i] === w.items[i]; if (r) ok++; c.classList.add(r ? 'ok' : 'no'); });
      fb.innerHTML = ok === w.items.length
        ? `<div class="fb good">✓ Всё верно!${w.explain ? `<span class="why">${w.explain}</span>` : ''}</div>`
        : `<div class="fb bad">На своём месте ${ok} из ${w.items.length}. Правильный порядок: ${w.items.map((x, i) => `<b>${i + 1}.</b> ${x}`).join(' → ')}${w.explain ? `<span class="why">${w.explain}</span>` : ''}</div>`;
    };
    draw();
    el.append(h('div', { class: 'order-cols' }, h('div', {}, h('div', { class: 'col-title' }, 'Пункты'), pool), h('div', {}, h('div', { class: 'col-title' }, 'Твой порядок'), picked)),
      h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn primary', onclick: check }, 'Проверить'), h('button', { class: 'btn', onclick: () => { order = []; shuffled = shuffle(w.items); fb.innerHTML = ''; draw(); } }, 'Заново')), fb);
  };

  WIDGETS.match = (el, w) => {
    const options = [...new Set(w.pairs.map(p => p[1]))];
    const rows = shuffle(w.pairs).map(([l, r, why]) => {
      const sel = h('select', {}, h('option', { value: '' }, '— выбери —'), shuffle(options).map(o => h('option', { value: o }, o)));
      const fb = h('div');
      const row = h('div', {}, h('div', { class: 'match-row' }, h('div', { html: l }), sel), fb);
      return { row, sel, r, fb, why };
    });
    const res = h('div');
    el.append(...rows.map(x => x.row), h('div', { class: 'row', style: 'margin-top:10px' },
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

  WIDGETS.burnrate = (el) => {
    const s = { cost: 500000, team: 10, iters: 10, weeks: 2, success: 10 };
    const defs = [
      ['cost', 'Стоимость 1 человека в месяц, ₽', 100000, 1000000, 50000, v => fmt(v) + ' ₽'],
      ['team', 'Размер команды, чел.', 1, 30, 1, v => v],
      ['iters', 'Число итераций (спринтов)', 1, 20, 1, v => v],
      ['weeks', 'Длина итерации, недель', 1, 4, 1, v => v],
      ['success', 'Доля успешных гипотез, %', 5, 100, 5, v => v + '%']
    ];
    const out = h('div', { class: 'result-box' });
    const calc = () => {
      const burn = s.cost * s.team;
      const months = s.iters * s.weeks / 4;
      const check = burn * months;
      const perSuccess = check / (s.success / 100);
      out.innerHTML = `
        <div class="result-line"><span>Burn rate = ${fmt(s.cost)} × ${s.team}</span><b>${fmtMoney(burn)} / мес</b></div>
        <div class="result-line"><span>Время проверки = ${s.iters} × ${s.weeks} нед.</span><b>${s.iters * s.weeks} нед. ≈ ${months.toLocaleString('ru-RU')} мес.</b></div>
        <div class="result-line"><span>Стоимость проверки 1 гипотезы</span><b>${fmtMoney(check)}</b></div>
        <div class="result-line"><span>Сколько потратим, пока найдём 1 удачную (÷ ${s.success}%)</span><b class="big">${fmtMoney(perSuccess)}</b></div>`;
    };
    defs.forEach(([k, label, min, max, step, f]) => {
      const val = h('b', {}, f(s[k]));
      const inp = h('input', { type: 'range', min, max, step, value: s[k], oninput: (e) => { s[k] = +e.target.value; val.textContent = f(s[k]); calc(); } });
      el.append(h('div', { class: 'slider' }, h('div', { class: 'lab' }, h('span', {}, label), val), inp));
    });
    calc();
    el.append(out, h('p', { class: 'muted', style: 'font-size:13.5px;margin-top:8px' }, 'Цифры по умолчанию взяты из лекции: 500 000 ₽ × 10 человек, 10 спринтов по 2 недели, успешна 1 гипотеза из 10. Подвигай ползунки: что сильнее всего снижает итоговую сумму?'));
  };

  WIDGETS.hypothesis = (el, w) => {
    const fields = [
      ['aud', 'Аудитория', 'для кого? чёткий сегмент', 'Пользователи приложения, которые добавили товар в корзину, но не оплатили его в течение 2 часов'],
      ['prob', 'Проблема', 'какая боль или закономерность', 'забывают о покупке или сомневаются в итоговой стоимости'],
      ['sol', 'Решение', 'конкретная фича или изменение', 'отправим push-уведомление с напоминанием и небольшой скидкой на доставку'],
      ['res', 'Ожидаемый результат', 'как изменится поведение', 'пользователи вернутся в приложение и завершат оформление заказа'],
      ['met', 'Метрика успеха', 'число + метрика + срок', 'конверсия из корзины в покупку вырастет на 5% за 2 недели эксперимента']
    ];
    const vals = {};
    const out = h('div', { class: 'out-sentence' });
    const fb = h('div');
    const draw = () => {
      const v = k => vals[k] && vals[k].trim() ? `<b>${vals[k].trim()}</b>` : `<span class="muted">[${fields.find(f => f[0] === k)[1].toLowerCase()}]</span>`;
      out.innerHTML = `${v('aud')} сталкиваются с проблемой: ${v('prob')}. Если мы ${v('sol')}, то ${v('res')}, в результате чего ${v('met')}.`;
    };
    const inputs = {};
    fields.forEach(([k, label, hint]) => {
      const ta = h('textarea', { placeholder: hint, oninput: e => { vals[k] = e.target.value; draw(); fb.innerHTML = ''; } });
      inputs[k] = ta;
      el.append(h('div', { class: 'field' }, h('label', { html: `${label} <small>${hint}</small>` }), ta));
    });
    const check = () => {
      const issues = [];
      fields.forEach(([k, l]) => { if (!vals[k] || vals[k].trim().length < 4) issues.push(`Не заполнено поле «${l}».`); });
      const m = vals.met || '';
      if (m && !/\d/.test(m)) issues.push('В метрике нет числа. Без конкретной цифры (например «на 5%») не получится понять, подтвердилась гипотеза или нет.');
      if (m && !/(день|дн|недел|месяц|мес|час|квартал|год|срок)/i.test(m)) issues.push('В метрике не указан срок эксперимента (например «за 2 недели»).');
      if ((vals.aud || '').trim().split(/\s+/).length < 3 && vals.aud) issues.push('Аудитория описана слишком широко. Нужен узкий сегмент, например «пользователи, которые…».');
      fb.innerHTML = issues.length
        ? `<div class="fb bad">Пока это скорее <b>идея</b>, а не гипотеза:<span class="why">${issues.map(i => '• ' + i).join('<br>')}</span></div>`
        : '<div class="fb good">✓ Все 5 частей на месте, метрика измеримая и со сроком. Это настоящая проверяемая гипотеза!</div>';
    };
    draw();
    el.append(out, h('div', { class: 'row', style: 'margin-top:10px' },
      h('button', { class: 'btn primary', onclick: check }, 'Проверить гипотезу'),
      h('button', { class: 'btn', onclick: () => { fields.forEach(([k, , , ex]) => { vals[k] = ex; inputs[k].value = ex; }); draw(); fb.innerHTML = ''; } }, 'Показать пример из лекции'),
      h('button', { class: 'btn', onclick: () => { fields.forEach(([k]) => { vals[k] = ''; inputs[k].value = ''; }); draw(); fb.innerHTML = ''; } }, 'Очистить')), fb);
  };

  WIDGETS.stages = (el, w) => {
    const detail = h('div', { class: 'stage-detail', html: w.placeholder || 'Нажми на этап, чтобы увидеть описание.' });
    const wrap = h('div', { class: 'stages' });
    w.stages.forEach(st => {
      const b = h('button', { class: 'stage ' + (st.g || ''), onclick: () => { wrap.querySelectorAll('.stage').forEach(x => x.classList.remove('active')); b.classList.add('active'); detail.innerHTML = `<b>${st.name}</b><br>${st.text}`; } }, st.name);
      wrap.append(b);
    });
    if (w.legend) el.append(h('div', { class: 'mf-legend', html: w.legend }));
    el.append(wrap, detail);
  };

  WIDGETS.leancanvas = (el) => {
    const blocks = [
      ['Problem<br>Проблема', 'r-product', '1/2', '1/3', '<b>Проблема (Problem).</b> 1–3 главные боли клиента. Здесь же блок <b>Existing Alternatives</b>: чем клиент решает задачу сейчас. Шаг 1 продуктового риска и шаг 1 рыночного риска.'],
      ['Solution<br>Решение', 'r-product', '2/3', '1/2', '<b>Решение (Solution).</b> Как мы закрываем каждую боль. Шаг 2 продуктового риска.'],
      ['Key Metrics<br>Метрики', 'r-product', '2/3', '2/3', '<b>Ключевые метрики (Key Metrics).</b> По каким цифрам поймём, что продукт работает. Шаг 4 продуктового риска.'],
      ['UVP<br>Уникальное ценностное предложение', 'r-product', '3/4', '1/3', '<b>UVP (Unique Value Proposition).</b> Одна ясная фраза о том, чем мы лучше альтернатив. Шаг 3 продуктового риска. Обычно это и есть <b>самое рискованное предположение</b> (его проверяют RAT-подходом).'],
      ['Unfair Advantage<br>Нечестное преимущество', 'r-none', '4/5', '1/2', '<b>Нечестное преимущество (Unfair Advantage).</b> То, что конкурент не может быстро скопировать или купить: уникальные данные, команда, сообщество, патенты.'],
      ['Channels<br>Каналы', 'r-customer', '4/5', '2/3', '<b>Каналы (Channels).</b> Как мы дотянемся до клиентов. Шаг 3 клиентского риска.'],
      ['Customer Segments<br>Сегменты / Early adopters', 'r-customer', '5/6', '1/3', '<b>Сегменты клиентов (Customer Segments)</b>, шаг 1, и <b>ранние последователи (Early Adopters)</b>, шаг 2: те, у кого боль сильнее всего и кто купит первым.'],
      ['Cost Structure<br>Расходы', 'r-market', '1/3', '3/4', '<b>Структура расходов (Cost Structure).</b> Сколько стоит делать и продвигать продукт. Шаг 4 рыночного риска.'],
      ['Revenue Streams<br>Доходы', 'r-market', '3/6', '3/4', '<b>Потоки доходов (Revenue Streams).</b> За что и сколько платят клиенты. Шаги 2–3 рыночного риска.']
    ];
    const detail = h('div', { class: 'stage-detail', style: 'margin-top:10px', html: 'Нажми на блок шаблона.' });
    const grid = h('div', { class: 'lean' });
    blocks.forEach(([t, cls, col, row, txt]) => {
      const b = h('button', { class: cls, style: `grid-column:${col};grid-row:${row}`, html: t, onclick: () => { grid.querySelectorAll('button').forEach(x => x.classList.remove('active')); b.classList.add('active'); detail.innerHTML = txt; } });
      grid.append(b);
    });
    el.append(grid, h('div', { class: 'mf-legend', style: 'margin-top:8px', html: '<span style="color:#c97a2b">■</span> Продуктовый риск: Проблема → Решение → UVP → Метрики &nbsp; <span style="color:#4f8fd6">■</span> Клиентский риск: Сегменты → Ранние последователи → Каналы &nbsp; <span style="color:#a8b830">■</span> Рыночный риск: Альтернативы → Доходы → Расходы' }), detail);
  };

  // ----- Игра Market Fit (упрощённая тренировка) -----
  WIDGETS.marketfit = (el) => {
    const N = 9;
    let mode = 'iter', vals, built, released, pendingAdd, pendingDel, moves, score, log, revealed, bigSel, over;
    const statsEl = h('div', { class: 'mf-stats' });
    const gridEl = h('div', { class: 'mf-grid' });
    const ctrl = h('div', { class: 'row', style: 'justify-content:center' });
    const logEl = h('div', { class: 'mf-log' });
    const info = h('div', { class: 'fb', style: 'display:none' });
    const modeRow = h('div', { class: 'row', style: 'margin-bottom:6px' });
    const key = (r, c) => r * N + c;
    const nb = i => { const r = Math.floor(i / N), c = i % N, a = []; if (r) a.push(i - N); if (r < N - 1) a.push(i + N); if (c) a.push(i - 1); if (c < N - 1) a.push(i + 1); return a; };
    function gen() {
      const v = new Array(N * N).fill(null);
      const target = 27; const shape = new Set([Math.floor(Math.random() * N * N)]);
      while (shape.size < target) { const arr = [...shape]; const from = arr[Math.floor(Math.random() * arr.length)]; const ns = nb(from).filter(x => !shape.has(x)); if (ns.length) shape.add(ns[Math.floor(Math.random() * ns.length)]); }
      shape.forEach(i => v[i] = 1);
      const rest = shuffle([...Array(N * N).keys()].filter(i => !shape.has(i)));
      rest.forEach((i, k) => v[i] = k < 27 ? 0 : -1);
      return v;
    }
    function reset() {
      vals = gen(); built = new Set(); released = new Set(); pendingAdd = new Set(); pendingDel = new Set();
      moves = 0; score = 0; log = []; revealed = false; bigSel = []; over = false;
      info.style.display = 'none';
      draw();
    }
    const current = () => { const s = new Set([...released, ...pendingAdd]); pendingDel.forEach(x => s.delete(x)); return s; };
    function canBuild(i) {
      const cur = current();
      if (cur.has(i)) return false;
      if (cur.size === 0) return true;
      return nb(i).some(x => cur.has(x));
    }
    function canBig(i) { if (bigSel.includes(i)) return false; if (!bigSel.length) return true; return nb(i).some(x => bigSel.includes(x)); }
    function click(i) {
      if (over || revealed) return;
      if (mode === 'big') {
        if (bigSel.includes(i)) { bigSel = []; } // сброс, чтобы фигура не разрывалась
        else if (bigSel.length < 9 && canBig(i)) bigSel.push(i);
        draw(); return;
      }
      if (moves >= 40) return;
      const cur = current();
      if (cur.has(i)) { // удалить фичу
        if (pendingAdd.has(i)) pendingAdd.delete(i); else pendingDel.add(i);
        moves++;
      } else if (canBuild(i)) {
        if (pendingDel.has(i)) pendingDel.delete(i); else pendingAdd.add(i);
        moves++;
      } else return;
      if (moves >= 40) finish();
      draw();
    }
    function release() {
      if (mode === 'big') {
        if (bigSel.length < 9) return;
        score = bigSel.reduce((s, i) => s + vals[i], 0); revealed = true; over = true;
        info.className = 'fb ' + (score > 0 ? 'good' : 'bad'); info.style.display = 'block';
        info.innerHTML = `Итог большого релиза: <b>${score > 0 ? '+' : ''}${score}</b>. Зелёная рамка: успешная гипотеза (+1), красная: вредная (−1), без рамки: пустышка (0). Вывод: угадать 9 фич вслепую почти невозможно, а узнаёшь об этом только в самом конце.`;
        draw(); return;
      }
      if (moves >= 40 || (!pendingAdd.size && !pendingDel.size)) return;
      moves++;
      let delta = 0; pendingAdd.forEach(i => delta += vals[i]); pendingDel.forEach(i => delta -= vals[i]);
      pendingAdd.forEach(i => released.add(i)); pendingDel.forEach(i => released.delete(i));
      const added = pendingAdd.size, removed = pendingDel.size;
      pendingAdd = new Set(); pendingDel = new Set();
      score = [...released].reduce((s, i) => s + vals[i], 0);
      log.unshift(`Ход ${moves}: релиз (+${added} фич, −${removed} фич) → результат релиза <b>${delta > 0 ? '+' : ''}${delta}</b>, ценность продукта: <b>${score}</b>`);
      if (moves >= 40) finish();
      draw();
    }
    function finish() { over = true; info.className = 'fb good'; info.style.display = 'block'; info.innerHTML = `Ходы закончились. Итоговая ценность выпущенного продукта: <b>${score}</b>. Невыпущенные изменения не считаются. Нажми «Открыть все», чтобы посмотреть, где была успешная фигура.`; }
    function draw() {
      modeRow.innerHTML = '';
      [['iter', 'Итеративные релизы (40 ходов)'], ['big', 'Большой релиз (9 фич сразу)']].forEach(([m, l]) => modeRow.append(h('button', { class: 'btn small' + (mode === m ? ' primary' : ''), onclick: () => { mode = m; reset(); } }, l)));
      if (mode === 'iter') {
        statsEl.innerHTML = `<div class="mf-stat"><b>${score}</b><span>Ценность продукта</span></div><div class="mf-stat"><b>${moves}/40</b><span>Ходы</span></div><div class="mf-stat"><b>+${pendingAdd.size} / −${pendingDel.size}</b><span>Не выпущено</span></div>`;
      } else {
        statsEl.innerHTML = `<div class="mf-stat"><b>${bigSel.length}/9</b><span>Выбрано фич</span></div><div class="mf-stat"><b>${revealed ? score : '?'}</b><span>Результат</span></div><div class="mf-stat"><b>1</b><span>Попытка</span></div>`;
      }
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
          if (bigSel.includes(i)) cls += ' built';
          else if (!revealed && bigSel.length && bigSel.length < 9 && canBig(i)) cls += ' can';
        }
        if (revealed) cls += ' v' + vals[i];
        const b = h('button', { class: cls, onclick: () => click(i), 'aria-label': 'Клетка ' + (i + 1) }, revealed ? (vals[i] > 0 ? '+1' : String(vals[i])) : '');
        gridEl.append(b);
      }
      ctrl.innerHTML = '';
      ctrl.append(
        h('button', { class: 'btn primary', onclick: release, disabled: mode === 'big' ? (bigSel.length < 9 || revealed) : (over || (!pendingAdd.size && !pendingDel.size)) }, mode === 'big' ? 'Выпустить большой релиз' : 'Выпустить релиз (1 ход)'),
        h('button', { class: 'btn', onclick: () => { revealed = !revealed; draw(); } }, revealed ? 'Скрыть' : 'Открыть все'),
        h('button', { class: 'btn', onclick: reset }, 'Начать заново'));
      logEl.innerHTML = mode === 'iter' ? (log.length ? log.join('<br>') : 'Здесь будет история релизов.') : 'В режиме «Большой релиз» обратная связь одна: в самом конце.';
    }
    el.append(modeRow, statsEl,
      h('div', { class: 'mf-legend', html: 'Поле 9×9: треть клеток успешные (+1) и образуют <b>одну связную фигуру</b>, треть пустышки (0), треть вредные (−1). В итеративном режиме клик по клетке добавляет фичу (1 ход), клик по своей фиче удаляет её (1 ход), «Релиз» тоже стоит 1 ход. Новую фичу можно ставить только рядом с уже сделанными. Видно только <b>суммарный результат релиза</b>.' }),
      gridEl, ctrl, info, logEl,
      h('div', { class: 'callout tip', style: 'margin-top:10px', html: '<span class="ttl">💡 Подсказка к стратегии</span>Выпускай релиз после каждой 1–2 фич. Тогда по результату релиза видно, какая именно фича дала +1 или −1. Вредные фичи удаляй, а расти в ту сторону, где был плюс: успешные клетки касаются друг друга. Если слепить много фич в один релиз, будет непонятно, что сработало. Это и есть главный вывод лекции.' }));
    reset();
  };

  // ---------- тест ----------
  function renderQuiz(t) {
    const sec = h('section', { class: 'card', id: 'quiz' });
    let state;
    const scoreBar = h('div', { class: 'quiz-score' });
    const list = h('div');
    const start = () => {
      state = { answered: 0, right: 0 };
      list.innerHTML = '';
      const qs = shuffle(t.quiz);
      qs.forEach((q, qi) => list.append(renderQ(q, qi, qs.length)));
      upd();
    };
    const upd = () => {
      const total = t.quiz.length;
      scoreBar.innerHTML = '';
      scoreBar.append(h('span', {}, `Отвечено ${state.answered}/${total} · Верно ${state.right}`),
        h('button', { class: 'btn small', onclick: () => { start(); sec.scrollIntoView(); } }, 'Пройти заново'));
      if (state.answered === total) {
        const pct = Math.round(state.right / total * 100);
        const prev = best(t.id);
        if (!prev || prev.score < state.right) store.set('pd-quiz-' + t.id, { score: state.right, total, pct });
        renderTabs(t.id);
        scoreBar.firstChild.textContent = `Итог: ${state.right}/${total} (${pct}%) — ${pct >= 70 ? 'отлично, тема засчитана! ✓' : 'перечитай шпаргалку и попробуй ещё раз'}`;
      }
    };
    function renderQ(q, qi, total) {
      const box = h('div', { class: 'quiz-q' }, h('div', { class: 'qn' }, `ВОПРОС ${qi + 1} ИЗ ${total}`), h('div', { class: 'qt', html: q.q }));
      const opts = h('div', { class: 'opts' });
      const order = shuffle(q.opts.map((o, i) => i));
      const extra = h('div');
      order.forEach(i => {
        const b = h('button', { class: 'opt', html: q.opts[i], onclick: () => {
          if (box.classList.contains('answered')) return;
          box.classList.add('answered'); state.answered++;
          const ok = i === q.a;
          if (ok) state.right++;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) opts.querySelector(`[data-i="${q.a}"]`).classList.add('right');
          const why = q.why && q.why[i] ? `<p style="margin:4px 0 0"><b>Почему этот вариант неверен:</b> ${q.why[i]}</p>` : '';
          extra.append(h('div', { class: 'explain ' + (ok ? 'good' : 'bad'), html: ok
            ? `<span class="h">✓ Верно!</span>${q.explain}`
            : `<span class="h">✗ Ошибка. Правильный ответ: «${q.opts[q.a]}»</span>${why}<p style="margin:4px 0 0"><b>Объяснение:</b> ${q.explain}</p>` }));
          upd();
        } });
        b.dataset.i = i;
        opts.append(b);
      });
      box.append(opts);
      if (q.hint) {
        const hb = h('button', { class: 'hint-btn', onclick: () => { hb.replaceWith(h('div', { class: 'hint', html: '💡 ' + q.hint })); } }, '💡 Показать подсказку');
        box.append(hb);
      }
      box.append(extra);
      return box;
    }
    sec.append(h('h2', {}, '📝 Тест по теме'), h('p', { class: 'muted', style: 'font-size:15px' }, 'Выбирай ответ. Если ошибёшься, сразу увидишь правильный вариант и объяснение. Подсказку можно открыть до ответа. Вопросы и варианты каждый раз перемешиваются.'), list, scoreBar);
    start();
    return sec;
  }

  route();
})();
