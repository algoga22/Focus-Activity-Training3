// Challenge 3 – "Put out the fire". Single source for the rooms, the phases, the answer key and the fire rules.
// Concept: 03-serious-game/concept/game-concept.pdf. Icons: Font Awesome 6 (free, solid) names.
//
// The NGO has 4 rooms = 4 rounds, one real incident in each. A round = the 4 steps of the rule
// (Stop & disconnect, Report, Write down), each phase is one question with 3 options:
// one right move (water) and two trap cards (petrol) = the classic mistakes / quiz misconceptions.
// One fire per room for the whole team; each player also collects points.

export const GAME_TITLE = 'Put out the fire';

export const QUESTION_SECONDS = 25; // per phase
export const REVEAL_SECONDS = 9;    // the result stays on screen, then the next phase starts by itself
export const GROW = 1.6;            // % of fire per second while the team is answering
export const WATER = 40;            // % removed when everybody gives the right answer
export const PETROL = 30;           // % added when everybody picks a trap card
export const START_FIRE = 20;       // % at the start of a room
export const SPREAD_FIRE = 45;      // % at the start of a room when the previous one burnt down
export const SAVED_BELOW = 50;      // a room that ends under this level is saved, otherwise damaged

export const PHASES = [
  { name: 'Is it a fire?', lo: 'LO1 Recognise', icon: 'magnifying-glass' },
  { name: 'Cut the fire', lo: 'LO2 First steps', icon: 'plug-circle-xmark' },
  { name: 'Call the firefighters', lo: 'LO3 Report', icon: 'phone-volume' },
  { name: 'Fire report', lo: 'LO4 Write down', icon: 'clipboard-list' },
];
export const TRAPS_LO = { lo: 'LO5 Avoid mistakes', icon: 'gas-pump' };

