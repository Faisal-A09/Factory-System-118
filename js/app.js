/* AQ app — main controller.
   Depends (load order): store.js, i18n.js, registry.js, quiz-data.js, quiz.js, cert.js */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const t = k => AQ.t(k);

  /* ---------------- state ---------------- */
  let USER = AQ.store.json('aq_user', null);
  let FILTER = 'all';
  let QUERY = '';
  let PINS = AQ.store.json('aq_pins', []);
  let SEEN = AQ.store.json('aq_seen', []);
  let RECENT = AQ.store.json('aq_recent', []);
  let TIME = AQ.store.json('aq_time', {});
  let openedAt = 0;
  let VIEW = 'home';
  let curModuleId = null;

  /* ---- streak / time / recent helpers ---- */
  function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function streakData() { return AQ.store.json('aq_streak', { days: 0, last: null }); }
  function bumpStreak() {
    const s = streakData(), tk = todayKey();
    if (s.last === tk) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yk = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    s.days = (s.last === yk) ? (s.days + 1) : 1;
    s.last = tk;
    AQ.store.set('aq_streak', JSON.stringify(s));
  }
  function totalMinutes() { return Math.round(Object.values(TIME).reduce((a, b) => a + b, 0) / 60); }
  function pushRecent(id) { RECENT = [id, ...RECENT.filter(x => x !== id)].slice(0, 8); AQ.store.set('aq_recent', JSON.stringify(RECENT)); }
  function addTime(id, secs) { if (!secs || secs < 2) return; TIME[id] = (TIME[id] || 0) + secs; AQ.store.set('aq_time', JSON.stringify(TIME)); }

  /* ---------------- helpers ---------------- */
  function escapeHTML(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function allowedDepts() { return USER && AQ.ROLES[USER.role] ? AQ.ROLES[USER.role].depts : []; }
  function canOpen(m) { return allowedDepts().includes(m.dept); }
  function accessible() { return AQ.MODULES.filter(canOpen); }
  function moduleById(id) { return AQ.MODULES.find(m => m.id === id); }
  function isComplete(m) { return SEEN.includes(m.id) && AQ.quiz.passed(m.id); }

  let toastT = null;
  function toast(msg, cls) {
    const el = $('#toast');
    el.textContent = msg; el.className = (cls || '') + ' show';
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------------- entry gate (role-based access) ---------------- */
  let gateRole = null;
  function openGate() {
    gateRole = USER ? USER.role : null;
    $('#gateName').value = USER ? USER.name : '';
    $$('.role').forEach(r => {
      const sel = r.dataset.role === gateRole;
      r.classList.toggle('sel', sel);
      r.setAttribute('aria-checked', sel);
    });
    gateCheck();
    $('#gate').classList.add('open');
    setTimeout(() => $('#gateName').focus(), 80);
  }
  function gateCheck() { $('#gateEnter').disabled = !($('#gateName').value.trim() && gateRole); }
  $('#gateName').addEventListener('input', gateCheck);
  $$('.role').forEach(r => r.addEventListener('click', () => {
    gateRole = r.dataset.role;
    $$('.role').forEach(x => {
      const sel = x === r;
      x.classList.toggle('sel', sel);
      x.setAttribute('aria-checked', sel);
    });
    gateCheck();
  }));
  $('#gateEnter').addEventListener('click', () => {
    USER = { name: $('#gateName').value.trim(), role: gateRole };
    AQ.store.set('aq_user', JSON.stringify(USER));
    $('#gate').classList.remove('open');
    const depts = allowedDepts();
    FILTER = depts.length === 1 ? depts[0] : 'all';
    syncFilterBtns();
    applyLang();
  });
  $('#userChip').addEventListener('click', openGate);

  /* ---------------- language / RTL ---------------- */
  function applyLang() {
    const rtl = AQ.lang === 'ar';
    document.documentElement.lang = rtl ? 'ar' : 'en';
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.title = rtl ? 'أقوات — منصة تدريب' : 'Aqwat — Training Platform';
    $$('#langTog button').forEach(b => {
      const on = b.dataset.lang === AQ.lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    /* static ids */
    $('#brandSub').textContent = t('brandSub');
    $('#gateTitle').textContent = t('gateTitle'); $('#gateSub').textContent = t('gateSub');
    $('#gateNameL').textContent = t('gateNameL'); $('#gateName').placeholder = t('gateNamePh');
    $('#rFcmN').textContent = t('rFcmN'); $('#rFcmD').textContent = t('rFcmD');
    $('#rFoeN').textContent = t('rFoeN'); $('#rFoeD').textContent = t('rFoeD');
    $('#rSupN').textContent = t('rSupN'); $('#rSupC').textContent = t('rSupC'); $('#rSupD').textContent = t('rSupD');
    $('#gateEnter').textContent = t('gateEnter'); $('#gateHint').textContent = t('gateHint');
    $('#heroKick').textContent = t('heroKick');
    $('#heroTitle').innerHTML = USER
      ? t('heroWelcome') + '<span class="hl">' + escapeHTML(USER.name) + '</span>'
      : t('heroGeneric') + '<span class="hl">' + t('heroGenericHl') + '</span>';
    $('#heroLede').textContent = t('heroLede');
    $('#searchBox').placeholder = t('searchPh');
    $('#searchBox').setAttribute('aria-label', t('searchPh'));
    $('#progL').textContent = t('progL');
    $('#clkPhaseL').textContent = t('phaseLabel');
    $('#vbackArrow').textContent = rtl ? '→' : '←';
    $('#footer').textContent = t('footer');
    $('#userChip').title = t('switchTip');
    /* dashboard */
    $('#dashKick').textContent = t('dashKick');
    $('#dashTitle').textContent = t('dashTitle');
    $('#dashLede').textContent = t('dashLede');
    $('#ringL').textContent = t('ringL');
    $('#dsModulesL').textContent = t('dsModulesL');
    $('#dsQuizL').textContent = t('dsQuizL');
    $('#dsAvgL').textContent = t('dsAvgL');
    $('#certBtnL').textContent = t('certBtn');
    $('#dashListL').textContent = t('dashListL');
    /* generic data-t */
    $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    AQ.store.set('aq_lang', AQ.lang);
    updateUserChip(); renderGrid(); renderDash(); updateOps(); updateProgress();
    if (AQ.search && AQ.search.rebuild) AQ.search.rebuild();
    if (typeof refreshAssistLabels === 'function') refreshAssistLabels();
    if (VIEW === 'insights') renderInsights();
    if (VIEW === 'maint') renderMaint();
  }
  $('#langTog').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    AQ.lang = b.dataset.lang; applyLang();
  });

  /* ---------------- user chip ---------------- */
  function updateUserChip() {
    if (!USER) { $('#uAv').textContent = '?'; $('#uName').textContent = '—'; $('#uRole').textContent = '—'; return; }
    const R = AQ.ROLES[USER.role];
    $('#userChip').style.setProperty('--role', R.color);
    $('#uAv').textContent = USER.name.trim().charAt(0).toUpperCase() || '?';
    $('#uName').textContent = USER.name;
    $('#uRole').textContent = R[AQ.lang] || R.en;
  }

  /* ---------------- ops clock ---------------- */
  function currentPhase() {
    const d = new Date(); const day = d.getDay(); const m = d.getHours() * 60 + d.getMinutes();
    if (day === 5 && m >= 120 && m < 660) return 'weekly';
    if (m >= 420 && m < 960) return 'first';
    if (m >= 960 || m < 60) return 'second';
    if (m >= 60 && m < 300) return 'pm';
    return 'prep';
  }
  function updateOps() {
    const d = new Date();
    $('#clkTop').textContent = d.toTimeString().slice(0, 8);
    const ph = currentPhase(), label = AQ.I18N[AQ.lang].phases[ph];
    const b = $('#clkPhase'); b.textContent = label; b.classList.toggle('live', ph === 'weekly');
    const live = $('#opsLive'), txt = $('#opsLiveText');
    if (ph === 'weekly') { live.classList.add('wk'); txt.innerHTML = '<b>' + t('liveWeekly') + '</b>'; }
    else { live.classList.remove('wk'); txt.innerHTML = t('liveNormal') + ' <b>' + label + '</b>'; }
  }
  setInterval(updateOps, 1000);

  /* ---------------- progress ---------------- */
  function updateProgress() {
    const avail = accessible();
    const done = avail.filter(isComplete).length;
    const pct = avail.length ? Math.round(done / avail.length * 100) : 0;
    $('#progV').textContent = done + ' / ' + avail.length;
    $('#progFill').style.width = pct + '%';
    $('#progBar').setAttribute('aria-valuenow', pct);
  }

  /* ---------------- views ---------------- */
  function setView(v) {
    VIEW = v;
    $('#view-home').hidden = v !== 'home';
    $('#view-dash').hidden = v !== 'dash';
    $('#view-insights').hidden = v !== 'insights';
    $('#view-maint').hidden = v !== 'maint';
    $$('.navbtn').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    if (v === 'dash') renderDash();
    if (v === 'insights') renderInsights();
    if (v === 'maint') renderMaint();
  }
  $$('.navbtn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  /* ---------------- filters / search / pins ---------------- */
  function syncFilterBtns() { $$('.fbtn').forEach(b => b.classList.toggle('on', b.dataset.f === FILTER)); }
  $$('.fbtn').forEach(b => b.addEventListener('click', () => { FILTER = b.dataset.f; syncFilterBtns(); renderGrid(); }));
  $('#searchBox').addEventListener('input', e => { QUERY = e.target.value.trim().toLowerCase(); renderGrid(); });
  function togglePin(id, ev) {
    ev.stopPropagation();
    const i = PINS.indexOf(id);
    if (i >= 0) PINS.splice(i, 1); else { if (PINS.length >= 4) PINS.shift(); PINS.push(id); }
    AQ.store.set('aq_pins', JSON.stringify(PINS)); renderGrid();
  }

  /* ---------------- home grid ---------------- */
  function cardHTML(m) {
    const L = m[AQ.lang] || m.en;
    const pinned = PINS.includes(m.id);
    const seen = SEEN.includes(m.id);
    const qBest = AQ.quiz.best(m.id);
    const complete = isComplete(m);
    const ok = canOpen(m);
    return `<div class="scard ${ok ? '' : 'locked'}" style="--accent:${m.color}" data-id="${m.id}"
      role="button" tabindex="0" aria-label="${L.name.replace(/&amp;/g, '&')}${ok ? '' : ' (' + t('lockedB') + ')'}">
      ${ok ? `<button class="star ${pinned ? 'on' : ''}" data-star="${m.id}" aria-label="pin" aria-pressed="${pinned}">${pinned ? '★' : '☆'}</button>` : ''}
      <div class="top">
        <div class="ico" aria-hidden="true">${AQ.ICONS[m.id] || ''}</div>
        <div style="min-width:0">
          <div class="dept">${m.abbr} · ${m.dept.toUpperCase()}</div>
          <h3>${L.name}</h3>
        </div>
      </div>
      <p>${L.desc}</p>
      <div class="foot">
        ${complete ? `<span class="badge-done">✓ ${t('done')}</span>` : (seen && ok ? `<span class="badge-done" style="color:var(--amber);border-color:rgba(255,176,46,.4)">${t('visitedB')}</span>` : '')}
        ${qBest !== null && ok ? `<span class="badge-quiz">${t('quizB')} ${qBest}%</span>` : ''}
        ${ok ? '' : `<span class="badge-lock"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> ${t('lockedB')}</span>`}
        <span class="go">${ok ? t('open') : ''} <span aria-hidden="true">${ok ? (AQ.lang === 'ar' ? '←' : '→') : ''}</span></span>
      </div>
    </div>`;
  }
  function renderGrid() {
    const grid = $('#grid');
    const list = AQ.MODULES.filter(m => {
      if (FILTER !== 'all' && m.dept !== FILTER) return false;
      if (!QUERY) return true;
      const L = m[AQ.lang] || m.en;
      return (L.name + ' ' + m.abbr + ' ' + L.desc).toLowerCase().includes(QUERY);
    });
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty">${t('empty')}</div>`;
    /* pins */
    const pins = PINS.filter(id => { const m = moduleById(id); return m && canOpen(m); });
    $('#pinWrap').hidden = !pins.length;
    $('#pinRow').innerHTML = pins.map(id => {
      const m = moduleById(id);
      return `<button class="pinchip" data-id="${m.id}"><span class="d" style="background:${m.color}" aria-hidden="true"></span>${(m[AQ.lang] || m.en).name}</button>`;
    }).join('');
    /* wire */
    grid.querySelectorAll('.scard').forEach(c => {
      c.addEventListener('click', () => openModule(c.dataset.id));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModule(c.dataset.id); } });
    });
    grid.querySelectorAll('.star').forEach(b => b.addEventListener('click', e => togglePin(b.dataset.star, e)));
    $('#pinRow').querySelectorAll('.pinchip').forEach(c => c.addEventListener('click', () => openModule(c.dataset.id)));
  }

  /* ---------------- module viewer (lazy iframe) ---------------- */
  function openModule(id) {
    const m = moduleById(id); if (!m) return;
    if (!canOpen(m)) { toast(t('lockedMsg'), 'err'); return; }
    curModuleId = id;
    const L = m[AQ.lang] || m.en;
    const frame = $('#vframe'), load = $('#vload');
    $('#vtitle').innerHTML = `${L.name} <span class="vd">${m.abbr}</span>`;
    load.style.opacity = '1'; load.style.display = '';
    $('#viewer').classList.add('open');
    /* lazy load: iframe src only set on demand */
    if (frame.dataset.cur !== id) {
      frame.src = m.file;
      frame.dataset.cur = id;
    } else { load.style.opacity = '0'; setTimeout(() => load.style.display = 'none', 300); }
    frame.onload = () => { load.style.opacity = '0'; setTimeout(() => { load.style.display = 'none'; }, 350); };
    setTimeout(() => { load.style.opacity = '0'; setTimeout(() => load.style.display = 'none', 350); }, 5000);
    if (!SEEN.includes(id)) { SEEN.push(id); AQ.store.set('aq_seen', JSON.stringify(SEEN)); }
    pushRecent(id); bumpStreak(); openedAt = Date.now();
    AQ.store.set('aq_last', id);
    updateProgress();
    $('#vback').focus();
  }
  $('#vback').addEventListener('click', () => {
    if (openedAt && curModuleId) { addTime(curModuleId, Math.round((Date.now() - openedAt) / 1000)); openedAt = 0; }
    $('#viewer').classList.remove('open');
    const f = $('#vframe');
    f.removeAttribute('srcdoc'); f.src = 'about:blank'; delete f.dataset.cur;
    renderGrid(); renderDash(); updateProgress();
  });
  $('#vquiz').addEventListener('click', () => {
    if (!curModuleId) return;
    const m = moduleById(curModuleId);
    AQ.quiz.open(m.id, (m[AQ.lang] || m.en).name.replace(/&amp;/g, '&'));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#viewer').classList.contains('open') && $('#quizWrap').hidden) {
      $('#vback').click();
    }
  });

  /* quiz callbacks */
  AQ.onQuizFinished = function () { updateProgress(); };
  AQ.onQuizClosed = function () { renderGrid(); renderDash(); updateProgress(); };

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    if (!USER) return;
    const avail = accessible();
    const opened = avail.filter(m => SEEN.includes(m.id)).length;
    const passedN = avail.filter(m => AQ.quiz.passed(m.id)).length;
    const completed = avail.filter(isComplete).length;
    const pct = avail.length ? Math.round(completed / avail.length * 100) : 0;
    const scored = avail.map(m => AQ.quiz.best(m.id)).filter(v => v !== null);
    const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

    /* ring: r=52 → C=326.7 */
    $('#ringFg').style.strokeDashoffset = String(326.7 * (1 - pct / 100));
    $('#ringPct').textContent = pct + '%';
    $('#dsModules').textContent = opened + '/' + avail.length;
    $('#dsQuiz').textContent = passedN + '/' + avail.length;
    $('#dsAvg').textContent = avg === null ? '—' : avg + '%';

    const ready = avail.length > 0 && completed === avail.length;
    $('#certBtn').disabled = !ready;
    $('#certHint').textContent = ready ? t('certHintReady') : t('certHintLocked');

    /* KPI cards */
    const R = AQ.ROLES[USER.role];
    const mins = totalMinutes();
    const timeStr = mins >= 60 ? Math.floor(mins / 60) + t('hoursShort') + ' ' + (mins % 60) + t('minutesShort') : mins + ' ' + t('minutesShort');
    const streak = streakData().days;
    const kpis = [
      [t('kpiCompleted'), completed + '/' + avail.length, 'var(--green)'],
      [t('kpiProgress'), pct + '%', 'var(--brand)'],
      [t('kpiAvg'), avg === null ? '—' : avg + '%', 'var(--violet)'],
      [t('kpiTime'), timeStr, 'var(--amber)'],
      [t('kpiStreak'), streak + '', 'var(--foe)']
    ];
    $('#kpiGrid').innerHTML = kpis.map(k =>
      `<div class="kpi" style="--kc:${k[2]}"><span class="kk">${k[0]}</span><b class="kv">${k[1]}</b></div>`).join('');

    /* continue-last */
    const lastId = AQ.store.get('aq_last');
    const lastM = lastId ? moduleById(lastId) : null;
    const cc = $('#continueCard');
    if (lastM && canOpen(lastM) && !isComplete(lastM)) {
      cc.hidden = false;
      $('#continueL').textContent = t('continueLast');
      $('#continueIco').innerHTML = AQ.ICONS[lastM.id] || '';
      $('#continueIco').parentElement.style.setProperty('--accent', lastM.color);
      $('#continueName').textContent = (lastM[AQ.lang] || lastM.en).name.replace(/&amp;/g, '&');
      $('#continueDept').textContent = lastM.abbr + ' · ' + lastM.dept.toUpperCase();
      const btn = $('#continueBtn');
      btn.textContent = SEEN.includes(lastM.id) ? t('reviewModule') : t('startModule');
      btn.onclick = () => openModule(lastM.id);
    } else cc.hidden = true;

    /* streak card */
    $('#streakN').textContent = streak;
    $('#streakL').textContent = streak > 0 ? t('streakDays') : t('streakStart');

    /* recently opened */
    $('#recentL').textContent = t('recentOpened');
    const rec = RECENT.map(moduleById).filter(m => m && canOpen(m)).slice(0, 6);
    $('#recentRow').innerHTML = rec.length
      ? rec.map(m => `<button class="pinchip" data-id="${m.id}"><span class="d" style="background:${m.color}" aria-hidden="true"></span>${(m[AQ.lang] || m.en).name}</button>`).join('')
      : `<span class="empty" style="padding:var(--sp-3);text-align:start">${t('noRecent')}</span>`;
    $$('#recentRow .pinchip').forEach(c => c.addEventListener('click', () => openModule(c.dataset.id)));

    /* module rows */
    $('#dashList').innerHTML = avail.map(m => {
      const L = m[AQ.lang] || m.en;
      const seen = SEEN.includes(m.id);
      const b = AQ.quiz.best(m.id);
      const st = isComplete(m) ? ['c', t('stDone')] : seen ? ['v', t('stVisited')] : ['', t('stNot')];
      return `<div class="drow" style="--accent:${m.color}">
        <div class="ico" aria-hidden="true">${AQ.ICONS[m.id] || ''}</div>
        <div class="dinfo"><h4>${L.name}</h4><span class="dst ${st[0]}">${st[1]}</span></div>
        <div class="dscore">${b === null ? '—' : `${t('best')}: <b>${b}%</b>`}</div>
        <button class="dbtn" data-open="${m.id}">${t('dOpen')}</button>
        <button class="dbtn q" data-quiz="${m.id}">${t('dQuiz')}</button>
      </div>`;
    }).join('');
    $$('#dashList [data-open]').forEach(b => b.addEventListener('click', () => openModule(b.dataset.open)));
    $$('#dashList [data-quiz]').forEach(b => b.addEventListener('click', () => {
      const m = moduleById(b.dataset.quiz);
      AQ.quiz.open(m.id, (m[AQ.lang] || m.en).name.replace(/&amp;/g, '&'));
    }));
  }
  $('#certBtn').addEventListener('click', async () => {
    const avail = accessible();
    const scored = avail.map(m => AQ.quiz.best(m.id)).filter(v => v !== null);
    const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;
    const R = AQ.ROLES[USER.role];
    const d = new Date();
    const dateStr = AQ.lang === 'ar' ? d.toLocaleDateString('ar-SA') : d.toLocaleDateString('en-GB');
    const kind = await AQ.cert.download({
      name: USER.name, roleLabel: R[AQ.lang] || R.en,
      count: avail.length, avg, dateStr
    });
    toast(kind === 'pdf' ? t('certDone') : t('certPng'), kind === 'pdf' ? 'ok' : '');
  });

  /* ================= INSIGHTS ================= */
  function renderInsights() {
    const t = AQ.t;
    const mods = accessible();
    $('#insightsKick').textContent = t('insightsKick');
    $('#insightsTitle').textContent = t('insightsTitle');
    $('#insightsLede').textContent = t('insightsLede');
    $('#weakTitle').textContent = t('weakTitle');
    $('#recTitle').textContent = t('recTitle');
    $('#weeklyTitle').textContent = t('weeklyTitle');
    $('#heatTitle').textContent = t('heatTitle');
    $('#eqKick').textContent = t('eqKick');
    $('#eqTitle').textContent = t('eqTitle');
    $('#eqLede').textContent = t('eqLede');

    /* weaknesses */
    const weak = AQ.analytics.weaknesses(mods);
    $('#weakList').innerHTML = weak.length ? weak.map(w => {
      const m = moduleById(w.id);
      return `<div class="wk-row ${w.level}"><span class="wk-d"></span>
        <span class="wk-n">${(m[AQ.lang] || m.en).name}</span>
        <span class="wk-tag">${w.level === 'fail' ? t('weakFail') : t('weakLow')}</span>
        <span class="wk-s">${w.best}%</span></div>`;
    }).join('') : `<p class="pempty">${t('weakNone')}</p>`;

    /* recommendations */
    const recs = AQ.analytics.recommend(mods, { seen: SEEN, isComplete });
    $('#recList').innerHTML = recs.length ? recs.map(r => {
      const label = r.kind === 'retry' ? t('recRetry').replace('{s}', r.score)
        : r.kind === 'prereq' ? t('recPrereq')
        : r.kind === 'improve' ? t('recImprove').replace('{s}', r.score)
        : t('recStart');
      return `<div class="rec-row"><span class="rec-ic" style="--accent:${r.m.color}">${AQ.ICONS[r.m.id] || ''}</span>
        <span class="rec-info"><h5>${(r.m[AQ.lang] || r.m.en).name}</h5><span>${label}</span></span>
        <button class="rec-go" data-id="${r.m.id}">${t('startModule')}</button></div>`;
    }).join('') : `<p class="pempty">${t('recNone')}</p>`;
    $$('#recList .rec-go').forEach(b => b.addEventListener('click', () => openModule(b.dataset.id)));

    /* weekly chart */
    const days = AQ.analytics.last7();
    const max = Math.max(1, ...days.map(d => d.count));
    const dayNames = AQ.lang === 'ar' ? ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'] : ['Su','Mo','Tu','We','Th','Fr','Sa'];
    $('#weeklyChart').innerHTML = days.map(d => {
      const h = Math.round((d.count / max) * 100);
      return `<div class="wc-col"><span class="wc-val">${d.count || ''}</span>
        <div class="wc-bar-wrap"><div class="wc-bar ${d.count ? '' : 'zero'}" style="height:${d.count ? h : 4}%"></div></div>
        <span class="wc-lbl">${dayNames[d.date.getDay()]}</span></div>`;
    }).join('');

    /* heatmap */
    const cells = AQ.analytics.heatmap(10);
    $('#heatmap').innerHTML = cells.map(c =>
      `<div class="hm-cell ${c.level ? 'l' + c.level : ''}" title="${c.date.toLocaleDateString()} · ${c.count} ${t('quizzesWord')}"></div>`).join('');

    /* equipment KPI */
    renderEquipment();
  }

  function renderEquipment() {
    const t = AQ.t;
    const sum = AQ.equipment.summary();
    $('#eqSummary').innerHTML = `
      <div class="eq-s avg"><span class="k">${t('eqAvg')}</span><span class="v">${sum.avg}%</span></div>
      <div class="eq-s ok"><span class="k">${t('eqOk')}</span><span class="v">${sum.ok}</span></div>
      <div class="eq-s warn"><span class="k">${t('eqWarn')}</span><span class="v">${sum.warn}</span></div>
      <div class="eq-s crit"><span class="k">${t('eqCrit')}</span><span class="v">${sum.crit}</span></div>`;
    const rows = AQ.equipment.readings();
    $('#eqGrid').innerHTML = `<div class="eqsample" style="grid-column:1/-1">${t('eqSample')}</div>` +
      rows.map(r => `<div class="eqcard ${r.status}">
        <div class="eq-top"><h4>${r.name}</h4><span class="eq-u">${r.unit}</span></div>
        <span class="eq-v">${r.value}%</span>
        <div class="eq-m">${r.metric}</div>
        <div class="eq-track"><div class="eq-fill" style="width:${r.value}%"></div></div>
      </div>`).join('');
  }

  /* ================= MAINTENANCE ================= */
  function renderMaint() {
    const t = AQ.t;
    $('#maintKick').textContent = t('maintKick');
    $('#maintTitle').textContent = t('maintTitle');
    $('#maintLede').textContent = t('maintLede');
    $('#maintInput').placeholder = t('maintPh');
    $('#maintAddBtn').textContent = t('maintAdd');
    const prioSel = $('#maintPrio');
    prioSel.options[0].textContent = t('prioLow');
    prioSel.options[1].textContent = t('prioMed');
    prioSel.options[2].textContent = t('prioHigh');
    // populate module dropdown with accessible modules
    const mods = accessible();
    $('#maintModule').innerHTML = `<option value="">${t('maintModule')}</option>` +
      mods.map(m => `<option value="${m.id}">${(m[AQ.lang] || m.en).name}</option>`).join('');

    const counts = AQ.maint.counts();
    $('#maintCounts').innerHTML =
      `<span class="mc">${t('maintOpenN')} <b>${counts.open}</b></span>
       <span class="mc">${t('maintDoneN')} <b>${counts.done}</b></span>`;

    const list = AQ.maint.all();
    $('#maintList').innerHTML = list.length ? list.map(x => {
      const m = x.module ? moduleById(x.module) : null;
      const mod = m ? (m[AQ.lang] || m.en).name : '';
      return `<div class="maintrow ${x.status === 'done' ? 'done' : ''}">
        <span class="mt-prio ${x.priority}"></span>
        <span class="mt-title">${escapeHTML(x.title)}</span>
        ${mod ? `<span class="mt-mod">${mod}</span>` : ''}
        <button class="mt-btn" data-act="toggle" data-id="${x.id}">${x.status === 'done' ? t('maintReopen') : t('maintDone')}</button>
        <button class="mt-btn del" data-act="del" data-id="${x.id}">${t('maintDelete')}</button>
      </div>`;
    }).join('') : `<p class="pempty">${t('maintEmpty')}</p>`;

    $$('#maintList .mt-btn').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.act === 'toggle') {
        const cur = AQ.maint.all().find(x => x.id === b.dataset.id);
        AQ.maint.update(b.dataset.id, { status: cur.status === 'done' ? 'open' : 'done' });
      } else AQ.maint.remove(b.dataset.id);
      renderMaint();
    }));
  }
  $('#maintAddBtn').addEventListener('click', () => {
    const title = $('#maintInput').value.trim();
    if (!title) { toast(AQ.t('maintPh'), 'err'); return; }
    AQ.maint.add({ title, module: $('#maintModule').value, priority: $('#maintPrio').value });
    $('#maintInput').value = '';
    renderMaint();
    toast(AQ.t('saved'), 'ok');
  });
  $('#maintInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#maintAddBtn').click(); });

  /* ================= CONTENT SEARCH OVERLAY ================= */
  const soOverlay = $('#searchOverlay'), soInput = $('#soInput'), soResults = $('#soResults');
  function openSearch() {
    soOverlay.hidden = false;
    soInput.placeholder = AQ.t('searchAllPh');
    soInput.value = ''; soResults.innerHTML = '';
    setTimeout(() => soInput.focus(), 30);
  }
  function closeSearch() { soOverlay.hidden = true; }
  function runSearch() {
    const q = soInput.value.trim();
    if (!q) { soResults.innerHTML = ''; return; }
    const res = AQ.search.query(q);
    if (!res.length) { soResults.innerHTML = `<p class="so-empty">${AQ.t('searchNoRes')}</p>`; return; }
    soResults.innerHTML = res.map(r => {
      const nm = (r.m[AQ.lang] || r.m.en).name.replace(/&amp;/g, '&');
      return `<button class="so-item" data-id="${r.id}">
        <span class="si-h"><span class="si-d" style="background:${r.m.color}"></span>
          <span class="si-n">${AQ.search.highlight(nm, q)}</span>
          <span class="si-x">${r.m.abbr} · ${r.m.dept.toUpperCase()}</span></span>
        <span class="si-s">${AQ.search.highlight(r.snippet, q)}</span></button>`;
    }).join('');
    $$('#soResults .so-item').forEach(it => it.addEventListener('click', () => {
      closeSearch(); openModule(it.dataset.id);
    }));
  }
  $('#contentSearchBtn').addEventListener('click', openSearch);
  $('#soClose').addEventListener('click', closeSearch);
  soInput.addEventListener('input', runSearch);
  soOverlay.addEventListener('click', e => { if (e.target === soOverlay) closeSearch(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !soOverlay.hidden) closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });

  /* ================= CONTENT ASSISTANT ================= */
  const apPanel = $('#assistPanel'), apBody = $('#apBody'), apInput = $('#apInput');
  function refreshAssistLabels() {
    const t = AQ.t;
    $('#apTitle').textContent = t('assistTitle');
    $('#apIntro').textContent = t('assistIntro');
    $('#apDisclaim').textContent = t('assistDisclaim');
    $('#apSend').textContent = t('assistSend');
    apInput.placeholder = t('assistPh');
  }
  function toggleAssist() {
    apPanel.hidden = !apPanel.hidden;
    if (!apPanel.hidden) { refreshAssistLabels(); setTimeout(() => apInput.focus(), 30); }
  }
  function askAssist() {
    const q = apInput.value.trim();
    if (!q) return;
    const t = AQ.t;
    apBody.insertAdjacentHTML('beforeend', `<div class="ap-msg q">${escapeHTML(q)}</div>`);
    apInput.value = '';
    const res = AQ.assistant.ask(q);
    let html;
    if (!res || !res.found) html = `<div class="ap-msg">${t('assistNone')}</div>`;
    else {
      html = `<div class="ap-msg">${escapeHTML(res.answer)}
        <div class="ap-src">${t('assistFrom')}: ${escapeHTML(res.moduleTitle)}
        <button class="ap-open" data-id="${res.moduleId}">${t('assistOpen')}</button></div></div>`;
    }
    apBody.insertAdjacentHTML('beforeend', html);
    apBody.scrollTop = apBody.scrollHeight;
    const openBtn = apBody.querySelector('.ap-msg:last-child .ap-open');
    if (openBtn) openBtn.addEventListener('click', () => { apPanel.hidden = true; openModule(openBtn.dataset.id); });
  }
  $('#assistFab').addEventListener('click', toggleAssist);
  $('#apClose').addEventListener('click', () => apPanel.hidden = true);
  $('#apSend').addEventListener('click', askAssist);
  apInput.addEventListener('keydown', e => { if (e.key === 'Enter') askAssist(); });

  /* ================= GUIDED PRACTICE ================= */
  function openPractice(id) {
    const m = moduleById(id); if (!m) return;
    const t = AQ.t;
    const steps = AQ.practice.steps(m);
    if (!steps.length) { toast(t('practiceIntro'), ''); return; }
    let host = document.getElementById('mpracticeHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mpracticeHost';
      $('#viewer').appendChild(host);
    }
    function draw() {
      const st = AQ.practice.state(id);
      const pct = AQ.practice.progress(id, steps.length);
      host.className = 'mpractice';
      host.innerHTML = `<div class="mp-h"><b>${t('practiceTitle')}</b>
        <span class="mp-prog">${st.done.length} ${t('practiceOf')} ${steps.length} · ${pct}%</span></div>` +
        steps.map((s, i) => `<div class="mp-step ${st.done.includes(i) ? 'done' : ''}" data-i="${i}">
          <span class="mp-check"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg></span>
          <span class="mp-txt"><span class="mp-num">${t('practiceStep')} ${i + 1}</span><br>${escapeHTML(s)}</span></div>`).join('') +
        (pct === 100 ? `<p class="mp-prog" style="margin-top:var(--sp-3)">✓ ${t('practiceDone')}</p>` : '');
      host.querySelectorAll('.mp-step').forEach(row => row.addEventListener('click', () => {
        AQ.practice.toggle(id, +row.dataset.i, steps.length); draw();
      }));
    }
    draw();
    host.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
  $('#vpractice').addEventListener('click', () => { if (curModuleId) openPractice(curModuleId); });

  /* ================= SERVICE WORKER (offline) ================= */
  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (nw) nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) toast(AQ.t('offlineUpdated'), '');
          });
        });
        if (!navigator.serviceWorker.controller) setTimeout(() => toast(AQ.t('offlineReady'), 'ok'), 1500);
      }).catch(() => {});
    });
  }

  /* ---------------- boot ---------------- */
  applyLang();
  updateOps();
  if (!USER) { openGate(); }
  else {
    const depts = allowedDepts();
    FILTER = depts.length === 1 ? depts[0] : 'all';
    syncFilterBtns(); renderGrid(); renderDash(); updateProgress();
  }
})();
