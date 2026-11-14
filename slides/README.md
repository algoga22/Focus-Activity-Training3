# Slides

The deck is written in LaTeX (Beamer) in [`latex/`](latex/), with its own theme ([`beamerthemefocus.sty`](latex/beamerthemefocus.sty)): Montserrat + Fira Sans, Font Awesome icons and a progress bar showing which part of the 60-minute session each slide belongs to.

```sh
cd slides/latex && latexmk -lualatex slides.tex
```

The compiled PDF is [`latex/slides.pdf`](latex/slides.pdf). Rebuild it with the command above after any change.

- Speaker notes are in `\note{}`: change `hide notes` to `show notes on second screen=right` to see them.

Guidelines: one slide = one idea, visual over text, short sentences with action verbs, limited colour palette, purposeful animations (overlays).

**Colour palette:** navy `#1F3A5F` (main), orange-red `#E4572E` (alerts, "don't", "you do"), green `#2E9E5B` (correct answers), light blue-grey backgrounds.

## Progress

| Min | Part of the session | Challenge | Status |
|---|---|---|---|
| 0–5 | Welcome: title, who we are, warm-up "Raise your hand if…", agenda, what you will take home | – | Done |
| 5–10 | Quiz: how to join (QR). The quiz itself runs in the [quiz app](../quiz/) | Challenge 2 | Done |
| 10–18 | Spot it: recognise that something has gone wrong | – | To do |
| 18–26 | Act on it: Stop, Disconnect, Report, Write down, and what never to do | – | To do |
| 26–41 | Game time | Challenge 3 | To do |
| 41–55 | Your turn: Marie's case, then the answers | Challenge 4 | To do |
| 55–60 | Cheat sheet, recap and feedback | Challenge 5 | To do |
