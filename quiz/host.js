import { connect, DEMO, escapeHtml as esc } from './backend.js';
import { QUESTIONS, MAX_POINTS, score } from './questions.js';

const QUESTION_SECONDS = 60;
const WEAK_BELOW = 0.6; // questions with fewer fully correct answers are flagged for the trainer
const params = new URLSearchParams(location.search);
const $ = (sel) => document.querySelector(sel);

document.getElementById('demo').classList.toggle('hidden', !DEMO);
const be = await connect();

// ---------------------------------------------------------------- room
let code = params.get('room') || localStorage.getItem('quiz-host-room');
if (code && !(await be.roomExists(code))) code = null;
if (!code) code = await createRoom();
localStorage.setItem('quiz-host-room', code);
history.replaceState(null, '', `?room=${code}${params.has('demo') ? '&demo' : ''}`);

const joinUrl = new URL(`./?room=${code}${params.has('demo') ? '&demo' : ''}`, location.href).href;
const shortUrl = new URL('./', location.href).href.replace(/^https?:\/\//, '');
$('#room-info').textContent = `Room ${code}`;

async function createRoom() {
  for (let i = 0; i < 20; i++) {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    if (!(await be.roomExists(c))) { await be.createRoom(c); return c; }
  }
  throw new Error('Could not find a free room code');
}

// ---------------------------------------------------------------- state
let room = null;
let viewKey = '';
let showCorrect = false;
let showTable = false;
let timer = null;

const players = () => Object.entries(room.players || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
const answersFor = (qKey) => room.answers?.[qKey] || {};
const setState = (s) => be.setState(code, s);

const actions = {
  start: () => setState({ phase: 'question', q: 0, qKey: QUESTIONS[0].key, startedAt: Date.now() }),
  close: () => setState({ ...room.state, phase: 'closed' }),
  next: () => {
    const q = room.state.q + 1;
    if (q < QUESTIONS.length) setState({ phase: 'question', q, qKey: QUESTIONS[q].key, startedAt: Date.now() });
    else setState({ phase: 'summary', q: QUESTIONS.length, qKey: '' });
  },
  toggleCorrect: () => { showCorrect = !showCorrect; build(); update(); },
  toggleTable: () => { showTable = !showTable; build(); update(); },
  copy: async () => { await navigator.clipboard.writeText(joinUrl); flash('#copy', 'Link copied'); },
  csv: downloadCsv,
  remove: async () => {
    if (!confirm('Delete all answers of this room? Download the CSV first if you need it.')) return;
    await be.deleteRoom(code);
  },
  newQuiz: async () => { localStorage.removeItem('quiz-host-room'); location.href = `?${params.has('demo') ? 'demo' : ''}`; },
};

function setActions(list) {
  $('#actions').innerHTML = list.map(([id, label, cls = '']) => `<button class="btn ${cls}" id="${id}" data-act="${id}">${label}</button>`).join('');
}
$('#actions').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) actions[b.dataset.act]?.(); });
document.addEventListener('keydown', (e) => {
  if (!['ArrowRight', ' ', 'Enter'].includes(e.key) || e.target.closest('input')) return;
  const primary = $('#actions .btn.alert:not(:disabled)');
  if (primary) { e.preventDefault(); primary.click(); }
});
function flash(sel, text) { const b = $(sel); const old = b.textContent; b.textContent = text; setTimeout(() => (b.textContent = old), 1500); }

// ---------------------------------------------------------------- views
function build() {
  clearInterval(timer);
  const { phase } = room.state;
  if (phase === 'lobby') buildLobby();
  else if (phase === 'question') buildQuestion();
  else if (phase === 'closed') buildResults();
  else buildSummary();
}

function update() {
  const { phase } = room.state;
  if (phase === 'lobby') {
    const list = players();
    $('#count').textContent = list.length;
    const box = $('#players');
    for (const [uid, p] of list) {
      if (box.querySelector(`[data-uid="${CSS.escape(uid)}"]`)) continue;
      box.insertAdjacentHTML('beforeend', `<span class="pill" data-uid="${esc(uid)}">${esc(p.nick)}</span>`);
    }
    $('#start').disabled = list.length === 0;
  } else if (phase === 'question') {
    $('#answered').textContent = Object.keys(answersFor(room.state.qKey)).length;
    $('#joined').textContent = players().length;
  } else if (phase === 'summary') {
    buildSummary();
  }
}

