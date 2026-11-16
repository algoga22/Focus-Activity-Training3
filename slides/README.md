# Slides

All the decks of the project, in LaTeX (Beamer), with the same theme ([`beamerthemefocus.sty`](beamerthemefocus.sty)): Montserrat + Fira Sans, Font Awesome icons, navy / orange-red / green.

| File | What it is | For |
|---|---|---|
| [`60-minute-training.pdf`](60-minute-training.pdf) | **The training itself**: 32 slides with speaker notes and a progress bar of the hour | The participants (minutes 0–60) |
| [`5-minute-presentation.pdf`](5-minute-presentation.pdf) | **Presentation of the project** (10 slides) | The jury (5 minutes + 5 minutes of questions) |
| [`30-second-video.mp4`](30-second-video.mp4) | **30-second video** of the whole project: the 5 challenges with screenshots of the web app, the case sheet and the cheat sheet, with music | The jury, inside the 5-minute presentation |
| [`project-overview.pdf`](project-overview.pdf) | **Project guide** (32 slides): every part of the project explained in detail, with screenshots | The team, to read; not meant to be presented |

Each PDF has its `.tex` source with the same name. The two project decks share [`common.tex`](common.tex) and use the app screenshots in [`screenshots/`](screenshots/) (demo mode, 6 test players).

```sh
cd slides && latexmk -lualatex 60-minute-training.tex   # or 5-minute-presentation.tex, project-overview.tex
```

Build the [cheat sheet](../05-take-home/cheat-sheet.pdf) and the [case sheet](../04-learning-by-doing/case-sheet.pdf) first: some slides show them.

**Speaker notes:** in the 60-minute training and the 5-minute presentation, change `hide notes` to `show notes on second screen=right` in the `.tex` file to see them.

## 60-minute training

Guidelines: one slide = one idea, visual over text, short sentences with action verbs, limited colour palette, purposeful animations (overlays).

**Colour palette:** navy `#1F3A5F` (main), orange-red `#E4572E` (alerts, "don't", "you do"), green `#2E9E5B` (correct answers), light blue-grey backgrounds.

| Slides | Min | Part of the session | Challenge |
|---|---|---|---|
| 1–5 | 0–5 | Welcome: title, who we are, warm-up "Raise your hand if…", agenda, what you will take home | – |
| 6 | 5–10 | Quiz: how to join (QR code). The quiz runs in the [web app](../quiz/) | Challenge 2 |
| 7–12 | 10–18 | Spot it: what an incident is, four everyday incidents, the fire analogy, "Incident or not?" vote, "Not sure? Sound the alarm" | – |
| 13–18 | 18–26 | Act on it: the 4-step rule (Stop, Disconnect, Report, Write down), steps in detail, what never to do, worked example (ransom screen) | – |
| 19–21 | 26–41 | Game time: "Put out the fire", how to play, four rooms and four steps. The game runs in the [web app](../quiz/) | Challenge 3 |
| 22–28 | 41–53 | Your turn: "The urgent payment" in 3 moments, group step, answers and debrief | Challenge 4 |
| 29 | 53–56 | What have we learned? The same quiz again; the before / after comparison runs in the [web app](../quiz/) | Challenge 2 |
| 30–32 | 56–60 | The cheat sheet, three key messages and feedback, thank you | Challenge 5 |

## 5-minute presentation

| Slide | Content | Time |
|---|---|---|
| 1 | Title | 15 s |
| 2 | The idea: one analogy (an incident is like a fire), one rule (Stop, Disconnect, Report, Write down) | 35 s |
| 3 | The hour: the 8 parts with their minutes, duration and a short definition; one QR code for the whole session | 30 s |
| 4 | Quiz (Challenge 2): trainer screen and phone | 35 s |
| 5 | The same quiz at the end: before / after comparison | 30 s |
| 6 | The game "Put out the fire" (Challenge 3) | 35 s |
| 7 | Game feedback and evidence: results after each phase, debrief | 30 s |
| 8 | The case "The urgent payment" (Challenge 4), with the case sheet | 25 s |
| 9 | The cheat sheet (Challenge 5) | 20 s |
| 10 | Thank you, questions | 5 s |

A suggested text for each slide is in the speaker notes. To see them, change `hide notes` to `show notes on second screen=right` in the `.tex` file.

**Tip for the questions:** keep the trainer screen of the web app open in another tab, so you can show the game live if the jury asks.

## Project overview

8 sections (shown by the bar at the bottom of each slide):
- **Overview:** the brief, the audience, the analogy and the rule, the learning objectives.
- **Plan:** the session plan, what the trainers do minute by minute, the criteria, the training slides.
- **Quiz:** the questions, their design, the screens, before / after, the tool choice.
- **Game:** the idea, the 16 right moves, how the fire is calculated, the screens, the criteria.
- **Case:** the story, the trainer guide and answer key, the debrief.
- **Cheat sheet:** what is on it and why.
- **Web app:** architecture and data, the trainer's flow, privacy, testing and how to change the content.
- **Team:** where everything is, open points and checklist, useful links.
