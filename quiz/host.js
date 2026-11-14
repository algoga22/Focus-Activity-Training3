import { connect, DEMO, escapeHtml as esc } from './backend.js';
import { QUESTIONS, MAX_POINTS, score } from './questions.js';
import { SCENES } from './scenes.js';
import { wordmark, avatar, TRAINERS, TRAINING, BOOTCAMP } from './brand.js';

const QUESTION_SECONDS = 60;
const HURRY_SECONDS = 10;
const WEAK_BELOW = 0.6; // questions with fewer fully correct answers are flagged for the trainer
const params = new URLSearchParams(location.search);
const $ = (sel) => document.querySelector(sel);

document.getElementById('demo').classList.toggle('hidden', !DEMO);
$('#credits').innerHTML = `<i class="fa-solid fa-user-shield"></i> Trainers: ${esc(TRAINERS)} · University of Luxembourg<br>${esc(BOOTCAMP)}`;
const be = await connect();

// ---------------------------------------------------------------- room
let code = params.get('room') || localStorage.getItem('quiz-host-room');
if (code && !(await be.roomExists(code))) code = null;
if (!code) code = await createRoom();
localStorage.setItem('quiz-host-room', code);
history.replaceState(null, '', `?room=${code}${params.has('demo') ? '&demo' : ''}`);

const joinUrl = new URL(`./?room=${code}${params.has('demo') ? '&demo' : ''}`, location.href).href;
const shortUrl = new URL('./', location.href).href.replace(/^https?:\/\//, '');
$('#topbar').innerHTML = `${wordmark()}<div class="right"><span class="pill purple"><i class="fa-solid fa-shield-halved"></i> ${esc(TRAINING)}</span>
  <span class="pill"><i class="fa-solid fa-hashtag"></i> Room ${code}</span></div>`;

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
  copy: async () => { await navigator.clipboard.writeText(joinUrl); flash('#copy', '<i class="fa-solid fa-check"></i> Link copied'); },
  csv: downloadCsv,
  remove: async () => {
    if (!confirm('Delete all answers of this room? Download the CSV first if you need it.')) return;
    await be.deleteRoom(code);
  },
  restart: async () => {
    if (!confirm('Restart the quiz from the beginning?\n\nAll answers will be deleted. Participants stay connected and do not need to scan the QR code again.')) return;
    await be.resetRoom(code);
  },
  newQuiz: async () => { localStorage.removeItem('quiz-host-room'); location.href = `?${params.has('demo') ? 'demo' : ''}`; },
};

const RESTART = ['restart', '<i class="fa-solid fa-rotate-left"></i> Restart', 'danger'];
function setActions(list) {
  $('#actions').innerHTML = list.map(([id, label, cls = '']) => `<button class="btn ${cls}" id="${id}" data-act="${id}">${label}</button>`).join('');
}
$('#actions').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) actions[b.dataset.act]?.(); });
document.addEventListener('keydown', (e) => {
  if (!['ArrowRight', ' ', 'Enter'].includes(e.key) || e.target.closest('input')) return;
  const primary = $('#actions .btn.alert:not(:disabled)');
  if (primary) { e.preventDefault(); primary.click(); }
});
function flash(sel, html) { const b = $(sel); const old = b.innerHTML; b.innerHTML = html; setTimeout(() => (b.innerHTML = old), 1500); }
const grow = () => requestAnimationFrame(() => requestAnimationFrame(() =>
  document.querySelectorAll('[data-w]').forEach((el) => (el.style.width = el.dataset.w + '%'))));

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
      box.insertAdjacentHTML('beforeend', `<span class="player-chip" data-uid="${esc(uid)}">${avatar(uid)}${esc(p.nick)}</span>`);
    }
    $('#start').disabled = list.length === 0;
  } else if (phase === 'question') {
    const answered = Object.keys(answersFor(room.state.qKey));
    $('#answered').textContent = answered.length;
    $('#joined').textContent = players().length;
    const box = $('#answered-avatars');
    for (const uid of answered) {
      if (!box.querySelector(`[data-uid="${CSS.escape(uid)}"]`)) box.insertAdjacentHTML('beforeend', avatar(uid).replace('class="avatar ', `data-uid="${esc(uid)}" class="avatar `));
    }
  }
}

