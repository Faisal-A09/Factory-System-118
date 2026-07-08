/* AQ.analytics — weakness detection, smart recommendations,
   weekly activity chart and completion/activity heatmap.
   Reads real data: aq_quizlog, aq_time, aq_seen, aq_quiz. Pure functions. */
window.AQ = window.AQ || {};

AQ.analytics = (function () {
  function log() { return AQ.store.json('aq_quizlog', []); }
  function times() { return AQ.store.json('aq_time', {}); }

  /* ---- weakness detection ----
     A module is "weak" if its best score is below a comfortable margin
     above the pass mark, or it was attempted and never passed. */
  function weaknesses(modules) {
    const out = [];
    modules.forEach(m => {
      const best = AQ.quiz.best(m.id);
      const attempts = AQ.quiz.attemptsFor ? AQ.quiz.attemptsFor(m.id).length : 0;
      if (best === null) return; // not attempted → not a weakness, it's a "to-do"
      const margin = best - AQ.PASS_MARK;
      let level = null;
      if (best < AQ.PASS_MARK) level = 'fail';
      else if (margin < 20) level = 'weak';
      if (level) out.push({ id: m.id, best, attempts, level });
    });
    // worst first
    return out.sort((a, b) => a.best - b.best);
  }

  /* ---- smart recommendations ----
     Rule-based next actions, in priority order:
     1) retry any failed module
     2) start prerequisites that are still incomplete
     3) start the next unopened accessible module
     4) shore up "weak" passes
     5) if all done → certificate */
  function recommend(modules, ctx) {
    const recs = [];
    const seen = ctx.seen, complete = ctx.isComplete;
    const w = weaknesses(modules);

    w.filter(x => x.level === 'fail').forEach(x => {
      const m = modules.find(mm => mm.id === x.id);
      recs.push({ kind: 'retry', id: x.id, m, reason: 'failScore', score: x.best });
    });

    // prerequisites first
    modules.forEach(m => {
      if (complete(m) || seen.includes(m.id)) return;
      const pre = (m.meta && m.meta.prereq) || [];
      const unmetPre = pre.filter(pid => {
        const pm = modules.find(x => x.id === pid);
        return pm && !complete(pm);
      });
      if (unmetPre.length) {
        unmetPre.forEach(pid => {
          const pm = modules.find(x => x.id === pid);
          if (pm && !recs.find(r => r.id === pid)) recs.push({ kind: 'prereq', id: pid, m: pm, reason: 'prereqFor', forId: m.id });
        });
      }
    });

    // next unopened
    modules.forEach(m => {
      if (!seen.includes(m.id) && !recs.find(r => r.id === m.id)) {
        const pre = (m.meta && m.meta.prereq) || [];
        const blocked = pre.some(pid => { const pm = modules.find(x => x.id === pid); return pm && !complete(pm); });
        if (!blocked) recs.push({ kind: 'start', id: m.id, m, reason: 'notStarted' });
      }
    });

    // weak passes
    w.filter(x => x.level === 'weak').forEach(x => {
      if (!recs.find(r => r.id === x.id)) {
        const m = modules.find(mm => mm.id === x.id);
        recs.push({ kind: 'improve', id: x.id, m, reason: 'lowMargin', score: x.best });
      }
    });

    return recs.slice(0, 4);
  }

  /* ---- weekly activity (last 7 days) ----
     Counts quiz attempts per day from the log timestamps. */
  function last7() {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0);
      days.push({ date: d, key: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), count: 0, passed: 0 });
    }
    log().forEach(a => {
      const d = new Date(a.ts); d.setHours(0, 0, 0, 0);
      const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      const day = days.find(x => x.key === k);
      if (day) { day.count++; if (a.pct >= AQ.PASS_MARK) day.passed++; }
    });
    return days;
  }

  /* ---- heatmap (last ~10 weeks, GitHub-style) ---- */
  function heatmap(weeks) {
    weeks = weeks || 10;
    const cells = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    // align to the end of the current week (Saturday)
    const total = weeks * 7;
    const counts = {};
    log().forEach(a => {
      const d = new Date(a.ts); d.setHours(0, 0, 0, 0);
      const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      counts[k] = (counts[k] || 0) + 1;
    });
    for (let i = total - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      const c = counts[k] || 0;
      const level = c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : 3;
      cells.push({ date: d, count: c, level });
    }
    return cells;
  }

  return { weaknesses, recommend, last7, heatmap };
})();
