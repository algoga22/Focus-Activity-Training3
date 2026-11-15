# Challenge 2 – Learner assessment

**Version 3:** the same quiz **at the start and at the end** of the session, in our QR web app ([`quiz/`](../quiz/)), paper sheet as backup

A 5-minute diagnostic quiz at the start of the session. It measures what participants already know, the misconceptions they have and what they would actually do, against **all** the learning objectives. It works online and onsite.

It is run **twice with exactly the same questions**:
- **At the start (minutes 5–10):** diagnostic. The right answers are **not** shown, so the quiz stays valid for the end.
- **At the end (minutes 53–56):** the same 5 questions, 30 seconds each. The app compares the two rounds for the group and for each person (see [Measuring progress](#measuring-progress)).

## Learning objectives assessed

> Provisional: to be replaced by the official Training 3 learning objectives.

| # | By the end of the training, participants are able to… |
|---|---|
| LO1 | **Recognise** a security incident |
| LO2 | **Take the first steps:** stop and disconnect |
| LO3 | **Report** the incident quickly to the right person |
| LO4 | **Write down** what happened |
| LO5 | **Avoid** the common mistakes (paying, deleting, hiding) |

There is **1 question per objective**: 5 questions, about 1 minute each at the start.

## How the questions are built to measure progress

A before/after quiz only shows progress if people can get it **wrong before** the training. Each question therefore follows the same rules:
- **A real situation,** no definitions and no tricks.
- **4 options**, so random guessing gives only 25 % (Q1: 4 situations to tick).
- **The wrong options are the beliefs of a non-technical person**, and each of them is corrected in the slides of minutes 10–26: "switch it off", "run the antivirus yourself", "email the coordinator", "ask a friend", "explain which virus it was", "forward it to warn the team", "reply to ask if it is genuine". They sound reasonable, but they are clearly wrong after the training.
- **The right answer uses the words of the training** (Stop, Disconnect, Report, Write down), so it is indisputable for the trainer.
- **The right answers are only shown at the end**, so the first round does not teach the second.

## The quiz

### Q1 – Which of these situations are security incidents? *(choose all that apply)* · LO1
- **A.** You lose the work phone with the beneficiaries' contacts on the bus
- **B.** Your computer shows "Windows updates installed, please restart"
- **C.** Your email account sends messages that you didn't write
- **D.** You send the list of volunteers' home addresses to the wrong person

### Q2 – A message fills your screen: "Your files are locked. Pay €500 to get them back." What do you do first? · LO2
- **A.** Switch the computer off completely, so the virus stops
- **B.** Turn off the Wi-Fi or unplug the cable, and leave the computer on
- **C.** Run the antivirus to remove the virus yourself
- **D.** Pay quickly, so the NGO does not lose its files

### Q3 – It's Friday at 18:00. You clicked a strange link and now your computer is acting oddly. Your coordinator has gone home. What do you do? · LO3
- **A.** Email the coordinator from this computer, so it is in writing
- **B.** Ask a friend who is good with computers to have a look
- **C.** Call the backup contact person now
- **D.** Wait an hour: if it looks normal again, there is no need to report it

### Q4 – You have reported an incident. What is the most useful thing to write down? · LO4
- **A.** When it happened, what you saw and what you did, with a photo of the screen
- **B.** Which virus or hacker you think caused it
- **C.** Nothing: the IT person can find everything in the computer
- **D.** A short message: "computer problem, please help"

### Q5 – A colleague says: "Just delete that strange email and forget about it." What do you do? · LO5
- **A.** Delete it: once it's gone, the danger is gone
- **B.** Forward it to the whole team to warn them
- **C.** Reply to the sender to ask if it is genuine
- **D.** Keep it, don't click anything and report it

## Answer key and scoring (for the trainer)

| Q | Correct answer | Good (2) | Partial (1) | Wrong (0) | Misconception revealed by a wrong answer | Where the training answers it |
|---|---|---|---|---|---|---|
| Q1 | **A, C, D** | All 3, without B | 1–2 correct, or B included | None correct | "An incident is only a virus or a hacker" | Slides 8–11 (lost, leaked, acting strange; "Incident or not?") |
| Q2 | **B** | B | – | A, C or D | "Switching off / fixing it myself is safest", "Paying fixes it" | Slides 14–15, 17–18 |
| Q3 | **C** | C | – | A, B or D | "It can wait", "A friend can fix it", "An email from that computer is enough" | Slides 14, 16 |
| Q4 | **A** | A | – | B, C or D | "I must explain the technical cause", "Documenting is IT's job" | Slide 16 |
| Q5 | **D** | D | – | A, B or C | "Deleting = safe", "Forwarding or replying helps" | Slide 17 |

**Maximum score: 10 points per participant.** At the start, the trainer notes **which objectives most people got wrong**, to spend more time on them during the session. The right letters change from question to question (B, C, A, D), so there is no pattern to guess.

## Tool choice: our own QR quiz app (paper sheet as backup)

We built a small Kahoot-style web app: [`quiz/`](../quiz/), online at <https://algoga22.github.io/Focus-Activity-Training3/>. The trainer projects the host screen (menu → **Quiz**); participants scan the QR code and answer on their phone. The same app and the same room are used later for the game of Challenge 3, so participants join only once.

| | Onsite | Online |
|---|---|---|
| **Questions** | On the projected host screen (and on each phone) | On the shared host screen (and on each phone or computer) |
| **Answers** | Scan the QR code, choose a nickname, tap the answer | Open the link pasted in the call chat, same steps |
| **No internet?** | Paper [answer sheet](answer-sheet.pdf) with the same questions (Start and End columns) | – |

**Why this tool:**
1. **No install and no account for participants.** The bootcamp guidelines say to avoid account creation. Joining is: scan the QR, type a nickname (about 30 seconds), and people can join while the trainers introduce themselves, so the 5 minutes stay for the questions.
2. **Same tool online and onsite.** A QR code in the room and a link in the chat open the same page, and the trainer uses the same screen and the same answer key.
3. **Suitable for the audience.** Everyone can scan a QR code with the phone camera; the page shows one question with big coloured buttons (with letters, so colour is never the only cue) and nothing else to learn.
4. **Instant, automatic scoring.** The app applies the answer key (2/1/0 points) as people answer. At the end the trainer sees, for each learning objective, how many got it right, and the misconception behind the most common wrong answer, so the next 50 minutes can focus on those topics.
5. **Before / after with no extra work.** The same room is used all session, so each nickname's answers at the start and at the end are matched automatically: the app shows the % of right answers per objective before and after, how many people improved, the misconceptions that remain, and a CSV with both rounds per person. Each participant also sees their own score at the start and at the end on the phone.
6. **Independent and free.** It is our own code on free hosting: no licence, no ads, no player limit, no dependence on a commercial quiz platform changing its free plan.
7. **Privacy-friendly.** Only a nickname and the answers are stored, on EU servers (Belgium), and the trainer deletes the data after the session with one button.
8. **A backup that always works.** NGO venues don't always have reliable Wi-Fi: the paper answer sheet uses the same questions, the same scoring and has a column for the start and one for the end.

Set-up and use on the day: [`quiz/README.md`](../quiz/README.md).

## Measuring progress

**Main measure: the same quiz at the start and at the end.**

| | Start (minutes 5–10) | End (minutes 53–56) |
|---|---|---|
| Questions | Q1–Q5 | The same Q1–Q5, same order and options |
| Time | ~1 minute per question | 30 seconds per question |
| Right answers shown? | No (the slides cover them) | Yes, after each question |
| Result | Starting point per objective | Before / after per objective, team score, number of people who improved, individual progress (CSV) |

Example of what the trainer can say at the end: *"At the start, 30 % of you would have unplugged the cable and left the computer on. Now it's 90 %."*

**Supporting evidence during the session:** the game ([Challenge 3](../03-serious-game/)) measures the same five objectives on new situations, and its debrief shows the quiz result at the start next to each objective. The Challenge 4 case lets each person show the skill in a new situation.

| Objective | Quiz, start | Game (minute 26) | Quiz, end |
|---|---|---|---|
| LO1 Recognise | Q1 | Phase 1, "Is it a fire?" | Q1 |
| LO2 First steps | Q2 | Phase 2, "Cut the fire" | Q2 |
| LO3 Report | Q3 | Phase 3, "Call the firefighters" | Q3 |
| LO4 Write down | Q4 | Phase 4, "Fire report" | Q4 |
| LO5 Avoid mistakes | Q5 | Trap cards avoided | Q5 |

**No internet?** The paper [answer sheet](answer-sheet.pdf) has two columns of boxes: *Start* and *End*.

See [evaluation criteria](../docs/evaluation-criteria.md#challenge-2--learner-assessment).
