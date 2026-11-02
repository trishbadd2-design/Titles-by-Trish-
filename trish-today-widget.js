// Trish Today — Scriptable widget
// Shows what you're shooting and posting today and tomorrow, from both apps:
// 💅 / 🌸 Trish Badd shoot days, 📌 Pinterest pins, 📚 Titles by Trish videos.
//
// Setup: https://trishbadd2-design.github.io/Titles-by-Trish-/widget-setup.html
// Widget parameter (optional, long-press the widget → Edit Widget → Parameter):
//   badd  = Trish Badd only   ·   books = Titles by Trish only   ·   empty = both

const DB = 'https://titles-by-trish-default-rtdb.firebaseio.com';
const BADD_APP = 'https://trishbadd2-design.github.io/Titles-by-Trish-/trish-badd/';
const BOOKS_APP = 'https://trishbadd2-design.github.io/Titles-by-Trish-/';

const BG = new Color('#141210');
const GOLD = new Color('#c9a66b');
const GOLD_SOFT = new Color('#e2c58f');
const INK = new Color('#f3ead9');
const DIM = new Color('#f3ead9', 0.55);
const LINE = new Color('#c9a66b', 0.25);

const mode = String(args.widgetParameter || '').trim().toLowerCase();
const showBadd = mode !== 'books';
const showBooks = mode !== 'badd';

const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
function fmtTime(t) {
  if (!/^\d{1,2}:\d{2}$/.test(t || '')) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + (m ? ':' + pad(m) : '') + ' ' + ap;
}

async function getJSON(url) {
  const r = new Request(url);
  r.timeoutInterval = 15;
  return await r.loadJSON();
}

// Fetch both feeds; remember the last good copy so the widget still works offline
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), 'trish-today-cache.json');
let data = { badd: {}, books: { items: [] }, offline: false };
try {
  const [badd, books] = await Promise.all([
    showBadd ? getJSON(DB + '/trishbad/posts.json') : Promise.resolve({}),
    showBooks ? getJSON(DB + '/widget/tbt.json') : Promise.resolve({ items: [] })
  ]);
  data.badd = badd || {};
  data.books = books || { items: [] };
  fm.writeString(cachePath, JSON.stringify(data));
} catch (e) {
  if (fm.fileExists(cachePath)) { data = JSON.parse(fm.readString(cachePath)); }
  data.offline = true;
}

// Normalize everything into { date, time, icon, title, where }
const items = [];
if (showBadd) {
  Object.values(data.badd || {}).forEach(p => {
    if (!p || !p.date || p.status === 'Posted') return;
    const raw = String(p.title || '');
    let icon = '✨';
    if (/^📌/.test(raw)) icon = '📌';
    else if (/\[XXL Nail Diaries\]/.test(raw)) icon = '💅';
    else if (/\[Scent Diaries\]/.test(raw)) icon = '🌸';
    const title = raw.replace(/^📌\s*Pin:\s*/, '').replace(/^\[[^\]]*\]\s*/, '');
    items.push({ date: p.date, time: p.time || '', icon, title, where: p.where || '' });
  });
}
if (showBooks) {
  ((data.books && data.books.items) || []).forEach(x => {
    if (!x || !x.d || x.done) return;
    items.push({ date: x.d, time: x.tm || '', icon: x.pin ? '📌' : '📚', title: String(x.t || '').replace(/^\[[^\]]*\]\s*/, '').replace(/^[^\p{L}\p{N}"'“(]+/u, ''), where: x.pin ? 'Pinterest · Titles by Trish' : 'TikTok + Instagram · Titles by Trish' });
  });
}
const byTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');
const now = new Date();
const today = ymd(now);
const tmr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return ymd(d); })();
const todayItems = items.filter(i => i.date === today).sort(byTime);
const tmrItems = items.filter(i => i.date === tmr).sort(byTime);

// ── Build the widget ──
const family = config.widgetFamily || 'large';
const w = new ListWidget();
w.backgroundColor = BG;
w.setPadding(14, 14, 12, 14);
w.url = mode === 'books' ? BOOKS_APP : BADD_APP;
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

const head = w.addStack();
head.centerAlignContent();
const brand = head.addText(mode === 'books' ? '✦ TITLES BY TRISH' : mode === 'badd' ? '✦ TRISH BADD' : '✦ TRISH TODAY');
brand.font = Font.semiboldSystemFont(10);
brand.textColor = GOLD;
head.addSpacer();
const dateTxt = head.addText(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
dateTxt.font = Font.systemFont(10);
dateTxt.textColor = DIM;

function addRow(item, small) {
  w.addSpacer(small ? 4 : 6);
  const row = w.addStack();
  row.layoutHorizontally();
  row.topAlignContent();
  const ic = row.addText(item.icon);
  ic.font = Font.systemFont(small ? 12 : 14);
  row.addSpacer(6);
  const col = row.addStack();
  col.layoutVertically();
  const t = col.addText(item.title);
  t.font = new Font('Georgia-Bold', small ? 12 : 14);
  t.textColor = INK;
  t.lineLimit = small ? 2 : 1;
  const meta = [fmtTime(item.time), item.where].filter(Boolean).join(' · ');
  if (meta && !small) {
    const m = col.addText(meta);
    m.font = Font.systemFont(10);
    m.textColor = GOLD_SOFT;
    m.lineLimit = 1;
  }
}
function addSection(label, list, max, small) {
  w.addSpacer(small ? 6 : 8);
  const l = w.addText(label.toUpperCase());
  l.font = Font.semiboldSystemFont(9);
  l.textColor = GOLD;
  if (!list.length) {
    w.addSpacer(3);
    const e = w.addText('Nothing planned — enjoy it ✨');
    e.font = Font.italicSystemFont(11);
    e.textColor = DIM;
    return;
  }
  list.slice(0, max).forEach(i => addRow(i, small));
  if (list.length > max) {
    w.addSpacer(3);
    const more = w.addText('+' + (list.length - max) + ' more');
    more.font = Font.systemFont(10);
    more.textColor = DIM;
  }
}

if (family === 'small') {
  addSection('Today · ' + todayItems.length, todayItems, 2, true);
} else if (family === 'medium') {
  addSection('Today', todayItems, 3, false);
} else {
  addSection('Today', todayItems, 5, false);
  addSection('Tomorrow', tmrItems, 3, false);
}
w.addSpacer();
if (data.offline) {
  const off = w.addText('Offline — showing last update');
  off.font = Font.systemFont(9);
  off.textColor = DIM;
}

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentLarge();
}
Script.complete();
