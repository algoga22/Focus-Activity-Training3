# Cybersecurity for NGOs Bootcamp – Training 3

**When something goes wrong: a simple incident response** (60-minute session)

Our team's submission for the *Cybersecurity for NGOs Bootcamp* (13 & 16 November 2026), organised by the Digital Learning Hub.
It is a simple, jargon-free training for NGO staff and volunteers with no technical background: they learn to **recognise an incident** and to **take the right first steps**.

**Team and trainers:** Divya Ravichandran, Álvaro Gómez García and Mohammed Krayem, cybersecurity students at the University of Luxembourg.

## The idea in two sentences

**An incident is like a fire:** the sooner you spot it, the less damage it does. **One rule, four steps:** Stop, Disconnect, Report, Write down. Never pay, delete or hide it, and nobody gets blamed for reporting.

## Deliverables

| # | Challenge | What we made | Files |
|---|---|---|---|
| 1 | Training plan | 60-minute plan: topic, duration, method, objectives and challenge of every sequence | [`01-training-plan/`](01-training-plan/), [PDF](01-training-plan/Training3_Session_Plan.pdf) |
| 2 | Learner assessment | Quiz "What would you do?": 5 real situations, 1 per objective, on the phone via QR code. The **same quiz at the start and at the end**, compared automatically | [`02-learner-assessment/`](02-learner-assessment/), [paper backup](02-learner-assessment/answer-sheet.pdf) |
| 3 | Serious game | **"Put out the fire"**: 4 rooms of the NGO × the 4 steps, one fire for the team that grows every second, trap cards = petrol | [`03-serious-game/`](03-serious-game/), [concept](03-serious-game/concept/game-concept.pdf) |
| 4 | Learning by doing | **"The urgent payment"**: a new case (fake email from the president, €2,000 paid) solved alone, then in groups, then debriefed | [`04-learning-by-doing/`](04-learning-by-doing/), [case sheet](04-learning-by-doing/case-sheet.pdf) |
| 5 | Take-home | One-page **cheat sheet**: triggers, the 4 steps, phone numbers to fill in, "Never" list, quick decisions | [`05-take-home/`](05-take-home/), [cheat sheet](05-take-home/cheat-sheet.pdf) |
| – | Slides | 32 slides in LaTeX (Beamer) with speaker notes and a progress bar of the hour | [`slides/`](slides/), [PDF](slides/latex/slides.pdf) |
| – | Project presentations | 5-minute pitch for the jury, and a detailed project guide for the team (to read), both with screenshots of the quiz and the game | [`presentation/`](presentation/), [pitch](presentation/pitch.pdf), [guide](presentation/project-overview.pdf) |
| – | Web app | Our own Kahoot-style app for the quiz, the game and the final quiz: no account, works online and onsite | [`quiz/`](quiz/), <https://algoga22.github.io/Focus-Activity-Training3/> |

## The session

| Min | Topic | Method | Challenge |
|---|---|---|---|
| 0–5 | Welcome participants and introduce the session | Introductions, "Raise your hand if…", agenda; participants scan the QR code | Slides |
| 5–10 | Assess what participants already know | Quiz on the phone (right answers not shown yet) | 2 |
| 10–18 | Recognise that something has gone wrong | Examples, the fire analogy, "Incident or not?" vote | Slides |
| 18–26 | Apply the first steps | The 4-step rule, what never to do, worked example | Slides |
| 26–41 | Play an incident response game | "Put out the fire" in the web app | 3 |
| 41–53 | Apply the first steps to a new NGO case | "The urgent payment": alone, in groups, debrief | 4 |
| 53–56 | Measure what participants have learned | The same quiz again, before / after comparison | 2 |
| 56–60 | Review key points and close | Cheat sheet, key messages, feedback | 5 |

Details and rationale: [`01-training-plan/`](01-training-plan/).

## Running the session

1. Before the session: open <https://algoga22.github.io/Focus-Activity-Training3/host.html> on the trainer laptop and print the [case sheet](04-learning-by-doing/case-sheet.pdf), the [cheat sheet](05-take-home/cheat-sheet.pdf) and a few [paper answer sheets](02-learner-assessment/answer-sheet.pdf) as backup.
2. Present the [slides](slides/latex/slides.pdf). The speaker notes say what to do at each slide, including when to switch the web app to **Quiz**, **Game** and **Quiz again**.
3. At the end: download the CSV files from the web app (evidence of learning), then delete the room's data.

## Repository structure

```
01-training-plan/       Challenge 1 – session plan (README + PDF)
02-learner-assessment/  Challenge 2 – quiz questions, answer key, before/after measurement, paper answer sheet
03-serious-game/        Challenge 3 – "Put out the fire": description and concept deck
04-learning-by-doing/   Challenge 4 – "The urgent payment": trainer guide, answer key, case sheet
05-take-home/           Challenge 5 – cheat sheet
quiz/                   Web app (quiz + game): trainer screen and phone page, Firebase, GitHub Pages
slides/                 Slides (LaTeX Beamer) and their theme
presentation/           5-minute pitch for the jury and detailed project guide for the team
docs/                   Evaluation criteria of the bootcamp
tools/                  Scripts that generate the session plan and answer sheet PDFs
```

## Building the files

- **Slides, pitch, concept deck, case sheet, cheat sheet:** LuaLaTeX with the Montserrat and Fira Sans fonts. Build each one with `latexmk -lualatex <file>.tex` in its folder.
- **Session plan and answer sheet PDFs:** Python with reportlab. See [`tools/`](tools/).
- **Web app:** static files. GitHub Actions publishes [`quiz/`](quiz/) to GitHub Pages on every push; set-up in [`quiz/README.md`](quiz/README.md).