const progress = (q) => `<div class="progress">${QUESTIONS.map((_, i) => `<span class="${i < q ? 'done' : i === q ? 'now' : ''}"></span>`).join('')}</div>`;

function buildLobby() {
  const qr = qrcode(0, 'M');
  qr.addData(joinUrl); qr.make();
  $('#main').innerHTML = `
    <header><div><div class="kicker">Before we start</div><h1>Join the quiz</h1><div class="rule"></div></div>
      <span class="pill">5 questions · about 1 minute each · not an exam</span></header>
    <section class="lobby">
      <div class="qr">${qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true })}</div>
      <div class="join-steps">
        <div><b>1.</b> Scan the QR code with your phone camera</div>
        <div class="muted">or open <span class="url">${esc(shortUrl)}</span> and type the code</div>
        <div class="code">${code}</div>
        <div><b>2.</b> Choose a nickname (no real name needed)</div>
        <div style="margin-top:1em"><span class="count" id="count">0</span> <span class="muted">people have joined</span></div>
        <div class="players" id="players"></div>
      </div>
    </section>`;
  setActions([['copy', 'Copy link for the chat', 'ghost'], ['start', 'Start quiz →', 'alert']]);
}

function buildQuestion() {
  const { q, startedAt } = room.state;
  const Q = QUESTIONS[q];
  $('#main').innerHTML = `
    <header><div><div class="kicker">Question ${q + 1} of ${QUESTIONS.length}${Q.multi ? ' · ' + Q.hint : ''}</div>${progress(q)}</div></header>
    <h1 class="question">${esc(Q.text)}</h1>
    <section class="options">${Object.entries(Q.options).map(([l, t]) =>
      `<div class="option opt-${l}"><span class="letter">${l}</span><span>${esc(t)}</span></div>`).join('')}</section>
    <div class="status-row" style="margin-top:auto">
      <div class="timer" id="timer"></div>
      <div><span class="count" id="answered">0</span> <span class="muted">/ <span id="joined">0</span> answered</span></div>
    </div>`;
  const tick = () => {
    const left = Math.max(0, QUESTION_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
    const t = $('#timer'); if (!t) return;
    t.textContent = left; t.style.setProperty('--p', left / QUESTION_SECONDS);
  };
  tick(); timer = setInterval(tick, 500);
  setActions([['close', 'Close answers →', 'alert']]);
}

function buildResults() {
  const { q } = room.state;
  const Q = QUESTIONS[q];
  const answers = Object.values(answersFor(Q.key));
  const n = answers.length;
  const counts = Object.fromEntries(Object.keys(Q.options).map((l) => [l, answers.filter((a) => a.choice.includes(l)).length]));
  const max = Math.max(1, ...Object.values(counts));
  $('#main').innerHTML = `
    <header><div><div class="kicker">Question ${q + 1} of ${QUESTIONS.length} · ${n} answer${n === 1 ? '' : 's'}</div>${progress(q)}</div></header>
    <h1 class="question">${esc(Q.text)}</h1>
    <section class="bars">${Object.entries(Q.options).map(([l, t]) => {
      const ok = Q.correct.includes(l);
      const cls = showCorrect ? (ok ? 'correct' : 'dim') : '';
      return `<div class="bar-row opt-${l} ${cls}"><span class="letter">${l}</span>
        <div class="bar"><i data-w="${(counts[l] / max) * 100}"></i></div>
        <span class="bar-num">${counts[l]}${showCorrect && ok ? ' <span class="tick">✓</span>' : ''}</span>
        <span class="bar-label">${esc(t)}</span></div>`;
    }).join('')}</section>`;
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.bar i').forEach((i) => (i.style.width = i.dataset.w + '%'))));
  const last = q === QUESTIONS.length - 1;
  setActions([['toggleCorrect', showCorrect ? 'Hide correct answer' : 'Show correct answer', 'ghost'], ['next', last ? 'See class results →' : 'Next question →', 'alert']]);
}

function results() {
  return players().map(([uid, p]) => {
    const per = QUESTIONS.map((Q) => { const choice = answersFor(Q.key)[uid]?.choice || ''; return { choice, points: score(Q, choice) }; });
    return { nick: p.nick, per, total: per.reduce((s, x) => s + x.points, 0) };
  });
}

function buildSummary() {
  const rows = results();
  const n = rows.length;
  const avg = n ? rows.reduce((s, r) => s + r.total, 0) / n : 0;
  const stats = QUESTIONS.map((Q, i) => {
    const answered = rows.filter((r) => r.per[i].choice);
    const full = answered.filter((r) => r.per[i].points === 2).length;
    return { Q, answered: answered.length, rate: answered.length ? full / answered.length : 0 };
  });
  const weak = stats.filter((s) => s.answered && s.rate < WEAK_BELOW).sort((a, b) => a.rate - b.rate);
  $('#main').innerHTML = `
    <header><div><div class="kicker">Class results</div><h1>What we already know</h1><div class="rule"></div></div></header>
    <section class="summary">
      <div class="card">
        <h3 style="margin-bottom:.6em">Fully correct answers per objective</h3>
        ${stats.map((s) => `<div class="lo-row ${s.answered && s.rate < WEAK_BELOW ? 'weak' : ''}">
          <b>${esc(s.Q.lo)}</b><div class="bar"><i style="width:${Math.round(s.rate * 100)}%"></i></div><span class="bar-num">${Math.round(s.rate * 100)}%</span>
          ${s.answered && s.rate < WEAK_BELOW ? `<span class="why">Common belief: ${esc(s.Q.misconception)}</span>` : ''}</div>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:1.2em">
        <div class="card"><div class="big-stat">${avg.toFixed(1)}<span class="muted" style="font-size:.4em"> / ${MAX_POINTS}</span></div>
          <div class="muted">average score · ${n} participant${n === 1 ? '' : 's'}</div></div>
        <div class="card"><h3 style="margin-bottom:.4em">Spend more time on</h3>
          ${weak.length ? weak.map((s) => `<div>• <b>${esc(s.Q.lo)}</b></div>`).join('') : '<div class="muted">Nothing stands out: well done!</div>'}</div>
      </div>
    </section>
    ${showTable ? `<section class="card"><table><tr><th>Nickname</th>${QUESTIONS.map((_, i) => `<th>Q${i + 1}</th>`).join('')}<th>Total</th></tr>
      ${rows.map((r) => `<tr><td>${esc(r.nick)}</td>${r.per.map((x) => `<td>${x.choice || '–'} (${x.points})</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</table></section>` : ''}`;
  setActions([['toggleTable', showTable ? 'Hide individual scores' : 'Individual scores', 'ghost'], ['csv', 'Download CSV', 'ghost'],
    ['remove', 'Delete data', 'ghost'], ['newQuiz', 'New quiz']]);
}

function downloadCsv() {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const head = ['nickname', ...QUESTIONS.map((_, i) => `q${i + 1}_answer`), ...QUESTIONS.map((_, i) => `q${i + 1}_points`), 'total'];
  const lines = results().map((r) => [q(r.nick), ...r.per.map((x) => x.choice), ...r.per.map((x) => x.points), r.total].join(','));
  const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `quiz-${code}-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

function renderDeleted() {
  clearInterval(timer);
  $('#main').innerHTML = `<header><div><div class="kicker">Room ${code}</div><h1>The data of this room was deleted</h1><div class="rule"></div></div></header>`;
  setActions([['newQuiz', 'New quiz', 'alert']]);
}
function renderNotHost() {
  $('#main').innerHTML = `<header><div><div class="kicker">Room ${code}</div><h1>This room was opened on another device</h1><div class="rule"></div></div></header>`;
  setActions([['newQuiz', 'Start a new quiz', 'alert']]);
}

// Start listening last: the demo backend calls back immediately
be.watchRoom(code, (r) => {
  room = r;
  if (!room) return renderDeleted();
  if (room.hostUid !== be.uid) return renderNotHost();
  const key = `${room.state.phase}:${room.state.q}`;
  if (key !== viewKey) { viewKey = key; showCorrect = false; showTable = false; build(); }
  update();
});
