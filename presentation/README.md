# Project presentations

This folder has two decks, both with the same theme as the training slides:

| File | What it is | For |
|---|---|---|
| [`5-minute-presentation.pdf`](5-minute-presentation.pdf) | **5-minute presentation** of the project (10 slides) | The jury (5 minutes + 5 minutes of questions) |
| [`project-overview.pdf`](project-overview.pdf) | **Project guide** (32 slides): every part of the project explained in detail, with screenshots | The team, to read and understand everything; not meant to be presented |

- **Sources:** [`5-minute-presentation.tex`](5-minute-presentation.tex), [`project-overview.tex`](project-overview.tex) and their shared style [`common.tex`](common.tex). Build them from this folder with `latexmk -lualatex <file>.tex`.
- **Screenshots:** [`screenshots/`](screenshots/), taken from the web app in demo mode with 6 test players.

## Project guide: contents

8 sections (shown by the bar at the bottom of each slide):
- **Overview:** the brief, the audience, the analogy and the rule, the learning objectives.
- **Plan:** the session plan, what the trainers do minute by minute, the criteria, the training slides.
- **Quiz:** the questions, their design, the screens, before / after, the tool choice.
- **Game:** the idea, the 16 right moves, how the fire is calculated, the screens, the criteria.
- **Case:** the story, the trainer guide and answer key, the debrief.
- **Cheat sheet:** what is on it and why.
- **Web app:** architecture and data, the trainer's flow, privacy, testing and how to change the content.
- **Team:** where everything is, open points and checklist, useful links.

## 5-minute presentation

### Slides and timing

| Slide | Content | Time |
|---|---|---|
| 1 | Title | 15 s |
| 2 | The idea: one analogy (an incident is like a fire), one rule (Stop, Disconnect, Report, Write down) | 35 s |
| 3 | The hour: alternating theory and activities, one QR code for the whole session | 30 s |
| 4 | Quiz (Challenge 2): trainer screen and phone | 35 s |
| 5 | The same quiz at the end: before / after comparison | 30 s |
| 6 | The game "Put out the fire" (Challenge 3) | 35 s |
| 7 | Game feedback and evidence: results after each phase, debrief | 30 s |
| 8 | The case "The urgent payment" (Challenge 4) and the cheat sheet (Challenge 5) | 35 s |
| 9 | Why it works, plus a QR code so the jury can try the app | 25 s |
| 10 | Thank you, questions | 5 s |

A suggested text for each slide is in the speaker notes. To see them, change `hide notes` to `show notes on second screen=right` in `5-minute-presentation.tex`.

**Tip for the questions:** keep the trainer screen of the web app open in another tab, so you can show the game live if the jury asks.
