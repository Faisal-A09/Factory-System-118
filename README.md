# Aqwat — Engineering Training Platform  |  أقوات — منصة التدريب الهندسية

Structured multi-file training application (dark theme · EN/AR · RTL).

## Structure  |  البنية
```
index.html          shell (gate, home, dashboard, viewer)
css/main.css        design system — dark identity, RTL, a11y, mobile
js/store.js         safe storage wrapper
js/i18n.js          EN/AR dictionaries
js/registry.js      module registry + role-access matrix
js/quiz-data.js     5 bilingual questions per module
js/quiz.js          quiz engine (pass mark 60%)
js/cert.js          PDF certificate (canvas → jsPDF, PNG fallback)
js/app.js           main controller
modules/*.html      5 standalone training modules (lazy-loaded in an iframe)
```

## Run  |  التشغيل
Any static server, e.g.:
```
python3 -m http.server 8000     # then open http://localhost:8000
```
Opening `index.html` directly from disk also works in most browsers
(classic scripts were used instead of ES modules on purpose).

## Extend  |  التوسعة
- New module → drop `modules/x.html`, add one entry in `js/registry.js`,
  add its questions in `js/quiz-data.js`. Nothing else changes.
- New role → add one entry in `AQ.ROLES` (registry.js).
- New language → add a dictionary in `js/i18n.js`.

3D modules load three.js from cdnjs with jsDelivr/unpkg fallbacks and a
visible bilingual notice if all CDNs fail (offline).

## Enhancement pass (enterprise polish)
Added without changing engineering content or breaking existing features:
- Registry metadata per module: learning objectives (EN/AR), duration, difficulty, prerequisites.
- Dashboard KPI cards (completed, overall progress, avg quiz score, time invested, streak),
  continue-last-module, recently-opened, and a learning-streak counter.
- Quiz v2: shuffled question + answer order, 30s per-question timer, answer explanations,
  and a persisted attempt history (aq_quizlog).
- New localStorage keys: aq_recent, aq_time, aq_streak, aq_last, aq_quizlog.
All strings are bilingual (EN/AR verified at parity) and RTL-aware.

## Advanced analytics pass (8 features)
- Weakness detection & smart recommendations (rule-based, from your own quiz log).
- Full-content search overlay (Ctrl/Cmd+K) across names, objectives, quiz Q&A — with highlighting.
- Maintenance board (tasks saved locally on this device).
- Content assistant: answers from platform content by keyword retrieval. NOT an AI language model,
  labeled as such; works fully offline with no API key.
- Weekly activity bar chart + 10-week activity heatmap.
- Guided practice mode: step-by-step checkpoints from each module's objectives.
- Equipment KPI dashboard — clearly labeled SAMPLE data, not live telemetry.
- Offline: three.js bundled locally (vendor/three.min.js), fonts fall back gracefully,
  and a service worker (sw.js) caches the app shell + modules for offline use.

New localStorage keys: aq_maint, aq_practice.
Honest limits: progress/quizzes/maintenance are device-local (no server); the equipment
dashboard is illustrative; the assistant retrieves content and is not a generative AI.
