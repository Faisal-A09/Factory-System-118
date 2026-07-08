/* AQ.store — safe localStorage wrapper with in-memory fallback */
window.AQ = window.AQ || {};
AQ.store = (function () {
  let mem = {};
  try {
    const k = '__aq_t';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return {
      get: k => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      del: k => localStorage.removeItem(k),
      json: (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch (e) { return fb; } }
    };
  } catch (e) {
    return {
      get: k => mem[k] ?? null,
      set: (k, v) => { mem[k] = String(v); },
      del: k => { delete mem[k]; },
      json: (k, fb) => { try { return JSON.parse(mem[k]) ?? fb; } catch (e2) { return fb; } }
    };
  }
})();
