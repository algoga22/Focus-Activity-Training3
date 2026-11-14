import { connect, DEMO, escapeHtml as esc } from './backend.js';
import { QUESTIONS, normalise } from './questions.js';

const params = new URLSearchParams(location.search);
const app = document.getElementById('app');
document.getElementById('demo').classList.toggle('hidden', !DEMO);

const header = (kicker, title) => `<div><div class="kicker">${kicker}</div><h1>${title}</h1><div class="rule"></div></div>`;

let be;
try { be = await connect(); } catch (e) {
  app.innerHTML = `<div class="center"><div class="big-icon alert">!</div><h1>Can't connect</h1><p class="muted">Check your internet connection and reload the page.</p></div>`;
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
  app.innerHTML = `${header('When something goes wrong', 'Join the quiz')}
    <form id="f"><label for="code">Room code</label>
      <input id="code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="1234" required>
      ${error ? `<p class="error">${error}</p>` : ''}
      <p><button class="btn alert">Continue →</button></p></form>`;
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
  app.innerHTML = `${header(`Room ${code}`, 'Choose a nickname')}
    <p class="muted">No real name needed: a nickname is enough (for example your "cyber name").</p>
    <form id="f"><label for="nick">Nickname</label>
      <input id="nick" maxlength="20" autocomplete="off" value="${esc(saved)}" required>
      <p><button class="btn alert">Join →</button></p></form>`;
  const input = document.getElementById('nick');
  input.focus();
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
  if (!room) { viewKey = 'gone'; return message('👋', 'The quiz is over', 'Thank you for taking part!'); }
  const me = room.players?.[be.uid];
  if (!me) { if (viewKey !== 'nick') { viewKey = 'nick'; askNickname(); } return; }
  const { phase, q } = room.state;
  const key = `${phase}:${q}`;
  if (key === viewKey) return;
  viewKey = key;
  if (phase === 'lobby') message('✓', `You're in, ${esc(me.nick)}!`, 'Look at the main screen: the quiz starts soon.', 'good');
  else if (phase === 'question') showQuestion(q);
  else if (phase === 'closed') message('⏸', 'Answers closed', 'Look at the main screen.');
  else message('🎉', 'Thank you!', "We'll go through the right answers together during the session.", 'good');
}

function message(icon, title, text, cls = '') {
  app.innerHTML = `<div class="center"><div class="big-icon ${cls}">${icon}</div><h1>${title}</h1><p class="muted">${text}</p></div>`;
}

function showQuestion(q) {
  const Q = QUESTIONS[q];
  const previous = room.answers?.[Q.key]?.[be.uid]?.choice || '';
  selected = new Set(previous);
  app.innerHTML = `
    <div><div class="kicker">Question ${q + 1} of ${QUESTIONS.length}</div></div>
    <div class="q-text">${esc(Q.text)}</div>
    ${Q.multi ? `<div class="pill">☑ ${esc(Q.hint)}</div>` : ''}
    <div class="choices">${Object.entries(Q.options).map(([l, t]) =>
      `<button class="choice opt-${l}" data-l="${l}" aria-pressed="false"><span class="letter">${l}</span><span>${esc(t)}</span></button>`).join('')}</div>
    ${Q.multi ? '<button class="btn alert" id="send">Send answer</button>' : ''}
    <div id="status"></div>`;
  const paint = () => app.querySelectorAll('.choice').forEach((b) => {
    const on = selected.has(b.dataset.l); b.classList.toggle('selected', on); b.setAttribute('aria-pressed', on);
  });
  paint();
  if (previous) sent();

  app.querySelector('.choices').onclick = async (e) => {
    const b = e.target.closest('.choice'); if (!b) return;
    const l = b.dataset.l;
    if (Q.multi) { selected.has(l) ? selected.delete(l) : selected.add(l); paint(); status(''); }
    else { selected = new Set([l]); paint(); await send(Q); }
  };
  if (Q.multi) document.getElementById('send').onclick = () => (selected.size ? send(Q) : status('<p class="error">Choose at least one option.</p>'));
}

async function send(Q) {
  try { await be.answer(code, Q.key, normalise(selected)); sent(); }
  catch { status('<p class="error">Answers are closed for this question.</p>'); }
}
const status = (html) => { const s = document.getElementById('status'); if (s) s.innerHTML = html; };
const sent = () => status('<div class="toast">✓ Answer sent. You can change it until the trainer closes the question.</div>');
