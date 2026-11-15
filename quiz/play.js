import { connect, DEMO, escapeHtml as esc } from './backend.js?v=__V__';
import { QUESTIONS, normalise } from './questions.js?v=__V__';
import { SCENES } from './scenes.js?v=__V__';
import { wordmark, avatar, cyberName, TRAINING, BOOTCAMP } from './brand.js?v=__V__';
import { ROOMS, PHASES, QUESTION_SECONDS, GAME_TITLE, stepOf, kind, points, liveFire, outcome, resultsOf, leaderboard } from './game.js?v=__V__';
import { fireMeter, setFire, hackerBubble } from './host-game.js?v=__V__';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
document.getElementById('demo').classList.toggle('hidden', !DEMO);

const top = (right = '') => `<div class="top">${wordmark()}${right}</div>`;
const foot = `<div class="foot">${esc(BOOTCAMP)} · ${esc(TRAINING)}</div>`;

let be;
try { be = await connect(); } catch (e) {
  app.innerHTML = `${top()}<div class="center"><div class="big-icon alert"><i class="fa-solid fa-wifi"></i></div><h1>Can't connect</h1>
    <p class="muted">Check your internet connection and reload the page.</p></div>${foot}`;
  throw e;
}

let code = params.get('room');
let unsubscribe = null;
let room = null;
let viewKey = '';
let selected = new Set();
let loop = null;

if (code) enterRoom(code); else askCode();

// ---------------------------------------------------------------- join
function askCode(error = '') {
  app.innerHTML = `${top()}
    <div class="center" style="margin:6vh 0 0">
      <div class="big-icon radar"><i class="fa-solid fa-shield-halved"></i></div>
      <div class="kicker">${esc(TRAINING)}</div>
      <h1>Join the response team</h1>
    </div>
    <form id="f"><label for="code">Room code (on the main screen)</label>
      <input id="code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="1234" required>
      ${error ? `<p class="error">${error}</p>` : ''}
      <p><button class="btn alert" id="go">Continue <i class="fa-solid fa-arrow-right"></i></button></p></form>${foot}`;
  document.getElementById('f').onsubmit = (e) => { e.preventDefault(); enterRoom(document.getElementById('code').value.trim()); };
}

async function enterRoom(c) {
  if (!/^\d{4}$/.test(c) || !(await be.roomExists(c))) return askCode('This room does not exist. Check the code on the screen.');
  code = c;
  history.replaceState(null, '', `?room=${code}${params.has('demo') ? '&demo' : ''}`);
  unsubscribe?.();
  unsubscribe = be.watchRoom(code, onRoom);
}

function askNickname() {
  const saved = localStorage.getItem('quiz-nick') || '';
  app.innerHTML = `${top(`<span class="pill">Room ${code}</span>`)}
    <div class="center" style="margin:3vh 0 0">${avatar(be.uid, 'xl')}
      <div class="kicker">This is your avatar</div><h1>Who's joining?</h1>
      <p class="muted" style="margin:0">No real name needed: a nickname is enough.</p></div>
    <form id="f"><label for="nick">Nickname</label>
      <input id="nick" maxlength="20" autocomplete="off" value="${esc(saved)}" placeholder="e.g. Calm Firewall" required>
      <div class="row" style="margin-top:12px">
        <button type="button" class="btn ghost" id="suggest"><i class="fa-solid fa-dice"></i> Cyber name</button>
        <button class="btn alert" id="join">Join <i class="fa-solid fa-arrow-right"></i></button>
      </div></form>${foot}`;
  const input = document.getElementById('nick');
  document.getElementById('suggest').onclick = () => { input.value = cyberName(); input.focus(); };
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault();
    const nick = input.value.trim().slice(0, 20);
    if (!nick) return;
    localStorage.setItem('quiz-nick', nick);
    await be.join(code, nick);
  };
}

