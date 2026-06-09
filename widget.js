// TitlesByTrish — Scriptable Widget
// ─────────────────────────────────
// 1. Install Scriptable (free) from the App Store
// 2. In your TitlesByTrish app tap "Sync Widget Data" — save the file to
//    Files → iCloud Drive → Scriptable → titlesbytrish-widget.json
// 3. Add a Scriptable widget to your home screen and pick this script

const fm = FileManager.iCloud();
const dataPath = fm.joinPath(fm.documentsDirectory(), 'titlesbytrish-widget.json');

let data = { followers: 0, videosPosted: 0, totalVideos: 75, booksRead: 0, readingStreak: 0, lastUpdated: 'Not synced yet' };

try {
  if (fm.fileExists(dataPath)) {
    await fm.downloadFileFromiCloud(dataPath);
    data = JSON.parse(fm.readString(dataPath));
  }
} catch(e) {}

const BG     = new Color('#07050a');
const GOLD   = new Color('#c8a050');
const GOLD2  = new Color('#c8a050', 0.55);
const GOLD3  = new Color('#c8a050', 0.12);
const WHITE  = Color.white();
const DIM    = new Color('#e8dcc8', 0.55);
const RED    = new Color('#8b1a1a');

const w = new ListWidget();
w.backgroundColor = BG;
w.setPadding(14, 14, 12, 14);

const grad = new LinearGradient();
grad.colors = [new Color('#130d18'), BG];
grad.locations = [0, 1];
w.backgroundGradient = grad;

// ── Header ──
const hdr = w.addText('✦  TitlesByTrish  ✦');
hdr.font = new Font('Georgia', 9);
hdr.textColor = GOLD2;
hdr.centerAlignText();

w.addSpacer(8);

// ── Follower count ──
const folNum = w.addText(Number(data.followers).toLocaleString());
folNum.font = Font.boldRoundedSystemFont(34);
folNum.textColor = WHITE;
folNum.centerAlignText();

const folLbl = w.addText('F O L L O W E R S');
folLbl.font = Font.systemFont(7);
folLbl.textColor = GOLD2;
folLbl.centerAlignText();

w.addSpacer(10);

// ── Progress bar ──
const pct = data.totalVideos > 0 ? Math.min(data.videosPosted / data.totalVideos, 1) : 0;
const BAR_W = 230, BAR_H = 7;
const dc = new DrawContext();
dc.size = new Size(BAR_W, BAR_H);
dc.opaque = false;
// track
dc.setFillColor(new Color('#ffffff', 0.06));
const trackPath = new Path();
trackPath.addRoundedRect(new Rect(0, 0, BAR_W, BAR_H), 3, 3);
dc.addPath(trackPath);
dc.fillPath();
// fill
if (pct > 0) {
  const grad2 = new LinearGradient();
  grad2.colors = [RED, GOLD];
  grad2.locations = [0, 1];
  dc.setFillColor(GOLD);
  const fillPath = new Path();
  fillPath.addRoundedRect(new Rect(0, 0, BAR_W * pct, BAR_H), 3, 3);
  dc.addPath(fillPath);
  dc.fillPath();
}
const barImg = w.addImage(dc.getImage());
barImg.centerAlignImage();
barImg.imageSize = new Size(BAR_W, BAR_H);

w.addSpacer(3);

const progLbl = w.addText(`${data.videosPosted} of ${data.totalVideos} videos posted`);
progLbl.font = Font.systemFont(8);
progLbl.textColor = DIM;
progLbl.centerAlignText();

w.addSpacer(10);

// ── Stats row ──
const row = w.addStack();
row.layoutHorizontally();
row.centerAlignContent();
row.spacing = 0;

function addStat(stack, num, label) {
  const s = stack.addStack();
  s.layoutVertically();
  s.centerAlignContent();
  const n = s.addText(String(num));
  n.font = Font.boldRoundedSystemFont(20);
  n.textColor = GOLD;
  n.centerAlignText();
  const l = s.addText(label);
  l.font = Font.systemFont(7);
  l.textColor = GOLD2;
  l.centerAlignText();
}

function addDivider(stack) {
  const d = stack.addText('|');
  d.font = Font.systemFont(18);
  d.textColor = new Color('#c8a050', 0.2);
}

addStat(row, data.booksRead, 'BOOKS READ');
row.addSpacer();
addDivider(row);
row.addSpacer();
addStat(row, data.readingStreak, 'DAY STREAK');

w.addSpacer(8);

// ── Updated ──
const upd = w.addText('synced ' + data.lastUpdated);
upd.font = Font.systemFont(7);
upd.textColor = new Color('#e8dcc8', 0.25);
upd.centerAlignText();

// ── Tap to open app ──
w.url = 'https://trishbadd2-design.github.io/Titles-by-Trish-/';

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  await w.presentMedium();
}
Script.complete();
