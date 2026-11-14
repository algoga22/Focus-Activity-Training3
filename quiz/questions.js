// Challenge 2 – diagnostic quiz. Single source for the questions, the answer key and the scoring.
// Keep in sync with 02-learner-assessment/README.md.

export const QUESTIONS = [
  {
    key: 'q1', lo: 'LO1 Recognise', multi: true,
    text: 'Which of these situations are security incidents?',
    hint: 'Choose all that apply',
    options: {
      A: "You lose the work phone with the beneficiaries' contacts on the bus",
      B: 'You forget your password and ask your coordinator to reset it',
      C: "Your email account sends messages that you didn't write",
      D: "You send the list of volunteers' addresses to the wrong person",
    },
    correct: 'ACD',
    misconception: '"An incident is only a virus or a hacker"',
  },
  {
    key: 'q2', lo: 'LO2 First steps',
    text: 'A message fills your screen: "Your files are locked. Pay €500 to get them back." What do you do first?',
    options: {
      A: "Pay quickly so the NGO doesn't lose its files",
      B: 'Turn off the Wi-Fi or unplug the cable, and stop using the computer',
      C: 'Restart the computer to see if the message goes away',
    },
    correct: 'B',
    misconception: '"Paying fixes it" / "Restarting fixes it"',
  },
  {
    key: 'q3', lo: 'LO3 Report',
    text: "It's Friday at 18:00. You clicked a strange link and now your computer is acting oddly. Your coordinator has gone home. What do you do?",
    options: {
      A: 'Wait until Monday and tell the coordinator then',
      B: 'Call the backup contact person now',
      C: 'Say nothing if everything looks normal again after a while',
    },
    correct: 'B',
    misconception: '"It can wait" / "If it looks fine, it is fine"',
  },
  {
    key: 'q4', lo: 'LO4 Write down',
    text: 'What is the most useful thing to write down after an incident?',
    options: {
      A: 'Nothing: the IT person will find out what happened',
      B: 'What happened, when, and what you saw (with a photo of the screen)',
      C: 'Only your name and your department',
    },
    correct: 'B',
    misconception: '"Documenting is the IT person\'s job"',
  },
  {
    key: 'q5', lo: 'LO5 Avoid mistakes',
    text: 'A colleague says: "Just delete that strange email and forget about it." What do you do?',
    options: {
      A: "Delete it: once it's gone, the danger is gone",
      B: "Keep it, don't click anything and report it",
      C: 'Forward it to the whole team to warn them',
    },
    correct: 'B',
    misconception: '"Deleting = safe" / "Forwarding helps"',
  },
];

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
