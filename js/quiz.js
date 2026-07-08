/* AQ.quiz — per-module quiz engine (v2)
   Adds: shuffled questions + options, per-question timer, answer
   explanations, and quiz history — without changing quiz-data.js format.
   Storage:
     aq_quiz    = { moduleId: bestScorePct }
     aq_quizlog = [ { id, pct, ts } ]  (most recent last, capped) */
window.AQ = window.AQ || {};

AQ.quiz = (function () {
  const SECONDS = 30;             // per-question soft timer
  const wrap = () => document.getElementById('quizWrap');
  let cur = null;
  let timer = null;

  /* ---- persistence ---- */
  function scores() { return AQ.store.json('aq_quiz', {}); }
  function saveScore(id, pct) {
    const s = scores();
    if (!(id in s) || pct > s[id]) { s[id] = pct; AQ.store.set('aq_quiz', JSON.stringify(s)); }
  }
  function best(id) { const s = scores(); return (id in s) ? s[id] : null; }
  function passed(id) { const b = best(id); return b !== null && b >= AQ.PASS_MARK; }
  function history() { return AQ.store.json('aq_quizlog', []); }
  function logAttempt(id, pct) {
    const h = history(); h.push({ id, pct, ts: Date.now() });
    while (h.length > 60) h.shift();
    AQ.store.set('aq_quizlog', JSON.stringify(h));
  }
  function attemptsFor(id) { return history().filter(a => a.id === id); }

  /* ---- helpers ---- */
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* Build a shuffled run: questions in random order, options shuffled with
     the correct index remapped, explanation carried alongside. */
  function buildRun(id) {
    const src = AQ.QUIZZES[id] || [];
    const ex = (AQ.QUIZ_EX && AQ.QUIZ_EX[id]) || [];
    const order = shuffle(src.map((_, i) => i));
    return order.map(origIndex => {
      const q = src[origIndex];
      const optIdx = shuffle(q.en.o.map((_, i) => i));
      const newCorrect = optIdx.indexOf(q.c);
      return { orig: origIndex, q, optOrder: optIdx, correct: newCorrect, ex: ex[origIndex] || null };
    });
  }

  function open(id, title) {
    if (!AQ.QUIZZES[id]) return;
    cur = { id, title, run: buildRun(id), i: 0, correct: 0, done: false };
    render();
    wrap().hidden = false;
  }
  function close() {
    stopTimer();
    wrap().hidden = true; wrap().innerHTML = ''; cur = null;
    if (AQ.onQuizClosed) AQ.onQuizClosed();
  }

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function render() {
    const t = AQ.t, L = AQ.lang, w = wrap();
    if (cur.done) { renderResult(); return; }
    stopTimer();
    const item = cur.run[cur.i];
    const loc = item.q[L] || item.q.en;
    const n = cur.i + 1, total = cur.run.length;
    const opts = item.optOrder.map((origOpt, displayIdx) =>
      `<button class="qopt" data-i="${displayIdx}">${esc(loc.o[origOpt])}</button>`).join('');
    w.innerHTML = `
      <div class="quizbox" role="document">
        <div class="qhead">
          <h3>${esc(cur.title)} · ${t('quizTitle')}</h3>
          <span class="qn">${n} ${t('qOf')} ${total} · <span id="qTimer" aria-live="off">${SECONDS}s</span></span>
          <button class="qclose" aria-label="${t('qClose')}">✕</button>
        </div>
        <div class="qprog"><i style="width:${(cur.i / total) * 100}%"></i></div>
        <p class="qq">${esc(loc.q)}</p>
        <div class="qopts">${opts}</div>
        <div class="qexp" id="qExp" hidden></div>
        <button class="qnext" disabled>${n === total ? t('qFinish') : t('qNext')}</button>
      </div>`;
    w.querySelector('.qclose').onclick = close;
    const nextBtn = w.querySelector('.qnext');
    let answered = false;

    function lockAnswer(pickIdx) {
      if (answered) return;
      answered = true;
      stopTimer();
      const c = item.correct;
      if (pickIdx === c) cur.correct++;
      else if (pickIdx >= 0) w.querySelector(`.qopt[data-i="${pickIdx}"]`).classList.add('wrong');
      w.querySelector(`.qopt[data-i="${c}"]`).classList.add('correct');
      w.querySelectorAll('.qopt').forEach(b => b.disabled = true);
      if (item.ex) {
        const exEl = w.querySelector('#qExp');
        exEl.textContent = item.ex[L] || item.ex.en;
        exEl.hidden = false;
      }
      nextBtn.disabled = false;
      nextBtn.focus();
    }

    w.querySelectorAll('.qopt').forEach(btn =>
      btn.onclick = () => lockAnswer(+btn.dataset.i));
    nextBtn.onclick = () => {
      cur.i++;
      if (cur.i >= cur.run.length) { cur.done = true; finish(); }
      render();
    };

    /* per-question timer: auto-locks (counts as unanswered) at 0 */
    let left = SECONDS;
    const tEl = w.querySelector('#qTimer');
    timer = setInterval(() => {
      left--;
      if (tEl) tEl.textContent = left + 's';
      if (left <= 0) { stopTimer(); lockAnswer(-1); }
    }, 1000);
  }

  function finish() {
    const pct = Math.round((cur.correct / cur.run.length) * 100);
    cur.pct = pct;
    saveScore(cur.id, pct);
    logAttempt(cur.id, pct);
    if (AQ.onQuizFinished) AQ.onQuizFinished(cur.id, pct);
  }

  function renderResult() {
    const t = AQ.t, w = wrap();
    stopTimer();
    const pass = cur.pct >= AQ.PASS_MARK;
    const tries = attemptsFor(cur.id).length;
    w.innerHTML = `
      <div class="quizbox" role="document">
        <div class="qhead">
          <h3>${esc(cur.title)} · ${t('quizTitle')}</h3>
          <button class="qclose" aria-label="${t('qClose')}">✕</button>
        </div>
        <div class="qresult">
          <div class="rp ${pass ? 'pass' : 'fail'}">${cur.pct}%</div>
          <h4>${pass ? t('qPass') : t('qFail')}</h4>
          <p>${pass ? t('qPassMsg') : t('qFailMsg').replace('{p}', AQ.PASS_MARK)}</p>
          <p class="qtries">${t('qAttempts') ? t('qAttempts').replace('{n}', tries) : ''}</p>
          ${pass
            ? `<button class="qnext" data-act="close">${t('qClose')}</button>`
            : `<button class="qnext" data-act="retry">${t('qRetry')}</button>`}
        </div>
      </div>`;
    w.querySelector('.qclose').onclick = close;
    w.querySelector('.qnext').onclick = e => {
      if (e.currentTarget.dataset.act === 'retry') open(cur.id, cur.title);
      else close();
    };
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) close(); });

  return { open, close, best, passed, scores, history, attemptsFor };
})();
