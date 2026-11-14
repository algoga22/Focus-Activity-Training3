// Real-time backend: Firebase Realtime Database with anonymous sign-in (participants never see an account),
// or a local demo backend (localStorage + BroadcastChannel) that works between tabs of the same browser.
import { firebaseConfig } from './firebase-config.js?v=__V__';

const params = new URLSearchParams(location.search);
export const DEMO = params.has('demo') || !firebaseConfig.apiKey;
const LOBBY = { phase: 'lobby', q: -1, qKey: '' };

export function connect() {
  return DEMO ? localBackend() : firebaseBackend();
}

// ---------------------------------------------------------------- Firebase
async function firebaseBackend() {
  const V = '10.12.2';
  const base = `https://www.gstatic.com/firebasejs/${V}`;
  const { initializeApp } = await import(`${base}/firebase-app.js`);
  const { getAuth, signInAnonymously } = await import(`${base}/firebase-auth.js`);
  const { getDatabase, ref, get, set, update, onValue, remove } = await import(`${base}/firebase-database.js`);

  const app = initializeApp(firebaseConfig);
  const { user } = await signInAnonymously(getAuth(app));
  const db = getDatabase(app);
  const r = (path) => ref(db, path);

  return {
    uid: user.uid,
    async roomExists(code) { return (await get(r(`rooms/${code}/hostUid`))).exists(); },
    createRoom(code) {
      return set(r(`rooms/${code}`), { hostUid: user.uid, createdAt: Date.now(), state: LOBBY });
    },
    watchRoom(code, cb) { return onValue(r(`rooms/${code}`), (s) => cb(s.val())); },
    setState(code, state) { return set(r(`rooms/${code}/state`), state); },
    join(code, nick) { return set(r(`rooms/${code}/players/${user.uid}`), { nick, joinedAt: Date.now() }); },
    // choice '' removes the answer (Q1: everything unticked)
    answer(code, qKey, choice) { return set(r(`rooms/${code}/answers/${qKey}/${user.uid}`), choice ? { choice, at: Date.now() } : null); },
    deleteRoom(code) { return remove(r(`rooms/${code}`)); },
    // Back to the lobby: answers are deleted, participants stay in the room
    resetRoom(code) { return update(r(`rooms/${code}`), { state: LOBBY, answers: null }); },
  };
}

// ---------------------------------------------------------------- Demo (this browser only)
function localBackend() {
  const KEY = 'quiz-demo-db';
  const channel = new BroadcastChannel('quiz-demo');
  let uid = sessionStorage.getItem('quiz-demo-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('quiz-demo-uid', uid); }

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const getPath = (obj, path) => path.split('/').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const watchers = new Set();
  const notify = () => { const db = load(); watchers.forEach((w) => w(db)); };
  channel.onmessage = notify;
  addEventListener('storage', (e) => { if (e.key === KEY) notify(); }); // second channel: background tabs can miss broadcasts

  function write(path, value) {
    const db = load();
    const keys = path.split('/');
    const last = keys.pop();
    let o = db;
    for (const k of keys) o = o[k] ??= {};
    if (value === null) delete o[last]; else o[last] = value;
    localStorage.setItem(KEY, JSON.stringify(db));
    channel.postMessage('changed');
    notify();
  }

  return Promise.resolve({
    uid,
    async roomExists(code) { return getPath(load(), `rooms/${code}`) != null; },
    async createRoom(code) { write(`rooms/${code}`, { hostUid: uid, createdAt: Date.now(), state: LOBBY }); },
    watchRoom(code, cb) {
      const w = (db) => cb(getPath(db, `rooms/${code}`) ?? null);
      watchers.add(w); w(load());
      return () => watchers.delete(w);
    },
    async setState(code, state) { write(`rooms/${code}/state`, state); },
    async join(code, nick) { write(`rooms/${code}/players/${uid}`, { nick, joinedAt: Date.now() }); },
    async answer(code, qKey, choice) {
      const room = getPath(load(), `rooms/${code}`);
      if (room?.state?.phase !== 'question' || room.state.qKey !== qKey) throw new Error('closed'); // same as the Firebase rules
      write(`rooms/${code}/answers/${qKey}/${uid}`, choice ? { choice, at: Date.now() } : null);
    },
    async deleteRoom(code) { write(`rooms/${code}`, null); },
    async resetRoom(code) { write(`rooms/${code}/answers`, null); write(`rooms/${code}/state`, LOBBY); },
  });
}

export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
