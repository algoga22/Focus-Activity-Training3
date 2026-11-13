# Tools

Small Python scripts that generate the files in this repository.

| Script | Output | Requires |
|---|---|---|
| `build_session_plan.py` | `01-training-plan/Training3_Session_Plan.pdf` | reportlab |
| `build_answer_sheet.py` | `02-learner-assessment/answer-sheet.pdf` | reportlab |
| `build_slides.py` | `slides/Training3_Slides.pptx` | python-pptx, Pillow, macOS (emoji font) |

Usage: `python tools/<script>.py <output-file>`

Slides to PDF (LibreOffice): `soffice --headless --convert-to pdf --outdir slides slides/Training3_Slides.pptx`
