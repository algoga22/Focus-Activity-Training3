// Trainer screen of the game "Put out the fire" (Challenge 3). host.js handles the room, the menu and the lobby;
// this module draws the rounds and drives the game: the trainer starts each room, the phases then run by themselves.
import {
  ROOMS, PHASES, TRAPS_LO, ALL_STEPS, QUESTION_SECONDS, REVEAL_SECONDS, START_FIRE, SPREAD_FIRE,
  qKeyOf, stepOf, kind, fireAfter, liveFire, outcome, resultsOf, leaderboard,
} from './game.js?v=__V__';
import { avatar } from './brand.js?v=__V__';
import { QUESTIONS, score } from './questions.js?v=__V__';

const HURRY_SECONDS = 7;

// ---------------------------------------------------------------- shared pieces (also used by the phone page)
export const fireMeter = (level, cls = '') =>
  `<div class="firemeter ${cls}" style="--f:${(level / 100).toFixed(3)}">
    <span class="flame"><i class="fa-solid fa-fire"></i></span>
    <span class="fm-bar"><i></i></span><b class="fm-num">${Math.round(level)}%</b></div>`;
export function setFire(el, level) {
  if (!el) return;
  el.style.setProperty('--f', (level / 100).toFixed(3));
  el.querySelector('.fm-num').textContent = `${Math.round(level)}%`;
  el.classList.toggle('danger', level >= 75);
}

export function board(results, current = -1, currentLevel = 0) {
  return `<div class="board"><div class="board-label"><i class="fa-solid fa-house"></i> Our NGO</div>${ROOMS.map((room, i) => {
    const o = outcome(results[i]);
    const now = i === current && !o;
    const level = o ? results[i].level : now ? currentLevel : 0;
    return `<div class="room-tile ${o ? o.key : now ? 'now' : 'todo'}">
      <i class="fa-solid fa-${room.icon} room-ico"></i><b>${room.name}</b>
      ${o ? `<span class="badge"><i class="fa-solid fa-${o.icon}"></i> ${o.label}</span>`
        : now ? fireMeter(level, 'mini') : '<span class="badge todo"><i class="fa-regular fa-clock"></i> Not yet</span>'}
      ${o?.key === 'burnt' ? '<i class="fa-solid fa-fire burnt-fire"></i>' : ''}</div>`;
  }).join('')}</div>`;
}

const phaseDots = (s) => `<div class="phase-dots">${PHASES.map((p, i) =>
  `<span class="${i < s ? 'done' : i === s ? 'now' : ''}"><i class="fa-solid fa-${p.icon}"></i> ${p.name}</span>`).join('')}</div>`;

export const hackerBubble = (h) => `<div class="hacker"><div class="hk-head"><i class="fa-solid fa-comment-dots"></i> New message · ${h.from}</div><div class="hk-text">“${h.text}”</div></div>`;

