# Challenge 5 – Take-home cheat sheet

**In one sentence:** a one-page sheet to keep next to the computer that tells anyone at the NGO what to do in the first minutes when something goes wrong.

| File | What it is |
|---|---|
| [`cheat-sheet.pdf`](cheat-sheet.pdf) | The cheat sheet, A4, one page (source: [`cheat-sheet.tex`](cheat-sheet.tex)) |
| Slide 30 of the [60-minute training slides](../slides/latex/60-minute-training.pdf) | Presents the sheet at the end of the session |

**When:** handed out at minute 56, right after the final quiz. Participants fill in their phone numbers before leaving. Online: the PDF is shared in the chat.

## What is on the sheet

| Section | Content | Why |
|---|---|---|
| **Header** | "Something seems wrong? Treat it like a fire: the sooner you act, the less damage it does." | The analogy used during the whole session: one look recalls the training |
| **1 · Spot it** | When to use the sheet: something is **lost**, something **leaks**, something **acts strange**, an **odd request** (urgent payment, new bank details, a code, "keep it secret"). "Not sure? Sound the alarm." | Clear triggers, with the signs seen in the slides, the game and the case |
| **2 · One rule, four steps** | **Stop, Disconnect, Report, Write down**, each with what to do (✓) and what not to do (✗) and its fire image | The core decision support, in the same words as the slides |
| Inside step 3 | Blank lines for **my contact, the backup and the bank**, with phone numbers | In an emergency nobody looks for a number: it must already be on the sheet |
| Inside step 4 | Tick boxes: when, what you saw, what you did and who you called, a photo of the screen | Makes the note quick and complete |
| **3 · Never** | Pay, delete, hide, restart or switch off, forward or reply | The common mistakes (the quiz misconceptions and the game's trap cards) |
| **4 · Quick decisions** | First move for 5 NGO situations: ransom screen, lost phone, wrong recipient, hacked page, fake invoice paid | Turns the rule into an action for the most likely cases |
| **Footer** | "Nobody gets blamed for reporting. The only mistake is to stay silent." | Removes the main reason people hide incidents |

**Only content covered in the training.** Every line of the sheet comes from a slide, the game or the case:
- the triggers: slides 8–9 and the case;
- the four steps: slides 14–16;
- "Never": slide 17;
- the quick decisions: slide 18, the four rooms of the game and the case;
- "no blame": slides 12 and 28.

## Design choices

- **One page, readable in a few seconds:** numbered sections, big step names, icons, three colours (navy for information, orange-red for alerts and mistakes, green for "do this").
- **Same look as the slides and the web app** (fonts, colours, icons), so participants recognise it at once.
- **Personalised:** the phone numbers make it the NGO's own procedure, not a generic poster.
- **Prints well** in colour or in black and white: colour is never the only cue, because every item also has an icon, a ✓ or a ✗.

## Build

```sh
cd 05-take-home && latexmk -lualatex cheat-sheet.tex
```

Needs LuaLaTeX with the Montserrat and Fira Sans fonts (the same as the slides).

See [evaluation criteria](../docs/evaluation-criteria.md#challenge-5--take-home).