// ---------------------------------------------------------------- room updates
function onRoom(r) {
  room = r;
  if (!room) { viewKey = 'gone'; return message('<i class="fa-solid fa-door-open"></i>', 'The quiz is over', 'Thank you for taking part!'); }
  const me = room.players?.[be.uid];
  if (!me) { if (viewKey !== 'nick') { viewKey = 'nick'; askNickname(); } return; }
  const { phase, q, round, step } = room.state;
  const key = `${room.mode}:${phase}:${q}:${round}:${step}`;
  if (key === viewKey) return;
  viewKey = key;
  clearInterval(loop);
  if (!room.mode) {
    app.innerHTML = `${top(`<span class="pill">Room ${code}</span>`)}
      <div class="center">${avatar(be.uid, 'xl')}<div class="kicker">You're in</div>
        <h1>Hi ${esc(me.nick)}!</h1>
        <p class="muted">The trainer is choosing the next activity. Keep this page open: it changes by itself.</p>
        <span class="pill"><i class="fa-solid fa-satellite-dish fa-beat-fade"></i> Waiting for the trainer…</span></div>${foot}`;
    return;
  }
  if (room.mode === 'game') return gameView(me);
  if (phase === 'lobby') {
    app.innerHTML = `${top(`<span class="pill">Room ${code}</span>`)}
      <div class="center">${avatar(be.uid, 'xl')}<div class="kicker">You're in</div>
        <h1>Welcome to the team, ${esc(me.nick)}!</h1>
        <p class="muted">Stand by and look at the main screen: the first incident arrives soon.</p>
        <span class="pill"><i class="fa-solid fa-satellite-dish fa-beat-fade"></i> Waiting for the trainer…</span></div>${foot}`;
  } else if (phase === 'question') showQuestion(q, me);
  else if (phase === 'closed') message('<i class="fa-solid fa-lock"></i>', "Time's up!", 'Answers are locked. Eyes on the main screen.');
  else { message('<i class="fa-solid fa-flag-checkered"></i>', 'Mission complete!', "Thanks for your help, responder. We'll go through the right answers together during the session.", 'good'); confetti(); }
}

function message(icon, title, text, cls = '') {
  app.innerHTML = `${top(`<span class="pill">Room ${code}</span>`)}<div class="center"><div class="big-icon ${cls}">${icon}</div><h1>${title}</h1><p class="muted">${text}</p></div>${foot}`;
}

function showQuestion(q, me) {
  const Q = QUESTIONS[q];
  const previous = room.answers?.[Q.key]?.[be.uid]?.choice || '';
  selected = new Set(previous);
  app.innerHTML = `
    ${top(`<span class="pill">${avatar(be.uid).replace('class="avatar ', 'style="font-size:.7em" class="avatar ')} ${esc(me.nick)}</span>`)}
    <div><div class="kicker"><i class="fa-solid fa-triangle-exclamation"></i>Incident ${q + 1} of ${QUESTIONS.length}</div>
      <div class="progress">${QUESTIONS.map((_, i) => `<span class="${i < q ? 'done' : i === q ? 'now' : ''}"></span>`).join('')}</div></div>
    ${SCENES[Q.key]}
    <div class="q-text">${esc(Q.text)}</div>
    ${Q.multi ? `<div><span class="pill purple"><i class="fa-solid fa-list-check"></i> ${esc(Q.hint)}</span></div>` : ''}
    <div class="choices ${Q.multi ? 'multi' : 'single'}">${Object.entries(Q.options).map(([l, t]) =>
      `<button type="button" class="choice opt-${l}" data-l="${l}" aria-pressed="false"><span class="letter">${l}</span><i class="ico fa-solid fa-${Q.icons[l]}"></i><span>${esc(t)}</span></button>`).join('')}</div>
    <div id="status" aria-live="polite"></div>`;
  const list = app.querySelector('.choices');
  const paint = () => {
    list.classList.toggle('has-selection', selected.size > 0);
    list.querySelectorAll('.choice').forEach((b) => { const on = selected.has(b.dataset.l); b.classList.toggle('selected', on); b.setAttribute('aria-pressed', on); });
  };
  paint();
  if (previous) saved(Q);

  // A tap is the answer: no "send" button. The screen updates at once; the saves run one after another.
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.choice'); if (!b) return;
    const l = b.dataset.l;
    if (Q.multi) { if (selected.has(l)) selected.delete(l); else selected.add(l); }
    else selected = new Set([l]);
    paint();
    save(Q, normalise(selected));
  });
}

