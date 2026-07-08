/* AQ.equipment — Equipment KPI dashboard.
   NOTE: this uses clearly-labeled SAMPLE data, not live telemetry.
   A static site has no equipment feed; these figures are illustrative
   so trainees can practice reading an operations dashboard. */
window.AQ = window.AQ || {};

AQ.equipment = (function () {
  /* Deterministic pseudo-values so the dashboard looks stable per session
     but still "lives" a little. Tied to module domains you already have. */
  const UNITS = [
    { id: 'gen', mod: 'ele',  en: 'Standby Generators', ar: 'مولدات الطوارئ', unit: '×7', metric: 'availability', base: 98 },
    { id: 'ats', mod: 'ele',  en: 'ATS Transfer',        ar: 'مفاتيح التحويل',  unit: '×8', metric: 'health',       base: 95 },
    { id: 'ro',  mod: 'aws',  en: 'RO Plant',            ar: 'محطة التناضح',    unit: '600 m³/d', metric: 'output',  base: 92 },
    { id: 'fire',mod: 'aws',  en: 'Fire Pumps',          ar: 'مضخات الحريق',    unit: '×3', metric: 'readiness',    base: 99 },
    { id: 'comp',mod: 'mr4',  en: 'MR4 Compressors',     ar: 'ضواغط MR4',       unit: '×15', metric: 'load',        base: 74 },
    { id: 'cond',mod: 'mr4',  en: 'Condensers',          ar: 'المكثفات',        unit: '×9', metric: 'efficiency',   base: 88 },
    { id: 'hvac',mod: 'hatchback', en: 'Hatchback HVAC', ar: 'تكييف الهاتشباك', unit: '×8', metric: 'health',       base: 90 },
    { id: 'line',mod: 'poultry',   en: 'Poultry Line',   ar: 'خط الدواجن',      unit: 'OEE', metric: 'oee',         base: 82 }
  ];

  function jitter(base) {
    // small time-based wobble, ±3, stable within the same minute
    const seed = Math.floor(Date.now() / 60000);
    const n = Math.sin(seed * 9301 + base * 49297) * 43758.5453;
    return Math.max(60, Math.min(100, Math.round(base + ((n - Math.floor(n)) * 6 - 3))));
  }
  function status(v) { return v >= 90 ? 'ok' : v >= 75 ? 'warn' : 'crit'; }

  function readings() {
    return UNITS.map(u => {
      const v = jitter(u.base);
      return { id: u.id, mod: u.mod, name: (AQ.lang === 'ar' ? u.ar : u.en), unit: u.unit,
               metric: u.metric, value: v, status: status(v) };
    });
  }
  function summary() {
    const r = readings();
    return { avg: Math.round(r.reduce((a, b) => a + b.value, 0) / r.length),
             ok: r.filter(x => x.status === 'ok').length,
             warn: r.filter(x => x.status === 'warn').length,
             crit: r.filter(x => x.status === 'crit').length, total: r.length };
  }
  return { readings, summary };
})();
