/* AQ.registry — training modules, roles, icons */
window.AQ = window.AQ || {};

AQ.ICONS = {
  ele: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  aws: '<svg viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/><path d="M9 14a3 3 0 0 0 3 3"/></svg>',
  mr4: '<svg viewBox="0 0 24 24"><path d="M12 2v20M4 6l16 12M20 6 4 18M12 2l-2 3M12 2l2 3M12 22l-2-3M12 22l2-3"/></svg>',
  hatchback: '<svg viewBox="0 0 24 24"><path d="M4 8h10a3 3 0 1 0-3-3M2 12h16a3 3 0 1 1-3 3M4 16h6a2.5 2.5 0 1 1-2.5 2.5"/></svg>',
  poultry: '<svg viewBox="0 0 24 24"><path d="M3 16h18M6 16v-4h5l2-3h5v7"/><circle cx="7" cy="19" r="1.4"/><circle cx="12" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>'
};

/* Each module = separate lazily-loaded HTML file under modules/ */
AQ.MODULES = [
  { id: 'ele', dept: 'fcm', abbr: 'ELE', color: '#33c9ff', file: 'modules/ele.html',
    meta: { dur: 18, diff: "intermediate", prereq: [],
      objEn: ["Read the MV single-line diagram", "Explain ATS transfer on utility loss", "Describe UPS and generator roles"], objAr: ["قراءة مخطط الجهد المتوسط أحادي الخط", "شرح تحويل ATS عند انقطاع الشبكة", "توصيف دور UPS والمولدات"] },
    en: { name: 'Compound Power &amp; Security', desc: 'MV 13.8 kV single-line diagram, ATS transfer sequence, generators, UPS, fire &amp; CCTV — with a 3D power simulation.' },
    ar: { name: 'الطاقة والأمن للمجمع', desc: 'مخطط أحادي الخط 13.8 كيلوفولت، تتابع نقل ATS، المولدات، UPS، الإنذار والمراقبة — مع محاكاة ثلاثية الأبعاد للطاقة.' } },
  { id: 'aws', dept: 'fcm', abbr: 'AWS', color: '#38bdf8', file: 'modules/aws.html',
    meta: { dur: 16, diff: "beginner", prereq: [],
      objEn: ["Trace RO water treatment stages", "Explain firefighting pump sequence", "Describe two-stage air compression"], objAr: ["تتبع مراحل معالجة المياه بالتناضح العكسي", "شرح تتابع مضخات الحريق", "توصيف ضغط الهواء على مرحلتين"] },
    en: { name: 'Water, Fire &amp; Air Systems', desc: 'RO water treatment, firefighting pump logic and the compressed-air line — two live 3D process simulations.' },
    ar: { name: 'أنظمة المياه والحريق والهواء', desc: 'معالجة المياه بالتناضح العكسي، منطق مضخات الحريق وخط الهواء المضغوط — محاكاتان ثلاثيتا الأبعاد.' } },
  { id: 'mr4', dept: 'fcm', abbr: 'MR4', color: '#39c4ff', file: 'modules/mr4.html',
    meta: { dur: 22, diff: "advanced", prereq: ["aws"],
      objEn: ["Follow the R-22 refrigeration cycle", "Identify compressor/condenser roles", "Read SCADA + AKC control"], objAr: ["متابعة دورة تبريد R-22", "تحديد أدوار الضواغط والمكثفات", "قراءة تحكم SCADA + AKC"] },
    en: { name: 'MR4 Cooling System', desc: 'R-22 digital twin — 15 compressors, 9 condensers, receiver, expansion and cold-room evaporators with SCADA + AKC.' },
    ar: { name: 'نظام التبريد MR4', desc: 'توأم رقمي لـ R-22 — 15 ضاغطًا، 9 مكثفات، مستقبل سائل، تمدد ومبخرات الغرفة الباردة مع SCADA + AKC.' } },
  { id: 'hatchback', dept: 'fcm', abbr: 'HB', color: '#27c6ff', file: 'modules/hatchback.html',
    meta: { dur: 12, diff: "beginner", prereq: [],
      objEn: ["Match each HVAC unit to its refrigerant", "Distinguish AHU, split, CRAC and cold stores", "Explain the Freon-free FAU"], objAr: ["مطابقة كل وحدة تكييف بغاز تبريدها", "التمييز بين AHU والسبليت وCRAC وغرف التبريد", "شرح وحدة FAU الخالية من الفريون"] },
    en: { name: 'Hatchback HVAC Units', desc: 'Air-conditioning units of the Hatchback area, each mapped to its refrigerant — AHU, split, CRAC, cold stores and more.' },
    ar: { name: 'وحدات تكييف الهاتشباك', desc: 'وحدات التكييف والتبريد لمنطقة الهاتشباك، كل وحدة مرتبطة بغاز التبريد الخاص بها — AHU، سبليت، CRAC، غرف التبريد وغيرها.' } },
  { id: 'poultry', dept: 'foe', abbr: 'POU', color: '#2ee06a', file: 'modules/poultry.html',
    meta: { dur: 20, diff: "intermediate", prereq: [],
      objEn: ["Follow the breast production line end to end", "Identify freezing/frying/packing stages", "Know the weekly PM window"], objAr: ["متابعة خط إنتاج الصدور من البداية للنهاية", "تحديد مراحل التجميد والقلي والتعبئة", "معرفة نافذة الصيانة الأسبوعية"] },
    en: { name: 'Poultry Production Line', desc: 'Interactive 3D digital twin of the chicken-breast factory — defrosting, rinsing, breading, frying, freezing and packing lines.' },
    ar: { name: 'خط إنتاج الدواجن', desc: 'توأم رقمي تفاعلي ثلاثي الأبعاد لمصنع صدور الدجاج — التذويب، الشطف، التغطية، القلي، التجميد وخطوط التعبئة.' } }
];

/* Role-based access: which departments each role may enter.
   Extend by adding a role here — everything else adapts. */
AQ.ROLES = {
  fcm_eng:    { depts: ['fcm'],        color: 'var(--fcm)', en: 'FCM Engineer',  ar: 'مهندس مرافق' },
  foe_eng:    { depts: ['foe'],        color: 'var(--foe)', en: 'FOE Engineer',  ar: 'مهندس عمليات غذاء' },
  supervisor: { depts: ['fcm', 'foe'], color: 'var(--sup)', en: 'Supervisor',    ar: 'مشرف' }
};

AQ.PASS_MARK = 60; /* % required to pass a quiz */