let queue = Promise.resolve();
function save(Q, choice) {
  queue = queue.then(() => be.answer(code, Q.key, choice))
    .then(() => { if (choice === normalise(selected)) saved(Q); navigator.vibrate?.(20); })
    .catch(() => status('<p class="error">Answers are closed for this question.</p>'));
}
const status = (html) => { const s = document.getElementById('status'); if (s) s.innerHTML = html; };
function saved(Q) {
  const text = !selected.size
    ? null
    : Q.multi
      ? `Saved: ${[...normalise(selected)].join(' + ')}. Tap to add or remove an answer.`
      : 'Answer saved! Tap another option to change it.';
  if (!text) return status('<p class="muted" style="text-align:center">No answer selected yet.</p>');
  const toast = document.querySelector('#status .toast span');
  if (toast) toast.textContent = text;   // update in place, no flicker
  else status(`<div class="toast"><i class="fa-solid fa-check"></i> <span>${text}</span></div>`);
}

// ---------------------------------------------------------------- game "Put out the fire"
const myPoints = () => leaderboard(room.players, room.answers).find((r) => r.uid === be.uid)?.total || 0;
function myRank() {
  const rows = leaderboard(room.players, room.answers);
  return { rank: rows.findIndex((r) => r.uid === be.uid) + 1, of: rows.length };
}
const gameTop = (me) => top(`<span class="pill">${avatar(be.uid).replace('class="avatar ', 'style="font-size:.7em" class="avatar ')} ${esc(me.nick)} · <b>${myPoints()}</b> pts</span>`);

function gameView(me) {
  const s = room.state;
  const room_ = ROOMS[s.round];
  if (s.phase === 'lobby') {
    app.innerHTML = `${top(`<span class="pill">Room ${code}</span>`)}
      <div class="center">${avatar(be.uid, 'xl')}<div class="kicker">Challenge 3 · ${GAME_TITLE}</div>
        <h1>Welcome to the fire brigade, ${esc(me.nick)}!</h1>
        <div class="rules phone">
          <span><i class="fa-solid fa-clock"></i> The fire <b>grows every second</b>: answer fast</span>
          <span><i class="fa-solid fa-droplet"></i> Right move = <b>water</b> + points</span>
          <span><i class="fa-solid fa-gas-pump"></i> Trap card = <b>petrol</b> for the whole team</span></div>
        <span class="pill"><i class="fa-solid fa-satellite-dish fa-beat-fade"></i> Waiting for the trainer…</span></div>${foot}`;
  } else if (s.phase === 'intro') {
    app.innerHTML = `${gameTop(me)}
      <div class="center"><div class="kicker">Round ${s.round + 1} of ${ROOMS.length} · new incident</div>
        <div class="big-icon alert"><i class="fa-solid fa-${room_.icon}"></i></div>
        <h1>${esc(room_.name)}</h1><p class="ic-text">${esc(room_.incident)}</p>
        ${s.spread ? '<div class="spread"><i class="fa-solid fa-fire"></i> The fire spread from the last room!</div>' : ''}
        ${fireMeter(s.fire)}
        <span class="pill"><i class="fa-solid fa-eye"></i> Get ready: questions arrive here</span></div>${foot}`;
  } else if (s.phase === 'question') gameQuestion(me);
  else if (s.phase === 'reveal') gameReveal(me);
  else if (s.phase === 'roundEnd') {
    const o = outcome(resultsOf(s)[s.round]);
    const { rank, of } = myRank();
    app.innerHTML = `${gameTop(me)}
      <div class="center"><div class="kicker">Round ${s.round + 1} · ${esc(room_.name)}</div>
        <div class="big-icon ${o.key === 'saved' ? 'good' : 'alert'}"><i class="fa-solid fa-${o.icon}"></i></div>
        <h1>${o.label}</h1>
        <div class="score-card"><div><b>${myPoints()}</b><small>points</small></div><div><b>${rank}<span>/${of}</span></b><small>your rank</small></div></div>
        <p class="muted">${s.round < ROOMS.length - 1 ? 'Next room in a moment. Eyes on the main screen.' : 'Last room done! The results are on the main screen.'}</p></div>${foot}`;
  } else if (s.phase === 'summary') {
    const saved = resultsOf(s).filter((r) => outcome(r)?.key === 'saved').length;
    const { rank, of } = myRank();
    app.innerHTML = `${gameTop(me)}
      <div class="center"><div class="big-icon good"><i class="fa-solid fa-fire-extinguisher"></i></div><div class="kicker">Mission complete</div>
        <h1>${saved} of ${ROOMS.length} rooms saved</h1>
        <div class="score-card"><div><b>${myPoints()}</b><small>points</small></div><div><b>${rank}<span>/${of}</span></b><small>your rank</small></div></div>
        <p class="muted">Remember the four steps: Stop, Disconnect, Report, Write down. Thanks, firefighter!</p></div>${foot}`;
    confetti();
  }
}

