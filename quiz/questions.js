// Challenge 2 – diagnostic quiz. Single source for the questions, the answer key and the scoring.
// Keep in sync with 02-learner-assessment/README.md. Icons: Font Awesome 6 (free, solid) names.

export const QUESTIONS = [
  {
    key: 'q1', lo: 'LO1 Recognise', loIcon: 'magnifying-glass', multi: true,
    text: 'Which of these situations are security incidents?',
    hint: 'Choose all that apply',
    options: {
      A: "You lose the work phone with the beneficiaries' contacts on the bus",
      B: 'Your computer shows "Windows updates installed, please restart"',
      C: "Your email account sends messages that you didn't write",
      D: "You send the list of volunteers' home addresses to the wrong person",
    },
    icons: { A: 'mobile-screen-button', B: 'rotate', C: 'envelopes-bulk', D: 'address-book' },
    correct: 'ACD',
    misconception: '"An incident is only a virus or a hacker" (a lost phone or a wrong email does not count)',
  },
  {
    key: 'q2', lo: 'LO2 First steps', loIcon: 'power-off',
    text: 'A message fills your screen: "Your files are locked. Pay €500 to get them back." What do you do first?',
    options: {
      A: 'Switch the computer off completely, so the virus stops',
      B: 'Turn off the Wi-Fi or unplug the cable, and leave the computer on',
      C: 'Run the antivirus to remove the virus yourself',
      D: 'Pay quickly, so the NGO does not lose its files',
    },
    icons: { A: 'power-off', B: 'plug-circle-xmark', C: 'shield-virus', D: 'money-bill-wave' },
    correct: 'B',
    misconception: '"Switching off / fixing it myself is safest" (it erases clues; paying fixes nothing)',
  },
  {
    key: 'q3', lo: 'LO3 Report', loIcon: 'phone-volume',
    text: "It's Friday at 18:00. You clicked a strange link and now your computer is acting oddly. Your coordinator has gone home. What do you do?",
    options: {
      A: 'Email the coordinator from this computer, so it is in writing',
      B: 'Ask a friend who is good with computers to have a look',
      C: 'Call the backup contact person now',
      D: 'Wait an hour: if it looks normal again, there is no need to report it',
    },
    icons: { A: 'envelope', B: 'user-group', C: 'phone-volume', D: 'hourglass-half' },
    correct: 'C',
    misconception: '"It can wait / someone I know can fix it" (report now, by phone, to the right person)',
  },
  {
    key: 'q4', lo: 'LO4 Write down', loIcon: 'pen-to-square',
    text: 'You have reported an incident. What is the most useful thing to write down?',
    options: {
      A: 'When it happened, what you saw and what you did, with a photo of the screen',
      B: 'Which virus or hacker you think caused it',
      C: 'Nothing: the IT person can find everything in the computer',
      D: 'A short message: "computer problem, please help"',
    },
    icons: { A: 'camera', B: 'user-secret', C: 'user-gear', D: 'note-sticky' },
    correct: 'A',
    misconception: '"I need to explain the technical cause" / "Documenting is the IT person\'s job"',
  },
  {
    key: 'q5', lo: 'LO5 Avoid mistakes', loIcon: 'ban',
    text: 'A colleague says: "Just delete that strange email and forget about it." What do you do?',
    options: {
      A: "Delete it: once it's gone, the danger is gone",
      B: 'Forward it to the whole team to warn them',
      C: 'Reply to the sender to ask if it is genuine',
      D: "Keep it, don't click anything and report it",
    },
    icons: { A: 'trash-can', B: 'share-from-square', C: 'reply', D: 'flag' },
    correct: 'D',
    misconception: '"Deleting = safe" / "Forwarding or replying helps"',
  },
];

// The same quiz runs twice: at the start (mode 'quiz') and at the end (mode 'quiz-after'), to measure progress.
export const AFTER = 'quiz-after';
export const isQuiz = (mode) => mode === 'quiz' || mode === AFTER;
/** Where the answers of a question are stored: q1 (start) or q1-after (end). */
export const answerKey = (Q, mode) => (mode === AFTER ? `${Q.key}-after` : Q.key);

export const MAX_POINTS = QUESTIONS.length * 2;

/** Points for one answer (a string of letters, e.g. "ACD"): 2 good, 1 partial, 0 wrong. */
export function score(question, choice) {
  if (!choice) return 0;
  if (choice === question.correct) return 2;
  if (!question.multi) return 0;
  // Q1: partial if at least one correct situation was ticked (1–2 correct, or B included)
  const hits = [...choice].filter((l) => question.correct.includes(l)).length;
  return hits > 0 ? 1 : 0;
}

/** Normalise a set of letters to a sorted string ("DA" -> "AD"). */
export const normalise = (letters) => [...new Set(letters)].sort().join('');