const progress = (q) => `<div class="progress">${QUESTIONS.map((_, i) => `<span class="${i < q ? 'done' : i === q ? 'now' : ''}"></span>`).join('')}</div>`;
const qHead = (q, extra = '') => `<div class="q-head"><div>
    <div class="kicker"><i class="fa-solid fa-triangle-exclamation"></i>Incident ${q + 1} of ${QUESTIONS.length}${extra}</div>${progress(q)}</div>
    <span class="pill"><i class="fa-solid fa-${QUESTIONS[q].loIcon}"></i> ${esc(QUESTIONS[q].lo)}</span></div>`;

function buildLobby() {
  const qr = qrcode(0, 'M');
  qr.addData(joinUrl); qr.make();
  $('#main').innerHTML = `
    <section class="lobby">
      <div class="qr-wrap"><div class="qr">${qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true })}</div></div>
      <div class="join">
        <div class="kicker"><i class="fa-solid fa-tower-broadcast"></i>Incident response team · assembling</div>
        <h1>Join the <span>response team</span></h1>
        <div class="steps">
          <span class="step"><b>1</b> Scan the QR code with your phone camera</span>
          <span class="step"><b>2</b> Pick a nickname or a cyber name</span>
        </div>
        <div class="code-box"><span class="muted">or go to <span class="url">${esc(shortUrl)}</span> and enter</span><span class="code">${code}</span></div>
        <div class="crew">
          <div class="crew-head"><span class="count" id="count">0</span><span class="muted">responders ready · 5 incidents · about 1 minute each · not an exam</span></div>
          <div class="players" id="players"></div>
        </div>
      </div>
    </section>`;
  setActions([['copy', '<i class="fa-solid fa-link"></i> Copy link for the chat', 'ghost'], ['start', 'Start the quiz <i class="fa-solid fa-arrow-right"></i>', 'alert']]);
}

const optionTiles = (Q) => Object.entries(Q.options).map(([l, t]) =>
  `<div class="option opt-${l}"><span class="letter">${l}</span><i class="ico fa-solid fa-${Q.icons[l]}"></i><span>${esc(t)}</span></div>`).join('');