function gameQuestion(me) {
  const s = room.state;
  const st = stepOf(s.round, s.step);
  const shownAt = Date.now();
  const mine = room.answers?.[s.qKey]?.[be.uid]?.choice || '';
  app.innerHTML = `${gameTop(me)}
    <div><div class="kicker"><i class="fa-solid fa-${PHASES[s.step].icon}"></i>Round ${s.round + 1} · phase ${s.step + 1}: ${esc(PHASES[s.step].name)}</div></div>
    <div class="fire-row">${fireMeter(s.fire, 'live')}<span class="p-timer" id="ptimer"></span></div>
    <p class="incident-line"><i class="fa-solid fa-${ROOMS[s.round].icon}"></i> ${esc(ROOMS[s.round].incident)}</p>
    ${st.hacker ? hackerBubble(st.hacker) : ''}
    <div class="q-text">${esc(st.text)}</div>
    <div class="choices single">${Object.entries(st.options).map(([l, o]) =>
      `<button type="button" class="choice opt-${l}" data-l="${l}"><span class="letter">${l}</span><i class="ico fa-solid fa-${o.icon}"></i><span>${esc(o.t)}</span></button>`).join('')}</div>
    <div id="status" aria-live="polite"></div>`;
  const list = app.querySelector('.choices');
  const lock = (l) => {
    list.classList.add('has-selection', 'locked');
    list.querySelectorAll('.choice').forEach((b) => { b.classList.toggle('selected', b.dataset.l === l); b.disabled = true; });
    status(`<div class="toast"><i class="fa-solid fa-lock"></i> Locked in: ${l}. Watch the fire on the main screen!</div>`);
  };
  if (mine) lock(mine);
  list.addEventListener('click', (e) => {
    const b = e.target.closest('.choice'); if (!b || list.classList.contains('locked')) return;
    const l = b.dataset.l;
    lock(l);
    navigator.vibrate?.(20);
    be.answer(code, s.qKey, l, { ms: Date.now() - shownAt })
      .catch(() => status('<p class="error">Too late: this phase is closed.</p>'));
  });
  const tick = () => {
    const sec = (Date.now() - shownAt) / 1000;
    setFire(app.querySelector('.firemeter.live'), s.burnt ? 100 : liveFire(s.fire, sec));
    const t = document.getElementById('ptimer'); if (t) t.innerHTML = `<i class="fa-regular fa-clock"></i> ${Math.max(0, Math.ceil(QUESTION_SECONDS - sec))}`;
  };
  tick(); loop = setInterval(tick, 250);
}

function gameReveal(me) {
  const s = room.state;
  const st = stepOf(s.round, s.step);
  const a = room.answers?.[s.qKey]?.[be.uid];
  const k = kind(st, a?.choice);
  const view = {
    good: ['good', 'droplet', 'Water!', `+${points(st, a)} points. Right move.`],
    trap: ['alert', 'gas-pump', 'Petrol!', `Trap card: ${esc(st.options[a?.choice]?.trap || '')}`],
    '': ['', 'hourglass-end', 'Too slow!', 'No answer: the fire kept growing.'],
  }[k];
  app.innerHTML = `${gameTop(me)}
    <div class="center"><div class="big-icon ${view[0]}"><i class="fa-solid fa-${view[1]}"></i></div>
      <h1>${view[2]}</h1><p style="margin:0;font-weight:600">${view[3]}</p>
      <div class="why card"><i class="fa-solid fa-lightbulb"></i><span><b>${st.good}: ${esc(st.options[st.good].t)}.</b> ${esc(st.why)}</span></div>
      ${fireMeter(s.fire)}
      ${s.burnt ? '<div class="spread"><i class="fa-solid fa-fire"></i> This room has burnt down!</div>' : ''}</div>${foot}`;
  if (k === 'good') navigator.vibrate?.(30); else if (k === 'trap') navigator.vibrate?.([60, 40, 60]);
}

function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#9F54F6', '#FF6B3D', '#34C77B', '#3D8BFD', '#F5B82E'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    p.style.animationDelay = Math.random() * .8 + 's';
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 6000);
}
