import { connect, DEMO, escapeHtml as esc } from './backend.js?v=__V__';
import { QUESTIONS, normalise } from './questions.js?v=__V__';
import { SCENES } from './scenes.js?v=__V__';
import { wordmark, avatar, cyberName, TRAINING, BOOTCAMP } from './brand.js?v=__V__';

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
  const { phase, q } = room.state;
  const key = `${phase}:${q}`;
  if (key === viewKey) return;
  viewKey = key;
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
    <div class="choices">${Object.entries(Q.options).map(([l, t]) =>
      `<button class="choice opt-${l}" data-l="${l}" aria-pressed="false"><span class="letter">${l}</span><i class="ico fa-solid fa-${Q.icons[l]}"></i><span>${esc(t)}</span></button>`).join('')}</div>
    ${Q.multi ? '<button class="btn alert" id="send"><i class="fa-solid fa-paper-plane"></i> Send answer</button>' : ''}
    <div id="status"></div>`;
  const list = app.querySelector('.choices');
  const paint = () => {
    list.classList.toggle('has-selection', selected.size > 0);
    list.querySelectorAll('.choice').forEach((b) => { const on = selected.has(b.dataset.l); b.classList.toggle('selected', on); b.setAttribute('aria-pressed', on); });
  };
  paint();
  if (previous) sent();

  list.onclick = async (e) => {
    const b = e.target.closest('.choice'); if (!b) return;
    const l = b.dataset.l;
    if (Q.multi) { selected.has(l) ? selected.delete(l) : selected.add(l); paint(); status(''); }
    else { selected = new Set([l]); paint(); await send(Q); }
  };
  if (Q.multi) document.getElementById('send').onclick = () => (selected.size ? send(Q) : status('<p class="error">Choose at least one option.</p>'));
}

async function send(Q) {
  try { await be.answer(code, Q.key, normalise(selected)); sent(); navigator.vibrate?.(30); }
  catch { status('<p class="error">Answers are closed for this question.</p>'); }
}
const status = (html) => { const s = document.getElementById('status'); if (s) s.innerHTML = html; };
const sent = () => status('<div class="toast"><i class="fa-solid fa-lock"></i> Answer locked in! You can change it until time is up.</div>');

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
