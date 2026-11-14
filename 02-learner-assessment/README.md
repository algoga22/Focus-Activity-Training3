# Challenge 2 – Learner assessment

**Version 2:** quiz app with QR code ([`quiz/`](../quiz/)), paper sheet as backup

A 5-minute diagnostic quiz at the start of the session. It measures what participants already know, the misconceptions they have and what they would actually do, against **all** the learning objectives. It works online and onsite.

It is run **once, at the start of the session (5–10 min)**. What participants have learned is measured at the end with the case in [Challenge 4](../04-learning-by-doing/), which uses the **same objectives** (see [Measuring progress](#measuring-progress)).

## Learning objectives assessed

> Provisional: to be replaced by the official Training 3 learning objectives.

| # | By the end of the training, participants are able to… |
|---|---|
| LO1 | **Recognise** a security incident |
| LO2 | **Take the first steps:** stop and disconnect |
| LO3 | **Report** the incident quickly to the right person |
| LO4 | **Write down** what happened |
| LO5 | **Avoid** the common mistakes (paying, deleting, hiding) |

There is **1 question per objective**: 5 questions, about 1 minute each.

## The quiz

Every question is a real situation ("What would you do?"), with no tricks.

### Q1 – Which of these situations are security incidents? *(choose all that apply)* · LO1
- **A.** You lose the work phone with the beneficiaries' contacts on the bus
- **B.** You forget your password and ask your coordinator to reset it
- **C.** Your email account sends messages that you didn't write
- **D.** You send the list of volunteers' addresses to the wrong person

### Q2 – A message fills your screen: "Your files are locked. Pay €500 to get them back." What do you do first? · LO2
- **A.** Pay quickly so the NGO doesn't lose its files
- **B.** Turn off the Wi-Fi or unplug the cable, and stop using the computer
- **C.** Restart the computer to see if the message goes away

### Q3 – It's Friday at 18:00. You clicked a strange link and now your computer is acting oddly. Your coordinator has gone home. What do you do? · LO3
- **A.** Wait until Monday and tell the coordinator then
- **B.** Call the backup contact person now
- **C.** Say nothing if everything looks normal again after a while

### Q4 – What is the most useful thing to write down after an incident? · LO4
- **A.** Nothing: the IT person will find out what happened
- **B.** What happened, when, and what you saw (with a photo of the screen)
- **C.** Only your name and your department

### Q5 – A colleague says: "Just delete that strange email and forget about it." What do you do? · LO5
- **A.** Delete it: once it's gone, the danger is gone
- **B.** Keep it, don't click anything and report it
- **C.** Forward it to the whole team to warn them

## Answer key and scoring (for the trainer)

| Q | Correct answer | Good (2) | Partial (1) | Wrong (0) | Misconception revealed by a wrong answer |
|---|---|---|---|---|---|
| Q1 | **A, C, D** | All 3, without B | 1–2 correct, or B included | None correct | "An incident is only a virus or a hacker" |
| Q2 | **B** | B | – | A or C | "Paying fixes it" / "Restarting fixes it" |
| Q3 | **B** | B | – | A or C | "It can wait" / "If it looks fine, it is fine" |
| Q4 | **B** | B | – | A or C | "Documenting is the IT person's job" |
| Q5 | **B** | B | – | A or C | "Deleting = safe" / "Forwarding helps" |

**Maximum score: 10 points per participant.** The trainer also notes **which questions most people got wrong**, to spend more time on those topics during the session.

## Tool choice: our own QR quiz app (paper sheet as backup)

We built a small Kahoot-style web app: [`quiz/`](../quiz/). The trainer projects the host screen; participants scan the QR code and answer on their phone.

| | Onsite | Online |
|---|---|---|
| **Questions** | On the projected host screen (and on each phone) | On the shared host screen (and on each phone or computer) |
| **Answers** | Scan the QR code, choose a nickname, tap the answer | Open the link pasted in the call chat, same steps |
| **No internet?** | Paper [answer sheet](answer-sheet.pdf) with the same questions | – |

**Why this tool:**
1. **No install and no account for participants.** The bootcamp guidelines say to avoid account creation. Joining is: scan the QR, type a nickname (about 30 seconds), and people can join while the trainers introduce themselves, so the 5 minutes stay for the questions.
2. **Same tool online and onsite.** A QR code in the room and a link in the chat open the same page, and the trainer uses the same screen and the same answer key.
3. **Suitable for the audience.** Everyone can scan a QR code with the phone camera; the page shows one question with big coloured buttons (with letters, so colour is never the only cue) and nothing else to learn.
4. **Instant, automatic scoring.** The app applies the answer key (2/1/0 points) as people answer. At the end the trainer sees, for each learning objective, how many got it right, and the misconception behind the most common wrong answer, so the next 50 minutes can focus on those topics.
5. **Individual results to measure progress.** Each answer is linked to a nickname. The trainer downloads a CSV and compares each person with their answers to the Challenge 4 case. The same quiz can also be run again at the end without any change.
6. **Independent and free.** It is our own code on free hosting: no licence, no ads, no player limit, no dependence on a commercial quiz platform changing its free plan.
7. **Privacy-friendly.** Only a nickname and the answers are stored, on EU servers (Belgium), and the trainer deletes the data after the session with one button.
8. **A backup that always works.** NGO venues don't always have reliable Wi-Fi: the paper answer sheet uses the same questions and the same scoring.

Set-up and use on the day: [`quiz/README.md`](../quiz/README.md).

## Measuring progress

The quiz is designed so it **could be run again at the end without any changes**. In our session, progress is measured with the case in [Challenge 4](../04-learning-by-doing/), whose questions cover the same objectives:

| Objective | Quiz (start) | Challenge 4 case (end) |
|---|---|---|
| LO1 Recognise | Q1 | Recognising the ransom screen as an incident (debrief) |
| LO2 First steps | Q2 | "What is the first thing Marie should do?" |
| LO3 Report | Q3 | "Who should she tell, and how, if the coordinator isn't there?" |
| LO4 Write down | Q4 | "What should she write down?" |
| LO5 Avoid mistakes | Q5 | "What should she not do?" |

Q2 and Q3 at the start and the Marie case at the end are **the same kind of situation** (ransom screen, coordinator not available). That makes the comparison fair: "At the start, X of you would have waited until Monday. Now Y of you would call the backup contact."

See [evaluation criteria](../docs/evaluation-criteria.md#challenge-2--learner-assessment).
