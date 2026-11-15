# Cybersecurity for NGOs Bootcamp – Training 3

**When something goes wrong: a simple incident response** (60-minute session)

Our team's submission for the *Cybersecurity for NGOs Bootcamp* (13 & 16 November 2026).
The goal is a simple, jargon-free training that helps NGO staff with no technical background
recognise an incident and take the right first steps.

## Deliverables

There are 5 challenges plus the slides, each worth 100 points (600 points in total).

| # | Challenge | Folder | Status |
|---|---|---|---|
| 1 | Training plan | [`01-training-plan/`](01-training-plan/) | Updated with the slides, quiz and game (LOs provisional) |
| 2 | Learner assessment (diagnostic quiz at the start, max 5 min) | [`02-learner-assessment/`](02-learner-assessment/), app in [`quiz/`](quiz/) | Quiz app ready and online |
| 3 | Serious game ("Put out the fire") | [`03-serious-game/`](03-serious-game/), app in [`quiz/`](quiz/) | Concept + playable game online |
| 4 | Learning by doing (also measures what participants have learned) | [`04-learning-by-doing/`](04-learning-by-doing/) | To do (case to be chosen) |
| 5 | Take-home cheat sheet | [`05-take-home/`](05-take-home/) | To do |
| – | Web app (quiz + game) | [`quiz/`](quiz/), online at <https://algoga22.github.io/Focus-Activity-Training3/> | Online (Firebase) |
| – | Slides | [`slides/`](slides/) | Minutes 0–41 done |

**Final submission:** Monday 16 November 2026, 12:00.
**Presentation:** 5 minutes + 5 minutes Q&A.

## How the challenges fit into the session

| Min | Topic | Challenge |
|---|---|---|
| 0–5 | Welcome participants and introduce the session | Slides |
| 5–10 | Assess what participants already know: quiz "What would you do?" on the phone | Challenge 2 (web app) |
| 10–18 | Recognise that something has gone wrong ("Spot it", fire analogy) | Slides |
| 18–26 | Apply the first steps: Stop, Disconnect, Report, Write down | Slides |
| 26–41 | Play an incident response game: "Put out the fire" | Challenge 3 (web app) |
| 41–55 | Practise with a real NGO case and measure what participants have learned | Challenge 4 |
| 55–60 | Review key points and close | Challenge 5 |

One thread runs through the whole hour: **an incident is like a fire** (the sooner you spot it, the less damage) and **one rule, four steps**. The quiz misconceptions are answered in the slides and come back as trap cards in the game.

The full plan is in [`01-training-plan/`](01-training-plan/).

## Repository structure

```
01-training-plan/       Challenge 1 – session plan (what / how long / how)
02-learner-assessment/  Challenge 2 – diagnostic quiz (start of session)
03-serious-game/        Challenge 3 – game covering all learning objectives
04-learning-by-doing/   Challenge 4 – hands-on case + measuring learning
05-take-home/           Challenge 5 – cheat sheet
quiz/                   QR web app: quiz (Challenge 2) and game (Challenge 3), trainer screen + phone page
slides/                 Presentation slides
docs/                   Evaluation criteria and team notes
tools/                  Scripts that generate the PDFs
```

## Open questions for the organisers

- [ ] Official learning objectives for Training 3 (and the Trainer Information Form)
- [ ] Are there intermediate submissions, or only the final one?
- [ ] Expected file format for each challenge
