# SUPRA Office Roadmap — v0.6 alpha

## Implemented and verified (pending v0.6 CI)
- Writer: 162 searchable font choices, 17 looks and 18 Quick Actions, local autosave, DOCX/HTML/TXT basics, manual page breaks with DOCX round-trip, Windows installer.
- Writer Visual Setup: 6 result-first options and 4 overrides; all existing expert controls remain.
- Sheets experimental prototype: 250 editable cells, 4 workflow templates, basic formula parser, CSV import/export, JSON project backups.
- Present experimental prototype: 4 outcome templates, 4 themes, editable slide order and content, offline HTML slideshow and JSON project backups.

## High-priority quality targets
1. Writer: accurate automatic pagination, headers/footers, reliable DOCX round-trip and loss warnings.
2. Sheets: production formula engine (IronCalc or tested equivalent), XLSX/ODS, number formatting, copy/paste and workbook sheets.
3. Present: editable PPTX/ODP, slide objects, images, master layouts, animation and export fidelity.
4. Shared: a reviewed, versioned visual workflow schema; accessible keyboard/touch UI and localization.
5. All: security review, signed installer, real Windows machine and Android device tests.

## Explicit boundaries
A passing package job does not prove Word/Excel/PowerPoint parity. The office prototypes need independent compatibility fixtures, not only functional smoke tests. Preserve local-first architecture and licensing provenance.
