/* AQ.maint — maintenance board (notes / tasks) saved to localStorage.
   Real and usable, but device-local (no shared server). */
window.AQ = window.AQ || {};

AQ.maint = (function () {
  function all() { return AQ.store.json('aq_maint', []); }
  function save(list) { AQ.store.set('aq_maint', JSON.stringify(list)); }

  function add(task) {
    const list = all();
    list.unshift({
      id: 'mt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: task.title || '', module: task.module || '', priority: task.priority || 'med',
      status: 'open', ts: Date.now()
    });
    save(list); return list;
  }
  function update(id, patch) {
    const list = all(); const t = list.find(x => x.id === id);
    if (t) Object.assign(t, patch);
    save(list); return list;
  }
  function remove(id) { const list = all().filter(x => x.id !== id); save(list); return list; }
  function counts() {
    const list = all();
    return { open: list.filter(x => x.status === 'open').length,
             done: list.filter(x => x.status === 'done').length,
             total: list.length };
  }
  return { all, add, update, remove, counts };
})();
