# Quiz app (Challenge 2)

Our own Kahoot-style quiz for the diagnostic quiz of [Challenge 2](../02-learner-assessment/). Participants scan a QR code, pick a nickname and answer on their phone: no app, no account. The trainer projects the host screen, moves through the questions and sees the results live.

| Page | Who | What it does |
|---|---|---|
| `host.html` | Trainer (projected) | Creates a room with a 4-digit code and QR, shows who joined, the questions, a timer, the answer distribution, then the class results per learning objective, CSV export and data deletion |
| `index.html` | Participants (phone) | Join with the QR or the code, choose a nickname, answer. Q1 allows several answers. Answers can be changed until the trainer closes the question |

The questions, the answer key and the scoring (2 / 1 / 0, max 10) are in [`questions.js`](questions.js), the same as in the [Challenge 2 README](../02-learner-assessment/README.md).

**Correct answers are not shown to participants**: the quiz is a diagnostic and the answers are covered during the session. The trainer can still reveal them on the main screen (*Show correct answer*).

## Try it now (demo mode)

Until the Firebase config is filled in, the app runs in **demo mode**: everything stays in one browser, so open the participant page in other tabs.

```sh
cd quiz && python3 -m http.server 8000
```

Open <http://localhost:8000/host.html>, then open the link shown under the QR in one or more new tabs.

## Set-up for real use (one time, ~10 minutes)

The phones and the trainer screen talk through a free **Firebase Realtime Database**. Only the team needs a Google account; participants sign in anonymously without noticing.

1. Go to <https://console.firebase.google.com> → **Create a project** (Google Analytics: off).
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Build → Realtime Database → Create database** → location **europe-west1 (Belgium)** → *Start in locked mode*. Open the **Rules** tab, paste the content of [`database.rules.json`](database.rules.json) and **Publish**.
4. **Project settings → General → Your apps → Web (`</>`)** → register an app called `quiz` (no hosting yet) → copy the values of `firebaseConfig` into [`firebase-config.js`](firebase-config.js). Make sure `databaseURL` is included.
5. Publish the site (choose one):
   - **GitHub Pages** (the repository is private, so this needs GitHub Pro, which is free with the GitHub Student Developer Pack): *Settings → Pages → Source: GitHub Actions*. The workflow [`quiz-pages.yml`](../.github/workflows/quiz-pages.yml) publishes this folder on every push. Then in Firebase, **Authentication → Settings → Authorized domains → Add** `<github-user>.github.io`.
   - **Firebase Hosting** (works with a private repository): `cd quiz && npx firebase-tools login && npx firebase-tools deploy --project <project-id>`. This also uploads the database rules.

The config values in `firebase-config.js` are public by design; the [rules](database.rules.json) protect the data:
- only signed-in (anonymous) users can read a room, and only if they know its code;
- only the device that created a room can change it or delete it;
- participants can only write their own nickname and their own answer, only for the open question.

## On the day

1. Open `host.html` on the trainer laptop a few minutes before (it keeps the same room if you reload).
2. Show the QR while you introduce yourselves, so people join before the quiz starts. Online: **Copy link for the chat**.
3. Keyboard: `→`, `Space` or `Enter` = main button (start, close answers, next).
4. At the end: **Download CSV** (to compare with the Challenge 4 case), then **Delete data**.

**No internet at the venue?** Use the paper [answer sheet](../02-learner-assessment/answer-sheet.pdf) and the same questions on the slides.

## Privacy

Only a nickname and the answers are stored, on servers in the EU (Belgium). No names, e-mails or IP addresses are saved by the app. The trainer deletes the room data after the session.