// Each step: text, options {A,B,C} with a text, an icon and (for trap cards) the name of the mistake, good, why.
export const ROOMS = [
  {
    key: 'phones', name: 'Work phones', icon: 'mobile-screen-button',
    incident: "Ana can't find the NGO's work phone after the bus ride. It has the WhatsApp groups with the beneficiaries.",
    steps: [
      {
        text: 'Is this an incident?',
        options: {
          A: { t: "No: it's just a phone, the NGO can buy a new one", icon: 'cart-shopping', trap: 'Just a lost object' },
          B: { t: "Yes: the beneficiaries' contacts may be at risk", icon: 'fire' },
          C: { t: 'Not yet: wait a few days, it may turn up', icon: 'hourglass-half', trap: 'Wait and see' },
        },
        good: 'B', why: 'A lost device is an incident: what matters is the data on it, not the price of the phone.',
      },
      {
        text: 'The phone is gone. What do you do in the first minute?',
        options: {
          A: { t: 'Buy a new SIM card and carry on as normal', icon: 'sim-card', trap: 'Carry on as normal' },
          B: { t: 'Keep calling the phone until someone answers', icon: 'phone', trap: 'Wait and see' },
          C: { t: 'Nothing to unplug: go straight to reporting it', icon: 'forward-fast' },
        },
        good: 'C', why: 'Lost phone or laptop: there is nothing to disconnect. Report at once, so IT can lock it from a distance.',
      },
      {
        text: 'Friday, 18:00. The coordinator does not answer. Who do you call?',
        options: {
          A: { t: 'Nobody: tell the coordinator on Monday', icon: 'calendar-days', trap: 'Wait until Monday' },
          B: { t: 'The backup contact person, now', icon: 'phone-volume' },
          C: { t: 'Post in the volunteers\' group: "Has anyone seen it?"', icon: 'bullhorn', trap: 'Tell everyone' },
        },
        good: 'B', why: 'Incidents do not wait for office hours: that is what the backup contact is for.',
      },
      {
        text: 'What goes in the note?',
        options: {
          A: { t: 'When and where it was last seen, and what was on it', icon: 'pen-to-square' },
          B: { t: 'Nothing: the IT person will find out', icon: 'user-gear', trap: 'Leave it to IT' },
          C: { t: 'Only your name and your department', icon: 'id-badge', trap: 'Too vague' },
        },
        good: 'A', why: 'When, where and what was on it: this tells IT what to lock and who to warn.',
      },
    ],
  },
  {
    key: 'social', name: 'Social media', icon: 'thumbs-up',
    incident: "The NGO's Facebook page has posted an ad for cheap sunglasses. Nobody in the team wrote it.",
    steps: [
      {
        text: 'Is this an incident?',
        options: {
          A: { t: 'No: Facebook does that sometimes, ignore it', icon: 'face-meh', trap: 'Say nothing' },
          B: { t: 'No: just delete the post and move on', icon: 'trash-can', trap: 'Delete the evidence' },
          C: { t: 'Yes: someone else is using the account', icon: 'user-secret' },
        },
        good: 'C', why: 'An account doing things you did not do is a classic sign of a hacked account.',
      },
      {
        text: 'You manage the page. What do you do first?',
        options: {
          A: { t: "Stop: don't click the links and don't delete the posts", icon: 'hand' },
          B: { t: 'Click the link in the post to see where it goes', icon: 'arrow-pointer', trap: 'Click to check' },
          C: { t: 'Delete the posts so that nobody sees them', icon: 'trash-can', trap: 'Delete the evidence' },
        },
        good: 'A', why: 'Stop: hands off. The posts are clues, and the link may be dangerous.',
      },
      {
        text: 'Who do you tell?',
        options: {
          A: { t: "Nobody: you'll fix it quietly yourself", icon: 'user-ninja', trap: 'Say nothing' },
          B: { t: 'Your contact person, right now', icon: 'phone-volume' },
          C: { t: 'Your friends, to ask what they would do', icon: 'comments', trap: 'Tell everyone' },
        },
        good: 'B', why: 'Report it straight away to the person on your cheat sheet, not to friends.',
      },
      {
        text: 'Which note helps the most?',
        options: {
          A: { t: 'A note that just says "Facebook problem"', icon: 'note-sticky', trap: 'Too vague' },
          B: { t: 'No note: the posts are on Facebook anyway', icon: 'user-gear', trap: 'Leave it to IT' },
          C: { t: 'Screenshots of the posts, with the date and time', icon: 'camera' },
        },
        good: 'C', why: 'Screenshots with date and time: the posts may disappear, your evidence stays.',
      },
    ],
  },
  {
    key: 'data', name: 'Beneficiary data', icon: 'address-book',
    incident: 'You emailed the list of volunteers\' home addresses to the wrong "Marc".',
    steps: [
      {
        text: 'Is this an incident?',
        options: {
          A: { t: 'Yes: personal data reached the wrong person', icon: 'fire' },
          B: { t: 'No: it was a mistake, not a hacker', icon: 'user-secret', trap: 'Only hackers count' },
          C: { t: 'No: Marc seems nice, he will ignore it', icon: 'face-smile', trap: 'Say nothing' },
        },
        good: 'A', why: 'A mistake counts too: personal data of volunteers is now with the wrong person.',
      },
      {
        text: 'What do you do in the first minute?',
        options: {
          A: { t: 'Delete the email from your Sent folder', icon: 'trash-can', trap: 'Delete the evidence' },
          B: { t: "Stop: don't send anything else, keep the email", icon: 'hand' },
          C: { t: 'Forward it to the whole team to warn them', icon: 'share-from-square', trap: 'Tell everyone' },
        },
        good: 'B', why: 'Stop and keep everything: the sent email shows exactly what left the NGO.',
      },
      {
        text: 'Who do you call?',
        options: {
          A: { t: 'Nobody: it is too embarrassing', icon: 'face-flushed', trap: 'Hide it' },
          B: { t: 'Wait until Monday, then tell your coordinator', icon: 'calendar-days', trap: 'Wait until Monday' },
          C: { t: 'Your contact person now: they can ask Marc to delete it', icon: 'phone-volume' },
        },
        good: 'C', why: 'The sooner you report, the sooner someone can contain the leak. Nobody gets blamed.',
      },
      {
        text: 'What do you write down?',
        options: {
          A: { t: 'Who got it, when, and what was in the list', icon: 'pen-to-square' },
          B: { t: 'Nothing, so that there is no trace', icon: 'eye-slash', trap: 'Hide it' },
          C: { t: 'Only "there was an email problem"', icon: 'note-sticky', trap: 'Too vague' },
        },
        good: 'A', why: 'Who, when and what: the NGO may have to inform the people on the list.',
      },
    ],
  },
  {
    key: 'office', name: 'Office computers', icon: 'laptop',
    incident: 'The office computer is very slow, and the file names now end in ".locked".',
    steps: [
      {
        text: 'Is this an incident?',
        options: {
          A: { t: 'No: computers get slow, just wait', icon: 'hourglass-half', trap: 'Wait and see' },
          B: { t: 'Yes: these are signs of ransomware', icon: 'fire' },
          C: { t: 'Restart it and see if it is fixed', icon: 'rotate-right', trap: 'Restart and see' },
        },
        good: 'B', why: 'Files you cannot open and strange file names are signs of ransomware.',
      },
      {
        text: 'Now a message fills the screen: "Pay €500". What do you do first?',
        options: {
          A: { t: 'Pay quickly, before it gets worse', icon: 'money-bill-wave', trap: 'Pay the ransom' },
          B: { t: 'Switch the computer off and on again', icon: 'power-off', trap: 'Restart and see' },
          C: { t: 'Unplug the cable, turn off the Wi-Fi, leave it on', icon: 'plug-circle-xmark' },
        },
        good: 'C', why: 'Disconnect so it cannot spread, but leave the computer on: restarting can erase clues.',
      },
      {
        hacker: { from: 'Anna (management)', text: "Hi, it's Anna. Pay now and don't tell anyone. I'll sort it out." },
        text: 'A message pops up on your phone. What do you do?',
        options: {
          A: { t: 'Do what Anna says: she is the boss', icon: 'money-bill-wave', trap: 'Pay the ransom' },
          B: { t: 'Keep it secret, as she asked', icon: 'user-secret', trap: 'Hide it' },
          C: { t: 'Report it to your contact person, with this message', icon: 'phone-volume' },
        },
        good: 'C', why: 'Pressure, secrecy and "pay now" are warning signs. Report it: the message is a clue too.',
      },
      {
        text: 'What do you write down?',
        options: {
          A: { t: 'Nothing: the IT person will find out', icon: 'user-gear', trap: 'Leave it to IT' },
          B: { t: 'The time, what the screen says, what you did, a photo', icon: 'camera' },
          C: { t: 'Close the ransom note first, then write', icon: 'trash-can', trap: 'Delete the evidence' },
        },
        good: 'B', why: 'Time, what you saw, what you did and a photo of the screen: all IT needs to act fast.',
      },
    ],
  },
];

