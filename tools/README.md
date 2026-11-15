# Tools

Small Python scripts that generate the files in this repository.

| Script | Output | Requires |
|---|---|---|
| `build_session_plan.py` | `01-training-plan/Training3_Session_Plan.pdf` | reportlab |
| `build_answer_sheet.py` | `02-learner-assessment/answer-sheet.pdf` | reportlab |

Usage: `python tools/<script>.py <output-file>` (for example with uv: `uv run --with reportlab python tools/build_session_plan.py 01-training-plan/Training3_Session_Plan.pdf`)

The other PDFs are built with LuaLaTeX in their own folder (`latexmk -lualatex <file>.tex`):

| Source | Output |
|---|---|
| [`slides/latex/60-minute-training.tex`](../slides/latex/60-minute-training.tex) | 60-minute training slides |
| [`03-serious-game/concept/game-concept.tex`](../03-serious-game/concept/game-concept.tex) | Game concept deck |
| [`04-learning-by-doing/case-sheet.tex`](../04-learning-by-doing/case-sheet.tex) | Case sheet |
| [`05-take-home/cheat-sheet.tex`](../05-take-home/cheat-sheet.tex) | Cheat sheet |
