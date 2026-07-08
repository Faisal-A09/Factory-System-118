/* AQ.search — full-content index across modules: names, descriptions,
   objectives, and quiz questions/explanations. Bilingual, with highlight. */
window.AQ = window.AQ || {};

AQ.search = (function () {
  let index = null;

  function build() {
    index = [];
    AQ.MODULES.forEach(m => {
      ['en', 'ar'].forEach(lang => {
        const L = m[lang] || m.en;
        const parts = [L.name, L.desc];
        if (m.meta) {
          const obj = lang === 'ar' ? m.meta.objAr : m.meta.objEn;
          if (obj) parts.push(obj.join(' '));
        }
        (AQ.QUIZZES[m.id] || []).forEach(q => { const ql = q[lang] || q.en; parts.push(ql.q + ' ' + ql.o.join(' ')); });
        (AQ.QUIZ_EX && AQ.QUIZ_EX[m.id] || []).forEach(e => parts.push(e[lang] || e.en));
        index.push({ id: m.id, lang, text: parts.join(' \u00b7 ').replace(/&amp;/g, '&') });
      });
    });
  }

  function strip(s) { return String(s).replace(/&amp;/g, '&'); }

  function query(q) {
    if (!index) build();
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    const byId = {};
    index.filter(row => row.lang === AQ.lang).forEach(row => {
      const hay = row.text.toLowerCase();
      let score = 0;
      terms.forEach(t => { let i = 0; while ((i = hay.indexOf(t, i)) !== -1) { score++; i += t.length; } });
      if (score > 0) {
        const m = AQ.MODULES.find(x => x.id === row.id);
        // extract a snippet around the first match
        const first = hay.indexOf(terms[0]);
        const start = Math.max(0, first - 30);
        let snip = row.text.slice(start, start + 120);
        byId[row.id] = { id: row.id, m, score, snippet: (start > 0 ? '…' : '') + snip + '…' };
      }
    });
    return Object.values(byId).sort((a, b) => b.score - a.score);
  }

  function highlight(text, q) {
    const terms = (q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    let out = strip(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    terms.forEach(t => {
      if (!t) return;
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  return { query, highlight, rebuild: build };
})();