export const STEPS = ROOMS.length * PHASES.length;
export const qKeyOf = (r, s) => `r${r + 1}s${s + 1}`;
export const stepOf = (r, s) => ROOMS[r].steps[s];
/** All steps in order, with their room and phase index. */
export const ALL_STEPS = ROOMS.flatMap((room, r) => room.steps.map((st, s) => ({ r, s, key: qKeyOf(r, s), room, step: st, phase: PHASES[s] })));

/** 'good' | 'trap' | '' (no answer) */
export const kind = (st, choice) => (!choice ? '' : choice === st.good ? 'good' : 'trap');

/** Points for one answer: 100 for the right move + up to 50 for speed. Trap cards and no answer: 0. */
export function points(st, answer) {
  if (!answer || kind(st, answer.choice) !== 'good') return 0;
  const ms = Number.isFinite(answer.ms) ? answer.ms : QUESTION_SECONDS * 1000;
  return 100 + Math.round(50 * Math.max(0, 1 - ms / (QUESTION_SECONDS * 1000)));
}

/** Fire while the team is answering (the trainer screen and the phones show the same curve). */
export const liveFire = (start, seconds) => Math.min(100, start + GROW * Math.min(seconds, QUESTION_SECONDS));

/** Effect of one phase on the room's fire. n = players in the room. */
export function fireAfter(start, seconds, good, trap, n) {
  const time = Math.min(100 - start, GROW * Math.min(seconds, QUESTION_SECONDS));
  const water = n ? (WATER * good) / n : 0;
  const petrol = n ? (PETROL * trap) / n : 0;
  const level = Math.max(0, Math.min(100, start + time - water + petrol));
  return { time, water, petrol, before: start + time, level };
}

export function outcome(result) {
  if (!result) return null;
  if (result.burnt) return { key: 'burnt', label: 'Burnt down', icon: 'fire' };
  if (result.level < SAVED_BELOW) return { key: 'saved', label: 'Saved', icon: 'circle-check' };
  return { key: 'damaged', label: 'Damaged', icon: 'triangle-exclamation' };
}

/** Results of a room stored by the trainer screen (Firebase may give an array or an object). */
export const resultsOf = (state) => ROOMS.map((_, i) => state?.results?.[i] || null);

/** Players' totals, sorted. answers = room.answers */
export function leaderboard(players, answers) {
  return Object.entries(players || {}).map(([uid, p]) => {
    const per = ALL_STEPS.map(({ key, step }) => { const a = answers?.[key]?.[uid]; return { choice: a?.choice || '', points: points(step, a), kind: kind(step, a?.choice) }; });
    return { uid, nick: p.nick, per, total: per.reduce((s, x) => s + x.points, 0) };
  }).sort((a, b) => b.total - a.total || a.nick.localeCompare(b.nick));
}
