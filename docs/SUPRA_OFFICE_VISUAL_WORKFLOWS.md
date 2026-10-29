# SUPRA Office Visual Workflows — Experimental v0.1

## The design rule

Users pick **what result they want** rather than finding multiple setting names.

Three stages appear visually:
1. **Goal**: professional letter, budget tracker, or project proposal.
2. **Preview**: readable list of what changes, with core choices editable.
3. **Apply**: one deliberate action configures multiple settings.

**Transparency**: advanced controls remain available. No AI API, registration, cloud sync, font download or remote document upload is required.

## Three applications

| Application | Verified prototype features | Still missing |
|---|---|---|
| SUPRA Writer v0.5 base + Visual Setup experiment | 6 bundled appearance outcomes, user paper/size/spacing choices, existing DOCX/basic editing | Real pagination, high-fidelity DOCX, images/footnotes |
| SUPRA Sheets v0.1 | 25 × 10 editable cell grid (250 cells), local autosave, 4 workflow choices, + - * / ^, references, SUM/AVERAGE/MIN/MAX/COUNT, CSV import/export, JSON backup | XLSX/ODS, charts, Excel formula coverage, multisheet, collaboration |
| SUPRA Present v0.1 | 4 goal workflows, 4 themes, slide edit/add/duplicate/reorder, offline HTML slideshow export, JSON backup | PPTX/ODP, embedded media, live collaboration, slide master/layout engine |

## Efficiency accounting

Workflow **configuration counts** are measured by declared steps and seeded cells, **not** by a scientific timed click benchmark. E.g. applying Budget populates 20+ cells, including 7 formulas, in one workflow application; some manual implementations could paste or import values faster.

Future benchmark: count actual clicks and time-to-completion against manual workflows in LibreOffice/ONLYOFFICE with identical scenarios and fresh participants.

## Safety and data fidelity

- The basic Sheets parser does not use eval; unsupported functions return explicit errors.
- Recursive spreadsheet references report cycles. CSV import is size- and grid-bounded, and is not treated as executable formulas.
- CSV export contains calculated values and is not a substitute for a formula-preserving file. JSON project backup preserves formulas.
- Present text is rendered with textContent and escaped for its exported offline HTML.
- The Writer helper operates through existing visible controls and preserves manual advanced settings.

## Release gates

Automated GitHub CI tests source syntax, real Chromium flows, formula results, HTML export safety and Writer appearance changes. Windows packaging tests must also succeed before any release. GitHub staging branch is **not** a finished stable office suite.

## Autosave and history

See [Autosave, Undo and Redo](AUTOSAVE_UNDO_REDO.md). Current work in each editor is stored locally; Sheets and Present now have 40-step editing history and explicit Undo/Redo buttons, while Writer retains its native editing Undo/Redo and gains a visible Save now control.