// ---------------------------------------------------------------- game controller
export function createGame(ctx) {
  const { be, code, $, esc, setActions, actions, RESTART, grow, getRoom, players } = ctx;
  let loop = null;
  let paused = false;
  let sentFor = '';   // state key we already wrote a transition for (avoids double writes)
  const state = () => getRoom().state;
  const keyOf = (s) => `${s.phase}:${s.round}:${s.step}`;
  const answersFor = (key) => getRoom().answers?.[key] || {};
  const once = (fn) => {
    const k = keyOf(state()); if (sentFor === k) return;
    sentFor = k;
    return Promise.resolve(fn()).catch((e) => { sentFor = ''; console.error(e); });
  };

  function tally(r, s) {
    const st = stepOf(r, s);
    const ids = new Set(players().map(([uid]) => uid));
    const list = Object.entries(answersFor(qKeyOf(r, s))).filter(([uid]) => ids.has(uid)).map(([, a]) => a);
    const counts = Object.fromEntries(Object.keys(st.options).map((l) => [l, list.filter((a) => a.choice === l).length]));
    const good = list.filter((a) => kind(st, a.choice) === 'good').length;
    return { counts, good, trap: list.length - good, answered: list.length, n: ids.size };
  }

  // ---- transitions (only the trainer screen writes the state)
  const go = {
    begin: () => be.setState(code, { phase: 'intro', round: 0, step: 0, fire: START_FIRE, spread: false, burnt: false, results: [] }),
    startRound: () => once(() => {
      const s = state();
      return be.setState(code, { ...s, phase: 'question', step: 0, qKey: qKeyOf(s.round, 0), startedAt: Date.now(), burnt: false });
    }),
    close: () => once(() => {
      const s = state();
      const t = tally(s.round, s.step);
      const seconds = (Date.now() - s.startedAt) / 1000;
      const f = s.burnt ? { time: 0, water: 0, petrol: 0, before: 100, level: 100 } : fireAfter(s.fire, seconds, t.good, t.trap, t.n);
      const burnt = s.burnt || f.level >= 100;
      return be.setState(code, { ...s, phase: 'reveal', before: f.before, fire: f.level, burnt, revealAt: Date.now(),
        parts: { time: f.time, water: f.water, petrol: f.petrol, good: t.good, trap: t.trap, n: t.n } });
    }),
    next: () => once(() => {
      const s = state();
      if (s.step < PHASES.length - 1) {
        return be.setState(code, { ...s, phase: 'question', step: s.step + 1, qKey: qKeyOf(s.round, s.step + 1), startedAt: Date.now() });
      }
      const results = resultsOf(s).slice(0, s.round).map((x) => x || { level: 0, burnt: false });
      results[s.round] = { level: s.fire, burnt: !!s.burnt };
      return be.setState(code, { ...s, phase: 'roundEnd', results });
    }),
    nextRoom: () => once(() => {
      const s = state();
      const results = resultsOf(s).filter(Boolean);
      if (s.round >= ROOMS.length - 1) return be.setState(code, { phase: 'summary', round: s.round, step: 0, results });
      return be.setState(code, { phase: 'intro', round: s.round + 1, step: 0, fire: s.burnt ? SPREAD_FIRE : START_FIRE, spread: !!s.burnt, burnt: false, results });
    }),
  };
  Object.assign(actions, {
    gBegin: go.begin, gStartRound: go.startRound, gClose: go.close, gNext: go.next, gNextRoom: go.nextRoom,
    gPause: () => { paused = !paused; buildReveal(); },
  });

  // ---- views
  function head(s, extra = '') {
    const room = ROOMS[s.round];
    return `<div class="q-head"><div>
        <div class="kicker"><i class="fa-solid fa-fire"></i>Round ${s.round + 1} of ${ROOMS.length} · ${esc(room.name)}${extra}</div>${phaseDots(s.step)}</div>
      <span class="pill"><i class="fa-solid fa-${PHASES[s.step].icon}"></i> ${esc(PHASES[s.step].lo)}</span></div>`;
  }

  function buildIntro() {
    const s = state();
    const room = ROOMS[s.round];
    $('#main').innerHTML = `
      <section class="g-layout">
        ${board(resultsOf(s), s.round, s.fire)}
        <div class="incident-card card">
          <div class="kicker"><i class="fa-solid fa-triangle-exclamation"></i>Round ${s.round + 1} of ${ROOMS.length} · new incident</div>
          <div class="ic-title"><span class="ic-icon"><i class="fa-solid fa-${room.icon}"></i></span><h1>${esc(room.name)}</h1></div>
          <p class="ic-text">${esc(room.incident)}</p>
          ${s.spread ? `<div class="spread"><i class="fa-solid fa-fire"></i> The fire spread from the last room: this one starts at ${SPREAD_FIRE}%!</div>` : ''}
          ${fireMeter(s.fire, 'big')}
          <div class="muted">${PHASES.length} phases · ${QUESTION_SECONDS} s each · every second the fire grows</div>
        </div>
      </section>`;
    setActions([RESTART, ['gStartRound', 'Start the round <i class="fa-solid fa-fire-extinguisher"></i>', 'alert']]);
  }

  const optionTiles = (st, extra = () => '') => Object.entries(st.options).map(([l, o]) =>
    `<div class="option opt-${l}" data-l="${l}"><span class="letter">${l}</span><i class="ico fa-solid fa-${o.icon}"></i><span>${esc(o.t)}</span>${extra(l, o)}</div>`).join('');

  function buildQuestion() {
    const s = state();
    const st = stepOf(s.round, s.step);
    $('#main').innerHTML = `
      ${head(s)}
      <section class="q-layout">
        <div>
          <p class="incident-line"><i class="fa-solid fa-${ROOMS[s.round].icon}"></i> ${esc(ROOMS[s.round].incident)}</p>
          ${st.hacker ? `<div class="surprise"><i class="fa-solid fa-bolt"></i> Surprise!</div>${hackerBubble(st.hacker)}` : ''}
          <h1 class="question">${esc(st.text)}</h1><div class="options">${optionTiles(st)}</div></div>
        <aside class="side">
          ${fireMeter(s.fire, 'big live')}
          <div class="status-row">
            <div class="timer" id="timer"></div>
            <div><span class="count" id="answered">0</span> <span class="muted">/ <span id="joined">0</span> answered</span></div>
          </div>
          <div class="answered-avatars" id="answered-avatars"></div>
        </aside>
      </section>`;
    setActions([RESTART, ['gClose', 'Close now <i class="fa-solid fa-lock"></i>', 'alert']]);
    const tick = () => {
      const s2 = state();
      if (s2.phase !== 'question') return;
      const seconds = (Date.now() - s2.startedAt) / 1000;
      const left = Math.max(0, Math.ceil(QUESTION_SECONDS - seconds));
      const t = $('#timer'); if (!t) return;
      t.textContent = left; t.style.setProperty('--p', left / QUESTION_SECONDS);
      t.classList.toggle('hurry', left <= HURRY_SECONDS);
      setFire($('.firemeter.live'), s2.burnt ? 100 : liveFire(s2.fire, seconds));
      const { answered, n } = tally(s2.round, s2.step);
      if (seconds >= QUESTION_SECONDS || (n > 0 && answered >= n && seconds > 2)) go.close();
    };
    tick(); loop = setInterval(tick, 250);
  }

  function buildReveal() {
    clearInterval(loop);
    const s = state();
    const st = stepOf(s.round, s.step);
    const t = tally(s.round, s.step);
    const max = Math.max(1, ...Object.values(t.counts));
    const p = s.parts || { time: 0, water: 0, petrol: 0 };
    const last = s.step === PHASES.length - 1;
    $('#main').innerHTML = `
      ${head(s, ` · ${t.answered} answer${t.answered === 1 ? '' : 's'}`)}
      <section class="q-layout">
        <div><h1 class="question">${esc(st.text)}</h1>
          <div class="bars">${Object.entries(st.options).map(([l, o]) => {
            const good = l === st.good;
            return `<div class="bar-row opt-${l} ${good ? 'correct' : 'trap'}"><span class="letter">${l}</span>
              <div class="bar"><i class="fill" data-w="${(t.counts[l] / max) * 100}"></i>
                <span class="label"><i class="fa-solid fa-${good ? 'droplet' : 'gas-pump'}"></i>${esc(o.t)}</span></div>
              <span class="bar-num">${t.counts[l]}${good ? ' <i class="fa-solid fa-circle-check tick"></i>' : ''}</span></div>`;
          }).join('')}</div>
          <div class="why card"><i class="fa-solid fa-lightbulb"></i><span>${esc(st.why)}</span></div>
        </div>
        <aside class="side">
          ${fireMeter(s.before ?? s.fire, 'big reveal')}
          <div class="effects">
            <span class="fx time"><i class="fa-regular fa-clock"></i> +${Math.round(p.time)}% waiting</span>
            <span class="fx water"><i class="fa-solid fa-droplet"></i> −${Math.round(p.water)}% water</span>
            <span class="fx petrol"><i class="fa-solid fa-gas-pump"></i> +${Math.round(p.petrol)}% petrol</span>
          </div>
          ${s.burnt ? '<div class="spread"><i class="fa-solid fa-fire"></i> This room has burnt down! The fire will spread to the next room.</div>' : ''}
        </aside>
      </section>`;
    grow();
    setTimeout(() => setFire($('.firemeter.reveal'), s.fire), 700);
    const label = last ? 'Room result <i class="fa-solid fa-flag-checkered"></i>' : 'Next phase <i class="fa-solid fa-arrow-right"></i>';
    setActions([RESTART, ['gPause', paused ? '<i class="fa-solid fa-play"></i> Continue' : '<i class="fa-solid fa-pause"></i> Pause', 'ghost'], ['gNext', label, 'alert']]);
    if (paused) return;
    const tick = () => {
      const s2 = state();
      if (s2.phase !== 'reveal') return;
      const left = Math.ceil(REVEAL_SECONDS - (Date.now() - s2.revealAt) / 1000);
      const b = $('#gNext'); if (b) b.innerHTML = `${label} <small class="auto">${Math.max(0, left)}</small>`;
      if (left <= 0) go.next();
    };
    tick(); loop = setInterval(tick, 250);
  }

  const podium = (rows, max = 5) => `<ol class="podium">${rows.slice(0, max).map((r, i) =>
    `<li><span class="rank">${i + 1}</span>${avatar(r.uid)}<b>${esc(r.nick)}</b><span class="pts">${r.total}</span></li>`).join('')
    || '<li class="muted">Nobody has played yet</li>'}</ol>`;

  function buildRoundEnd() {
    const s = state();
    const results = resultsOf(s);
    const o = outcome(results[s.round]);
    const last = s.round === ROOMS.length - 1;
    const msg = { saved: 'Well done, team: the fire is out!', damaged: 'The fire is out, but it did some damage.', burnt: 'Too slow or too much petrol: the fire will spread to the next room.' }[o.key];
    $('#main').innerHTML = `
      <section class="g-layout">
        ${board(results)}
        <div class="card outcome ${o.key}">
          <div class="kicker"><i class="fa-solid fa-${ROOMS[s.round].icon}"></i>Round ${s.round + 1} · ${esc(ROOMS[s.round].name)}</div>
          <h1><i class="fa-solid fa-${o.icon}"></i> ${o.label}</h1>
          <p class="muted">${msg}</p>
          <h3 style="margin-top:.6em"><i class="fa-solid fa-trophy" style="color:var(--amber)"></i> Best firefighters</h3>
          ${podium(leaderboard(getRoom().players, getRoom().answers))}
        </div>
      </section>`;
    setActions([RESTART, ['gNextRoom', last ? 'Mission debrief <i class="fa-solid fa-flag-checkered"></i>' : 'Next room <i class="fa-solid fa-arrow-right"></i>', 'alert']]);
  }

  let showTable = false;
  function stats() {
    const rows = leaderboard(getRoom().players, getRoom().answers);
    const answers = rows.flatMap((r) => r.per.filter((x) => x.kind));
    const lo = PHASES.map((p, s) => {
      const list = rows.flatMap((r) => r.per.filter((x, i) => ALL_STEPS[i].s === s && x.kind));
      return { ...p, n: list.length, rate: list.length ? list.filter((x) => x.kind === 'good').length / list.length : 0 };
    });
    lo.push({ name: 'Avoid the traps', ...TRAPS_LO, n: answers.length, rate: answers.length ? answers.filter((x) => x.kind === 'good').length / answers.length : 0 });
    const traps = {};
    rows.forEach((r) => r.per.forEach((x, i) => { if (x.kind === 'trap') { const name = ALL_STEPS[i].step.options[x.choice].trap; traps[name] = (traps[name] || 0) + 1; } }));
    // Same objective in the quiz at the start (phase s ↔ question s+1, trap cards ↔ Q5), to show progress
    lo.forEach((x, i) => {
      const Q = QUESTIONS[i];
      const list = rows.map((r) => getRoom().answers?.[Q.key]?.[r.uid]?.choice).filter(Boolean);
      x.quiz = list.length ? list.filter((c) => score(Q, c) === 2).length / list.length : null;
    });
    return { rows, lo, traps: Object.entries(traps).sort((a, b) => b[1] - a[1]) };
  }

  function buildSummary() {
    const s = state();
    const results = resultsOf(s);
    const saved = results.filter((r) => outcome(r)?.key === 'saved').length;
    const { rows, lo, traps } = stats();
    const tmax = Math.max(1, ...traps.map((t) => t[1]));
    $('#main').innerHTML = `
      <div><div class="kicker"><i class="fa-solid fa-flag-checkered"></i>Mission debrief</div><h1>${saved} of ${ROOMS.length} rooms saved</h1>
        <div class="room-strip">${results.map((r, i) => { const o = outcome(r); return o ? `<span class="badge-room ${o.key}"><i class="fa-solid fa-${ROOMS[i].icon}"></i> ${esc(ROOMS[i].name)}: ${o.label}</span>` : ''; }).join('')}</div></div>
      <section class="g-summary">
        <div class="card">
          <h3 style="margin-bottom:.6em">Right moves per objective</h3>
          ${lo.map((x) => `<div class="lo-row ${x.n && x.rate < 0.6 ? 'weak' : ''}"><span class="lo-icon"><i class="fa-solid fa-${x.icon}"></i></span><b>${esc(x.lo)}</b>
            <div class="bar"><i class="fill" data-w="${Math.round(x.rate * 100)}"></i></div><span class="bar-num">${Math.round(x.rate * 100)}%</span>
            ${x.quiz != null ? `<span class="was"><i class="fa-solid fa-clock-rotate-left"></i> Quiz at the start: ${Math.round(x.quiz * 100)}%</span>` : ''}</div>`).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:1.2em">
          <div class="card"><h3 style="margin-bottom:.5em"><i class="fa-solid fa-gas-pump" style="color:var(--alert)"></i> Most chosen trap cards</h3>
            ${traps.length ? traps.slice(0, 5).map(([name, n]) => `<div class="trap-row"><span>${esc(name)}</span>
              <div class="bar"><i class="fill" data-w="${(n / tmax) * 100}"></i></div><b>${n}</b></div>`).join('') : '<div class="muted">No trap cards: impressive!</div>'}</div>
          <div class="card"><h3 style="margin-bottom:.4em"><i class="fa-solid fa-trophy" style="color:var(--amber)"></i> Best firefighters</h3>${podium(rows, 3)}</div>
        </div>
      </section>
      ${showTable ? `<section class="card"><table><tr><th>Player</th>${ALL_STEPS.map((x) => `<th>${x.r + 1}.${x.s + 1}</th>`).join('')}<th>Points</th></tr>
        ${rows.map((r) => `<tr><td>${esc(r.nick)}</td>${r.per.map((x) => `<td class="${x.kind}">${x.choice || '–'}</td>`).join('')}<td><b>${r.total}</b></td></tr>`).join('')}</table></section>` : ''}`;
    grow();
    setActions([RESTART, ['gTable', showTable ? 'Hide individual answers' : '<i class="fa-solid fa-table"></i> Individual answers', 'ghost'],
      ['gCsv', '<i class="fa-solid fa-download"></i> Download CSV', 'ghost'], ['remove', '<i class="fa-solid fa-trash-can"></i> Delete data', 'ghost'], ['menu', '<i class="fa-solid fa-table-cells-large"></i> Menu']]);
  }
  Object.assign(actions, {
    gTable: () => { showTable = !showTable; buildSummary(); },
    gCsv: () => {
      const { rows } = stats();
      const q = (x) => `"${String(x).replace(/"/g, '""')}"`;
      const head = ['nickname', ...ALL_STEPS.map((x) => `${x.key}_answer`), ...ALL_STEPS.map((x) => `${x.key}_result`), 'points'];
      const lines = rows.map((r) => [q(r.nick), ...r.per.map((x) => x.choice), ...r.per.map((x) => x.kind || 'none'), r.total].join(','));
      const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `game-${code}-${new Date().toISOString().slice(0, 10)}.csv` });
      a.click(); URL.revokeObjectURL(a.href);
    },
  });

  return {
    build() {
      clearInterval(loop);
      const { phase } = state();
      paused = false;
      ({ intro: buildIntro, question: buildQuestion, reveal: buildReveal, roundEnd: buildRoundEnd, summary: buildSummary })[phase]?.();
    },
    update() {
      if (state().phase !== 'question') return;
      const s = state();
      $('#answered').textContent = tally(s.round, s.step).answered;
      $('#joined').textContent = players().length;
      const box = $('#answered-avatars');
      for (const uid of Object.keys(answersFor(s.qKey))) {
        if (!box.querySelector(`[data-uid="${CSS.escape(uid)}"]`)) box.insertAdjacentHTML('beforeend', avatar(uid).replace('class="avatar ', `data-uid="${esc(uid)}" class="avatar `));
      }
    },
    stop() { clearInterval(loop); },
  };
}
