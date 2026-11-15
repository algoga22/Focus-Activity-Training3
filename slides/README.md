# Slides

The deck is written in LaTeX (Beamer) in [`latex/`](latex/), with its own theme ([`beamerthemefocus.sty`](latex/beamerthemefocus.sty)): Montserrat + Fira Sans, Font Awesome icons and a progress bar showing which part of the 60-minute session each slide belongs to.

```sh
cd slides/latex && latexmk -lualatex slides.tex
```

The compiled PDF is [`latex/slides.pdf`](latex/slides.pdf). Rebuild it with the command above after any change.

- Speaker notes (what to say, what to click in the web app, timing) are in `\note{}`: change `hide notes` to `show notes on second screen=right` in `slides.tex` to see them.

Guidelines: one slide = one idea, visual over text, short sentences with action verbs, limited colour palette, purposeful animations (overlays).

**Colour palette:** navy `#1F3A5F` (main), orange-red `#E4572E` (alerts, "don't", "you do"), green `#2E9E5B` (correct answers), light blue-grey backgrounds.

## Structure of the deck (32 slides)

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

Slide 30 shows the [cheat sheet](../05-take-home/cheat-sheet.pdf), so build the cheat sheet before the slides.
