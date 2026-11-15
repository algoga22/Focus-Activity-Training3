# Quiz and game app (Challenges 2 and 3)

Our own Kahoot-style web app for the session. The trainer screen opens on a **menu** with two activities:

- **Quiz: what would you do?** The diagnostic quiz of [Challenge 2](../02-learner-assessment/), minutes 5–10.
- **Game: Put out the fire.** The serious game of [Challenge 3](../03-serious-game/), minutes 26–41.

Participants scan a QR code, pick a nickname and answer on their phone: no app, no account. They join **once**. When the trainer switches from the quiz to the game (button **Menu**), the phones follow by themselves.

| Page | Who | What it does |
|---|---|---|
| `host.html` | Trainer (projected) | Creates a room with a 4-digit code and QR, then the menu (quiz or game). Shows who joined, the questions, a timer, the answers, then the results per learning objective, CSV export and data deletion |
| `index.html` | Participants (phone) | Join with the QR or the code, choose a nickname, answer by tapping. Quiz: Q1 allows several answers, answers can be changed until the trainer closes the question. Game: the first tap locks the answer |

**Look and feel:** Digital Learning Hub branding and an "incident response team" theme for Training 3. Each question is an *incident* with its own animated illustration ([`scenes.js`](scenes.js)): a radar, a ransom screen, Friday 18:00, incident notes, a suspicious email. Every option has a colour, a letter and an icon; every participant gets an avatar and can ask for a random "cyber name"; the results end with a *mission debrief*. Branding and trainer names are in [`brand.js`](brand.js).

The questions, the answer key and the scoring (2 / 1 / 0, max 10) are in [`questions.js`](questions.js), the same as in the [Challenge 2 README](../02-learner-assessment/README.md).

## The game: Put out the fire

Content and rules: [`game.js`](game.js). Trainer screen: [`host-game.js`](host-game.js). Concept: [`game-concept.pdf`](../03-serious-game/concept/game-concept.pdf).

- **4 rooms of the NGO = 4 rounds**, one real incident each: work phone lost on the bus, hacked Facebook page, list sent to the wrong person, ransomware.
- **Each round = 4 phases**, the steps of the rule: *Is it a fire?* (recognise), *Cut the fire* (stop and disconnect), *Call the firefighters* (report), *Fire report* (write down). Each phase has 1 right move and 2 **trap cards** (the classic mistakes and the quiz misconceptions).
- **One fire per room for the whole team.** It grows 1.6 % per second while people answer. When the phase closes it goes down with the share of right answers (water, up to −40 %) and up with the share of trap cards (petrol, up to +30 %). A room that ends under 50 % is *saved*, otherwise *damaged*; at 100 % it *burns down* and the next room starts at 45 % instead of 20 % (*the fire spreads*).
- **Surprise:** in the last room a "hacker" message from "Anna (management)" asks to pay and keep it secret.
- **Points for everyone:** 100 for a right move + up to 50 for speed. Leaderboard after each room.
- **Pace:** the trainer starts each room. The phases then run by themselves: 25 s to answer (or less, if everybody has answered), 9 s for the result with the explanation, then the next phase. **Pause** stops the countdown, so you can comment.
- **Debrief:** rooms saved, right moves per objective (LO1–LO4, plus LO5 = trap cards avoided), the most chosen trap cards, top 3, every player's answers and a CSV.

**Correct answers are not shown to participants**: the quiz is a diagnostic and the answers are covered during the session. The trainer can still reveal them on the main screen (*Show correct answer*).

## Try it now (demo mode)

Add `?demo` to the address (or leave the Firebase config empty) to run the app in **demo mode**: everything stays in one browser, so open the participant page in other tabs.

```sh
cd quiz && python3 -m http.server 8000
```

Open <http://localhost:8000/host.html?demo>, choose the quiz or the game, then open the link shown under the QR in one or more new tabs.

## Set-up for real use (one time, ~10 minutes)

The phones and the trainer screen talk through a free **Firebase Realtime Database**. Only the team needs a Google account; participants sign in anonymously without noticing.

1. Go to <https://console.firebase.google.com> → **Create a project** (Google Analytics: off).
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Build → Realtime Database → Create database** → location **europe-west1 (Belgium)** → *Start in locked mode*. Open the **Rules** tab, paste the content of [`database.rules.json`](database.rules.json) and **Publish**.
4. **Project settings → General → Your apps → Web (`</>`)** → register an app called `quiz` (no hosting yet) → copy the values of `firebaseConfig` into [`firebase-config.js`](firebase-config.js). Make sure `databaseURL` is included.
5. Publish the site (choose one):
   - **GitHub Pages** (what we use: <https://algoga22.github.io/Focus-Activity-Training3/>): *Settings → Pages → Source: GitHub Actions*. The workflow [`quiz-pages.yml`](../.github/workflows/quiz-pages.yml) publishes this folder on every push. Then in Firebase, **Authentication → Settings → Authorized domains → Add** `<github-user>.github.io`.
   - **Firebase Hosting** (works with a private repository): `cd quiz && npx firebase-tools login && npx firebase-tools deploy --project <project-id>`. This also uploads the database rules.

The config values in `firebase-config.js` are public by design; the [rules](database.rules.json) protect the data:
- only signed-in (anonymous) users can read a room, and only if they know its code;
- only the device that created a room can change it or delete it;
- participants can only write their own nickname and their own answer, only for the open question.

## On the day

1. Open `host.html` on the trainer laptop a few minutes before (it keeps the same room if you reload) and choose **Quiz** in the menu.
2. Show the QR while you introduce yourselves, so people join before the quiz starts. Online: **Copy link for the chat**.
3. Keyboard: `→`, `Space` or `Enter` = main button (start, close answers, next).
   **Restart** (during or after the quiz) goes back to the waiting room and deletes all answers; participants stay connected and do not need to scan again.
4. After the quiz: **Download CSV**, then **Menu → Game** at minute 26. Going back to the menu deletes the quiz answers; the participants stay connected.
5. After the game: **Download CSV** (evidence for Challenge 3), then **Delete data**.

**No internet at the venue?** Use the paper [answer sheet](../02-learner-assessment/answer-sheet.pdf) and the same questions on the slides.

## Privacy

Only a nickname and the answers are stored, on servers in the EU (Belgium). No names, e-mails or IP addresses are saved by the app. The trainer deletes the room data after the session.
