/* AQ.cert — draws the certificate on a canvas (native Arabic shaping),
   then exports it as PDF via jsPDF (lazy-loaded). Falls back to PNG. */
window.AQ = window.AQ || {};

AQ.cert = (function () {
  const JSPDF_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
  ];

  function loadScript(url) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = url; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  async function ensureJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) return true;
    for (const u of JSPDF_URLS) {
      try { await loadScript(u); if (window.jspdf && window.jspdf.jsPDF) return true; } catch (e) { /* next */ }
    }
    return false;
  }

  function draw({ name, roleLabel, count, avg, dateStr }) {
    const t = AQ.t, ar = AQ.lang === 'ar';
    const W = 1600, H = 1131;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    x.textBaseline = 'middle';
    if (ar) x.direction = 'rtl';

    /* background */
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c141d'); bg.addColorStop(1, '#080d13');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const glow = x.createRadialGradient(W * .8, 0, 50, W * .8, 0, 700);
    glow.addColorStop(0, 'rgba(51,201,255,.12)'); glow.addColorStop(1, 'transparent');
    x.fillStyle = glow; x.fillRect(0, 0, W, H);

    /* border frame */
    x.strokeStyle = '#26394f'; x.lineWidth = 3; x.strokeRect(46, 46, W - 92, H - 92);
    x.strokeStyle = '#33c9ff'; x.lineWidth = 1.5; x.strokeRect(60, 60, W - 120, H - 120);
    /* corner accents */
    x.strokeStyle = '#33c9ff'; x.lineWidth = 5;
    [[60, 60, 1, 1], [W - 60, 60, -1, 1], [60, H - 60, 1, -1], [W - 60, H - 60, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      x.beginPath(); x.moveTo(cx + 60 * sx, cy); x.lineTo(cx, cy); x.lineTo(cx, cy + 60 * sy); x.stroke();
    });

    const sans = ar ? 'Cairo, "Segoe UI", sans-serif' : '"Space Grotesk", "Segoe UI", sans-serif';
    const mono = '"JetBrains Mono", monospace';
    const cx = W / 2;

    /* brand */
    x.textAlign = 'center';
    x.fillStyle = '#33c9ff'; x.font = `700 34px ${sans}`;
    x.fillText(ar ? 'أقوات' : 'AQWAT', cx, 145);
    x.fillStyle = '#586b81'; x.font = `500 17px ${mono}`;
    x.fillText(ar ? 'منصة التدريب الهندسية' : 'ENGINEERING TRAINING PLATFORM', cx, 183);

    /* title */
    x.fillStyle = '#dce7f3'; x.font = `700 62px ${sans}`;
    x.fillText(t('certTitle'), cx, 290);
    /* divider */
    x.strokeStyle = '#33c9ff'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(cx - 180, 340); x.lineTo(cx + 180, 340); x.stroke();

    /* body */
    x.fillStyle = '#8296ac'; x.font = `500 26px ${sans}`;
    x.fillText(t('certBody1'), cx, 415);
    x.fillStyle = '#33c9ff'; x.font = `700 68px ${sans}`;
    x.fillText(name, cx, 505);
    x.strokeStyle = '#26394f'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(cx - 330, 555); x.lineTo(cx + 330, 555); x.stroke();
    x.fillStyle = '#8296ac'; x.font = `500 26px ${sans}`;
    x.fillText(t('certBody2'), cx, 615);
    x.fillText(t('certBody3'), cx, 660);

    /* stats row */
    const stats = [
      [t('certRole'), roleLabel],
      [t('certModules'), String(count)],
      [t('certAvg'), avg + '%'],
      [t('certDate'), dateStr]
    ];
    const bw = 300, gap = 26, total = stats.length * bw + (stats.length - 1) * gap;
    let sx0 = cx - total / 2;
    stats.forEach(([k, v], i) => {
      const bx = sx0 + i * (bw + gap);
      x.fillStyle = 'rgba(16,26,39,.85)'; x.strokeStyle = '#26394f'; x.lineWidth = 1.5;
      roundRect(x, bx, 740, bw, 118, 14); x.fill(); x.stroke();
      x.fillStyle = '#586b81'; x.font = `600 15px ${mono}`; x.textAlign = 'center';
      x.fillText(k.toUpperCase(), bx + bw / 2, 776);
      x.fillStyle = '#dce7f3'; x.font = `700 30px ${sans}`;
      x.fillText(v, bx + bw / 2, 822);
    });

    /* seal */
    x.strokeStyle = '#33c9ff'; x.lineWidth = 3;
    x.beginPath(); x.arc(cx, 975, 52, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = '#26394f'; x.beginPath(); x.arc(cx, 975, 62, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#33c9ff'; x.font = `700 22px ${sans}`;
    x.fillText('✓', cx, 975);
    x.fillStyle = '#586b81'; x.font = `500 14px ${mono}`;
    x.fillText(ar ? 'أقوات · معتمد' : 'AQWAT · VERIFIED', cx, 1058);
    return cv;
  }

  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.arcTo(a + w, b, a + w, b + h, r);
    x.arcTo(a + w, b + h, a, b + h, r);
    x.arcTo(a, b + h, a, b, r);
    x.arcTo(a, b, a + w, b, r);
    x.closePath();
  }

  async function download(data) {
    const cv = draw(data);
    const png = cv.toDataURL('image/png');
    const ok = await ensureJsPDF();
    if (ok) {
      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [800, 565] });
        pdf.addImage(png, 'PNG', 0, 0, 800, 565);
        pdf.save('aqwat-certificate.pdf');
        return 'pdf';
      } catch (e) { /* fall through */ }
    }
    const a = document.createElement('a');
    a.download = 'aqwat-certificate.png'; a.href = png;
    document.body.appendChild(a); a.click(); a.remove();
    return 'png';
  }

  return { download, draw };
})();
