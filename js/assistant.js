/* AQ.assistant — content helper (NOT a language model).
   Answers by keyword-matching the user's question to platform content:
   module descriptions, learning objectives, and quiz explanations.
   Fully offline, no API key. Honest by design: it retrieves, doesn't generate. */
window.AQ = window.AQ || {};

AQ.assistant = (function () {
  const STOP = new Set(['the','a','an','is','are','of','to','in','on','for','and','or','what','how','why','when','which','does','do','with','me','my','i','it','this','that','ما','هو','هي','كيف','لماذا','متى','ماذا','في','على','من','عن','و','ال','هذا','هذه']);

  function tokens(s) {
    return String(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(t => t && !STOP.has(t));
  }

  /* Build a searchable corpus of "answer units" from real content. */
  function corpus() {
    const units = [];
    AQ.MODULES.forEach(m => {
      const L = m[AQ.lang] || m.en;
      units.push({ id: m.id, kind: 'desc', text: L.desc.replace(/&amp;/g, '&'), title: L.name.replace(/&amp;/g, '&') });
      if (m.meta) {
        const obj = AQ.lang === 'ar' ? m.meta.objAr : m.meta.objEn;
        (obj || []).forEach(o => units.push({ id: m.id, kind: 'obj', text: o, title: L.name.replace(/&amp;/g, '&') }));
      }
      (AQ.QUIZ_EX && AQ.QUIZ_EX[m.id] || []).forEach(e => units.push({ id: m.id, kind: 'fact', text: e[AQ.lang] || e.en, title: L.name.replace(/&amp;/g, '&') }));
    });
    return units;
  }

  function ask(question) {
    const qTok = tokens(question);
    if (!qTok.length) return null;
    const units = corpus();
    let best = null, bestScore = 0;
    const ranked = units.map(u => {
      const uTok = new Set(tokens(u.text + ' ' + u.title));
      let s = 0; qTok.forEach(t => { if (uTok.has(t)) s += 2; else { uTok.forEach(w => { if (w.includes(t) || t.includes(w)) s += 1; }); } });
      return { u, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);

    if (!ranked.length) return { found: false };
    const top = ranked[0].u;
    const related = [...new Set(ranked.slice(0, 4).map(x => x.u.id))];
    return { found: true, answer: top.text, moduleId: top.id, moduleTitle: top.title, related };
  }

  return { ask };
})();