function buildQuestion() {
  const { q, startedAt } = room.state;
  const Q = QUESTIONS[q];
  $('#main').innerHTML = `
    ${qHead(q, Q.multi ? ' · ' + Q.hint : '')}
    <section class="q-layout">
      <div><h1 class="question">${esc(Q.text)}</h1><div class="options">${optionTiles(Q)}</div></div>
      <aside class="side">
        ${SCENES[Q.key]}
        <div class="status-row">
          <div class="timer" id="timer"></div>
          <div><span class="count" id="answered">0</span> <span class="muted">/ <span id="joined">0</span> answered</span></div>
        </div>
        <div class="answered-avatars" id="answered-avatars"></div>
      </aside>
    </section>`;
  const tick = () => {
    const left = Math.max(0, QUESTION_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
    const t = $('#timer'); if (!t) return;
    t.textContent = left; t.style.setProperty('--p', left / QUESTION_SECONDS);
    t.classList.toggle('hurry', left <= HURRY_SECONDS);
  };
  tick(); timer = setInterval(tick, 500);
  setActions([RESTART, ['close', 'Close answers <i class="fa-solid fa-lock"></i>', 'alert']]);
}

function buildResults() {
  const { q } = room.state;
  const Q = QUESTIONS[q];
  const answers = Object.values(answersFor(Q.key));
  const n = answers.length;
  const counts = Object.fromEntries(Object.keys(Q.options).map((l) => [l, answers.filter((a) => a.choice.includes(l)).length]));
  const max = Math.max(1, ...Object.values(counts));
  $('#main').innerHTML = `
    ${qHead(q, ` · ${n} answer${n === 1 ? '' : 's'}`)}
    <section class="q-layout">
      <div><h1 class="question">${esc(Q.text)}</h1>
        <div class="bars">${Object.entries(Q.options).map(([l, t]) => {
          const ok = Q.correct.includes(l);
          const cls = showCorrect ? (ok ? 'correct' : 'dim') : '';
          return `<div class="bar-row opt-${l} ${cls}"><span class="letter">${l}</span>
            <div class="bar"><i class="fill" data-w="${(counts[l] / max) * 100}"></i>
              <span class="label"><i class="fa-solid fa-${Q.icons[l]}"></i>${esc(t)}</span></div>
            <span class="bar-num">${counts[l]}${showCorrect && ok ? ' <i class="fa-solid fa-circle-check tick"></i>' : ''}</span></div>`;
        }).join('')}</div></div>
      ${SCENES[Q.key]}
    </section>`;
  grow();
  const last = q === QUESTIONS.length - 1;
  setActions([RESTART, ['toggleCorrect', showCorrect ? '<i class="fa-solid fa-eye-slash"></i> Hide correct answer' : '<i class="fa-solid fa-eye"></i> Show correct answer', 'ghost'],
    ['next', last ? 'Mission debrief <i class="fa-solid fa-flag-checkered"></i>' : 'Next incident <i class="fa-solid fa-arrow-right"></i>', 'alert']]);
}

function results() {
  return players().map(([uid, p]) => {
    const per = QUESTIONS.map((Q) => { const choice = answersFor(Q.key)[uid]?.choice || ''; return { choice, points: score(Q, choice) }; });
    return { uid, nick: p.nick, per, total: per.reduce((s, x) => s + x.points, 0) };
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
  const isWeak = (s) => s.answered && s.rate < WEAK_BELOW;
  const weak = stats.filter(isWeak).sort((a, b) => a.rate - b.rate);
  $('#main').innerHTML = `
    <div><div class="kicker"><i class="fa-solid fa-flag-checkered"></i>Mission debrief</div><h1>What our team already knows</h1></div>
    <section class="summary">
      <div class="card">
        <h3 style="margin-bottom:.6em">Fully correct answers per objective</h3>
        ${stats.map((s) => `<div class="lo-row ${isWeak(s) ? 'weak' : ''}">
          <span class="lo-icon"><i class="fa-solid fa-${s.Q.loIcon}"></i></span><b>${esc(s.Q.lo)}</b>
          <div class="bar"><i class="fill" data-w="${Math.round(s.rate * 100)}"></i></div><span class="bar-num">${Math.round(s.rate * 100)}%</span>
          ${isWeak(s) ? `<span class="why"><i class="fa-solid fa-circle-exclamation"></i> Common belief: ${esc(s.Q.misconception)}</span>` : ''}</div>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:1.2em">
        <div class="card" style="display:flex;align-items:center;gap:1.2em">
          <div class="gauge" style="--p:${avg / MAX_POINTS}"><div><b>${avg.toFixed(1)}</b><small>/ ${MAX_POINTS}</small></div></div>
          <div><h3>Team score</h3><div class="muted">average of ${n} responder${n === 1 ? '' : 's'}</div></div></div>
        <div class="card"><h3 style="margin-bottom:.5em"><i class="fa-solid fa-crosshairs" style="color:var(--alert)"></i> Spend more time on</h3>
          ${weak.length ? weak.map((s) => `<div style="padding:.2em 0"><i class="fa-solid fa-${s.Q.loIcon}" style="width:1.4em;color:var(--alert)"></i><b>${esc(s.Q.lo)}</b></div>`).join('')
            : '<div class="muted">Nothing stands out: well done, team!</div>'}</div>
      </div>
    </section>
    ${showTable ? `<section class="card"><table><tr><th>Responder</th>${QUESTIONS.map((_, i) => `<th>Q${i + 1}</th>`).join('')}<th>Total</th></tr>
      ${rows.map((r) => `<tr><td>${esc(r.nick)}</td>${r.per.map((x) => `<td>${x.choice || '–'} (${x.points})</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</table></section>` : ''}`;
  grow();
  setActions([RESTART, ['toggleTable', showTable ? 'Hide individual scores' : '<i class="fa-solid fa-table"></i> Individual scores', 'ghost'],
    ['csv', '<i class="fa-solid fa-download"></i> Download CSV', 'ghost'], ['remove', '<i class="fa-solid fa-trash-can"></i> Delete data', 'ghost'], ['newQuiz', 'New quiz']]);
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
  $('#main').innerHTML = `<div><div class="kicker">Room ${code}</div><h1>The data of this room was deleted</h1></div>`;
  setActions([['newQuiz', 'New quiz', 'alert']]);
}
function renderNotHost() {
  $('#main').innerHTML = `<div><div class="kicker">Room ${code}</div><h1>This room was opened on another device</h1></div>`;
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
