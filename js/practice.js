/* AQ.practice — guided practice mode: step-by-step checkpoints per module.
   Steps derive from each module's learning objectives (real content).
   Progress saved to localStorage per module. */
window.AQ = window.AQ || {};

AQ.practice = (function () {
  function steps(m) {
    const obj = (m.meta && (AQ.lang === 'ar' ? m.meta.objAr : m.meta.objEn)) || [];
    return obj.slice();
  }
  function state(id) { return AQ.store.json('aq_practice', {})[id] || { done: [], completedAt: null }; }
  function saveState(id, st) {
    const all = AQ.store.json('aq_practice', {}); all[id] = st; AQ.store.set('aq_practice', JSON.stringify(all));
  }
  function toggle(id, idx, total) {
    const st = state(id); const i = st.done.indexOf(idx);
    if (i >= 0) st.done.splice(i, 1); else st.done.push(idx);
    st.completedAt = (st.done.length >= total && total > 0) ? Date.now() : null;
    saveState(id, st); return st;
  }
  function progress(id, total) { const st = state(id); return total ? Math.round(st.done.length / total * 100) : 0; }
  return { steps, state, toggle, progress };
})();
