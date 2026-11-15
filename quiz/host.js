import { connect, DEMO, escapeHtml as esc } from './backend.js?v=__V__';
import { QUESTIONS, MAX_POINTS, score, AFTER, isQuiz, answerKey } from './questions.js?v=__V__';
import { SCENES } from './scenes.js?v=__V__';
import { wordmark, avatar, TRAINERS, TRAINING, BOOTCAMP } from './brand.js?v=__V__';
import { createGame, board } from './host-game.js?v=__V__';
import { GAME_TITLE, ROOMS, PHASES, ALL_STEPS, resultsOf } from './game.js?v=__V__';

const QUESTION_SECONDS = 60;
const AFTER_SECONDS = 30; // at the end of the session the questions are already known: 30 s each
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
const isAfter = () => room.mode === AFTER;
const kq = (Q) => answerKey(Q, room.mode);   // q1 at the start, q1-after at the end
const seconds = () => (isAfter() ? AFTER_SECONDS : QUESTION_SECONDS);
// answer keys of an activity: used to restart it without touching the other activities
const keysOf = (mode) => (mode === 'game' ? ALL_STEPS.map((x) => x.key) : QUESTIONS.map((Q) => answerKey(Q, mode)));
const hasAnswers = (mode) => keysOf(mode).some((k) => room.answers?.[k]);
const ACTIVITY = { quiz: 'quiz (start)', [AFTER]: 'quiz (end)', game: 'game' };
async function clearIfPlayed() {
  if (!hasAnswers(room.mode)) return true;
  if (!confirm(`This ${ACTIVITY[room.mode]} was already played in this room.\n\nStart again? Its previous answers will be deleted (the other activities are kept).`)) return false;
  await be.resetRoom(code, keysOf(room.mode));
  return true;
}

const actions = {
  pickQuiz: () => be.setMode(code, 'quiz'),
  pickGame: () => be.setMode(code, 'game'),
  pickAfter: () => be.setMode(code, AFTER),
  menu: () => be.setMode(code, null),
  start: async () => { if (await clearIfPlayed()) setState({ phase: 'question', q: 0, qKey: kq(QUESTIONS[0]), startedAt: Date.now() }); },
  close: () => setState({ ...room.state, phase: 'closed' }),
  next: () => {
    const q = room.state.q + 1;
    if (q < QUESTIONS.length) setState({ phase: 'question', q, qKey: kq(QUESTIONS[q]), startedAt: Date.now() });
    else setState({ phase: 'summary', q: QUESTIONS.length, qKey: '' });
  },
  toggleCorrect: () => { showCorrect = !showCorrect; build(); update(); },
  toggleTable: () => { showTable = !showTable; build(); update(); },
  copy: async () => { await navigator.clipboard.writeText(joinUrl); flash('#copy', '<i class="fa-solid fa-check"></i> Link copied'); },
  csv: downloadCsv,
  remove: async () => {
    if (!confirm('Delete ALL the data of this room (quiz at the start, game and quiz at the end)? Download the CSV files first if you need them.')) return;
    await be.deleteRoom(code);
  },
  restart: async () => {
    if (!confirm(`Restart the ${ACTIVITY[room.mode]} from the beginning?\n\nIts answers will be deleted (the other activities are kept). Participants stay connected and do not need to scan the QR code again.`)) return;
    await be.resetRoom(code, keysOf(room.mode));
  },
  newQuiz: async () => { localStorage.removeItem('quiz-host-room'); location.href = `?${params.has('demo') ? 'demo' : ''}`; },
};
const game = createGame({ be, code, $, esc, setActions, actions, RESTART: ['restart', '<i class="fa-solid fa-rotate-left"></i> Restart', 'danger'],
  grow: () => grow(), getRoom: () => room, players: () => players() });
const beginGame = actions.gBegin;
actions.gBegin = async () => { if (await clearIfPlayed()) beginGame(); };

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
  game.stop();
  const { phase } = room.state;
  if (!room.mode) buildMenu();
  else if (phase === 'lobby') buildLobby();
  else if (room.mode === 'game') game.build();
  else if (phase === 'question') buildQuestion();
  else if (phase === 'closed') buildResults();
  else buildSummary();
}

function update() {
  const { phase } = room.state;
  if (!room.mode) { $('#count').textContent = players().length; return; }
  if (room.mode === 'game' && phase !== 'lobby') return game.update();
  if (phase === 'lobby') {
    const list = players();
    $('#count').textContent = list.length;
    const box = $('#players');
    for (const [uid, p] of list) {
      if (box.querySelector(`[data-uid="${CSS.escape(uid)}"]`)) continue;
      box.insertAdjacentHTML('beforeend', `<span class="player-chip" data-uid="${esc(uid)}">${avatar(uid)}${esc(p.nick)}</span>`);
    }
    const startBtn = $('#start') || $('#gBegin'); if (startBtn) startBtn.disabled = list.length === 0;
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

function buildMenu() {
  const n = players().length;
  const done = (mode) => (hasAnswers(mode) ? '<span class="done-chip"><i class="fa-solid fa-circle-check"></i> Played: results kept</span>' : '');
  $('#main').innerHTML = `
    <div><div class="kicker"><i class="fa-solid fa-table-cells-large"></i>Room ${code} · <span id="count">${n}</span> connected</div><h1>What do we play?</h1></div>
    <section class="menu">
      <button class="menu-card quiz" data-act="pickQuiz">
        <span class="mc-icon"><i class="fa-solid fa-circle-question"></i></span>
        <span class="kicker">Challenge 2 · minutes 5–10 · start</span>
        <h2>Quiz: what would you do?</h2>
        <span class="muted">${QUESTIONS.length} real-life incidents · about 1 minute each · what the group already knows</span>
        ${done('quiz')}<span class="go">Open the quiz <i class="fa-solid fa-arrow-right"></i></span>
      </button>
      <button class="menu-card game" data-act="pickGame">
        <span class="mc-icon"><i class="fa-solid fa-fire"></i></span>
        <span class="kicker">Challenge 3 · minutes 26–41</span>
        <h2>Game: ${GAME_TITLE}</h2>
        <span class="muted">${ROOMS.length} rooms of our NGO · ${PHASES.length} phases each · one fire for the team, points for everyone</span>
        ${done('game')}<span class="go">Open the game <i class="fa-solid fa-arrow-right"></i></span>
      </button>
      <button class="menu-card after" data-act="pickAfter">
        <span class="mc-icon"><i class="fa-solid fa-chart-line"></i></span>
        <span class="kicker">Challenge 2 · minutes 53–56 · end</span>
        <h2>Quiz again: what have we learned?</h2>
        <span class="muted">The same ${QUESTIONS.length} questions · 30 s each · before / after comparison for the group and for each person</span>
        ${done(AFTER)}<span class="go">Open the final quiz <i class="fa-solid fa-arrow-right"></i></span>
      </button>
    </section>
    <p class="muted"><i class="fa-solid fa-circle-info"></i> Participants join once with the QR code (next screen) and stay connected when you switch. The results of every activity are kept until you delete the room's data.</p>`;
  setActions([]);
}
$('#main').addEventListener('click', (e) => { const b = e.target.closest('.menu-card[data-act]'); if (b) actions[b.dataset.act]?.(); });

function buildLobby() {
  const isGame = room.mode === 'game';
  const qr = qrcode(0, 'M');
  qr.addData(joinUrl); qr.make();
  $('#main').innerHTML = `
    <section class="lobby">
      <div class="qr-wrap"><div class="qr">${qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true })}</div></div>
      <div class="join">
        <div class="kicker"><i class="fa-solid fa-tower-broadcast"></i>${isGame ? `Challenge 3 · ${GAME_TITLE}` : isAfter() ? 'Last check · same questions as at the start' : 'Incident response team · assembling'}</div>
        <h1>${isGame ? '<span>Put out</span> the fire' : isAfter() ? 'What have we <span>learned</span>?' : 'Join the <span>response team</span>'}</h1>
        ${isGame ? `<div class="rules">
          <span><i class="fa-solid fa-clock"></i> The fire <b>grows every second</b></span>
          <span><i class="fa-solid fa-droplet"></i> Right move = <b>water</b></span>
          <span><i class="fa-solid fa-gas-pump"></i> Trap card = <b>petrol</b></span></div>` : ''}
        <div class="steps">
          <span class="step"><b>1</b> Scan the QR code with your phone camera</span>
          <span class="step"><b>2</b> Pick a nickname or a cyber name</span>
        </div>
        <div class="code-box"><span class="muted">or go to <span class="url">${esc(shortUrl)}</span> and enter</span><span class="code">${code}</span></div>
        <div class="crew">
          <div class="crew-head"><span class="count" id="count">0</span><span class="muted">${isGame ? `firefighters ready · ${ROOMS.length} rooms · ${PHASES.length} phases each · already joined for the quiz? You're in` : isAfter() ? `responders ready · the same ${QUESTIONS.length} questions · 30 seconds each · then we compare with the start` : 'responders ready · 5 incidents · about 1 minute each · not an exam'}</span></div>
          <div class="players" id="players"></div>
        </div>
      </div>
      ${isGame ? `<div class="lobby-board">${board(resultsOf(null))}</div>` : ''}
    </section>`;
  setActions([['menu', '<i class="fa-solid fa-table-cells-large"></i> Menu', 'ghost'], ['copy', '<i class="fa-solid fa-link"></i> Copy link for the chat', 'ghost'],
    isGame ? ['gBegin', 'Start the game <i class="fa-solid fa-fire-extinguisher"></i>', 'alert'] : ['start', `${isAfter() ? 'Start the final quiz' : 'Start the quiz'} <i class="fa-solid fa-arrow-right"></i>`, 'alert']]);
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
    const left = Math.max(0, seconds() - Math.floor((Date.now() - startedAt) / 1000));
    const t = $('#timer'); if (!t) return;
    t.textContent = left; t.style.setProperty('--p', left / seconds());
    t.classList.toggle('hurry', left <= HURRY_SECONDS);
  };
  tick(); timer = setInterval(tick, 500);
  setActions([RESTART, ['close', 'Close answers <i class="fa-solid fa-lock"></i>', 'alert']]);
}

function buildResults() {
  const { q } = room.state;
  const Q = QUESTIONS[q];
  const answers = Object.values(answersFor(kq(Q)));
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
  // At the start the right answers stay hidden: the same quiz is used again at the end to measure progress
  setActions([RESTART, ...(isAfter() ? [['toggleCorrect', showCorrect ? '<i class="fa-solid fa-eye-slash"></i> Hide correct answer' : '<i class="fa-solid fa-eye"></i> Show correct answer', 'ghost']] : []),
    ['next', last ? (isAfter() ? 'Before / after <i class="fa-solid fa-chart-line"></i>' : 'Mission debrief <i class="fa-solid fa-flag-checkered"></i>') : 'Next incident <i class="fa-solid fa-arrow-right"></i>', 'alert']]);
}

function results(mode = room.mode) {
  return players().map(([uid, p]) => {
    const per = QUESTIONS.map((Q) => { const choice = answersFor(answerKey(Q, mode))[uid]?.choice || ''; return { choice, points: score(Q, choice) }; });
    return { uid, nick: p.nick, per, total: per.reduce((s, x) => s + x.points, 0), answered: per.some((x) => x.choice) };
  });
}
/** Share of fully correct answers per question, among the people who answered it. */
const ratesOf = (rows) => QUESTIONS.map((Q, i) => {
  const answered = rows.filter((r) => r.per[i].choice);
  return answered.length ? answered.filter((r) => r.per[i].points === 2).length / answered.length : null;
});
const avgOf = (rows) => { const list = rows.filter((r) => r.answered); return list.length ? list.reduce((s, r) => s + r.total, 0) / list.length : null; };
const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);

function buildSummary() {
  if (isAfter()) return buildCompare();
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
    ['csv', '<i class="fa-solid fa-download"></i> Download CSV', 'ghost'], ['remove', '<i class="fa-solid fa-trash-can"></i> Delete data', 'ghost'], ['menu', '<i class="fa-solid fa-table-cells-large"></i> Menu']]);
}

function buildCompare() {
  const before = results('quiz');
  const after = results(AFTER);
  const rb = ratesOf(before); const ra = ratesOf(after);
  const ab = avgOf(before); const aa = avgOf(after);
  const both = after.filter((r, i) => r.answered && before[i].answered);
  const improved = both.filter((r) => r.total > before[after.indexOf(r)].total).length;
  const still = QUESTIONS.map((Q, i) => ({ Q, rate: ra[i] })).filter((x) => x.rate != null && x.rate < WEAK_BELOW);
  $('#main').innerHTML = `
    <div><div class="kicker"><i class="fa-solid fa-chart-line"></i>Before / after · same ${QUESTIONS.length} questions</div><h1>What we have learned</h1></div>
    <section class="summary">
      <div class="card">
        <h3 style="margin-bottom:.3em">Fully correct answers per objective</h3>
        <div class="legend"><span><i class="sw before"></i> Start of the session</span><span><i class="sw after"></i> End of the session</span></div>
        ${QUESTIONS.map((Q, i) => {
          const d = rb[i] != null && ra[i] != null ? Math.round((ra[i] - rb[i]) * 100) : null;
          return `<div class="cmp-row"><span class="lo-icon"><i class="fa-solid fa-${Q.loIcon}"></i></span><b>${esc(Q.lo)}</b>
            <div class="cmp-bars"><div class="bar before"><i class="fill" data-w="${Math.round((rb[i] || 0) * 100)}"></i><span>${pct(rb[i])}</span></div>
              <div class="bar after"><i class="fill" data-w="${Math.round((ra[i] || 0) * 100)}"></i><span>${pct(ra[i])}</span></div></div>
            <span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d == null ? '' : `${d > 0 ? '+' : ''}${d}`}</span></div>`;
        }).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:1.2em">
        <div class="card ba">
          <div class="gauge small" style="--p:${(ab || 0) / MAX_POINTS}"><div><b>${ab == null ? '–' : ab.toFixed(1)}</b><small>start</small></div></div>
          <i class="fa-solid fa-arrow-right"></i>
          <div class="gauge" style="--p:${(aa || 0) / MAX_POINTS}"><div><b>${aa == null ? '–' : aa.toFixed(1)}</b><small>end · / ${MAX_POINTS}</small></div></div>
        </div>
        <div class="card"><h3><i class="fa-solid fa-arrow-trend-up" style="color:var(--good)"></i> ${improved} of ${both.length} improved their score</h3>
          <div class="muted" style="margin-top:.3em">People who answered both quizzes</div></div>
        <div class="card"><h3 style="margin-bottom:.4em"><i class="fa-solid fa-crosshairs" style="color:var(--alert)"></i> Still to work on</h3>
          ${still.length ? still.map((x) => `<div style="padding:.2em 0"><b>${esc(x.Q.lo)}</b> <span class="muted">· ${esc(x.Q.misconception)}</span></div>`).join('')
            : '<div class="muted">Every objective is above 60%: well done, team!</div>'}</div>
      </div>
    </section>
    ${showTable ? `<section class="card"><table><tr><th>Responder</th>${QUESTIONS.map((_, i) => `<th>Q${i + 1}</th>`).join('')}<th>Start</th><th>End</th><th>Progress</th></tr>
      ${after.map((r, k) => { const b = before[k]; const d = r.answered && b.answered ? r.total - b.total : null;
        return `<tr><td>${esc(r.nick)}</td>${r.per.map((x, i) => `<td>${b.per[i].choice || '–'} → ${x.choice || '–'}</td>`).join('')}
          <td>${b.answered ? b.total : '–'}</td><td><b>${r.answered ? r.total : '–'}</b></td><td class="${d > 0 ? 'good' : d < 0 ? 'trap' : ''}">${d == null ? '–' : (d > 0 ? '+' : '') + d}</td></tr>`; }).join('')}</table></section>` : ''}`;
  grow();
  setActions([RESTART, ['toggleTable', showTable ? 'Hide individual progress' : '<i class="fa-solid fa-table"></i> Individual progress', 'ghost'],
    ['csv', '<i class="fa-solid fa-download"></i> Download CSV', 'ghost'], ['remove', '<i class="fa-solid fa-trash-can"></i> Delete data', 'ghost'], ['menu', '<i class="fa-solid fa-table-cells-large"></i> Menu']]);
}

function downloadCsv() {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  // Always both quizzes side by side (start and end), so progress can be measured per person
  const cols = (tag) => [...QUESTIONS.map((_, i) => `${tag}_q${i + 1}_answer`), ...QUESTIONS.map((_, i) => `${tag}_q${i + 1}_points`), `${tag}_total`];
  const head = ['nickname', ...cols('start'), ...cols('end'), 'progress'];
  const before = results('quiz'); const after = results(AFTER);
  const cells = (r) => (r.answered ? [...r.per.map((x) => x.choice), ...r.per.map((x) => x.points), r.total] : Array(QUESTIONS.length * 2 + 1).fill(''));
  const lines = before.map((b, k) => { const a = after[k];
    return [q(b.nick), ...cells(b), ...cells(a), b.answered && a.answered ? a.total - b.total : ''].join(','); });
  const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `quiz-start-end-${code}-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

function renderDeleted() {
  clearInterval(timer);
  $('#main').innerHTML = `<div><div class="kicker">Room ${code}</div><h1>The data of this room was deleted</h1></div>`;
  setActions([['newQuiz', 'New room', 'alert']]);
}
function renderNotHost() {
  $('#main').innerHTML = `<div><div class="kicker">Room ${code}</div><h1>This room was opened on another device</h1></div>`;
  setActions([['newQuiz', 'Open a new room', 'alert']]);
}

// Start listening last: the demo backend calls back immediately
be.watchRoom(code, (r) => {
  room = r;
  if (!room) return renderDeleted();
  if (room.hostUid !== be.uid) return renderNotHost();
  const st = room.state || {};
  const key = `${room.mode}:${st.phase}:${st.q}:${st.round}:${st.step}`;
  if (key !== viewKey) { viewKey = key; showCorrect = false; showTable = false; build(); }
  update();
});
