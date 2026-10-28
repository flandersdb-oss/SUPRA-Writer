# SUPRA Writer v0.2 — Functional test report

**Method:** local Chromium headless UI automation (Playwright); independent DOCX parsing with Python's `zipfile` and `python-docx`; JavaScript `node --check`; desktop 1440x900 and mobile 390x844.

| Test | Result | Notes |
|---|---|---|
| App starts with editable document | PASS | Initial word count is calculated |
| Font catalogue | PASS | 162 distinct family names generated from categorized catalogue |
| Search/category filtering | PASS | Atkinson entries filtered correctly under readability choices |
| Select font | PASS | Georgia selected and reflected in applied appearance state |
| Custom font-file loading | PASS | Browser FontFace loaded a locally available TTF test fixture (not shipped) |
| Font-size numeric input | PASS | Accepted 34 px |
| Advanced preset by dropdown | PASS | Calm reading changes many document properties |
| One-click Advanced card | PASS | Clear characters applied through a single button press |
| Custom spacing / margins | PASS | 1.75 px letter spacing, paragraph gap 1.3 em, custom margin 122 px |
| Personal preset | PASS | Saved preset appeared in Quick looks and was re-applied |
| Undo look | PASS | Restored pre-preset properties |
| Insert irony mark | PASS | U+2E2E appended at edit cursor |
| Insert other symbols | PASS | Interrobang inserted from 30-symbol palette |
| DOCX export | PASS | ZIP contains valid styles/document XML and both symbols |
| External DOCX parser | PASS | `python-docx` opened file with symbols intact |
| DOCX import | PASS | Exported file reopened preserving symbols in document text |
| HTML export | PASS | File downloaded with appearance styles |
| Contrast meter | PASS | Displayed correct high-contrast state for preset |
| Mobile page width | PASS | No unwanted page-wide horizontal overflow at 390 px |
| Browser uncaught errors | PASS | No reported page errors |

**Not independently verified:** output fidelity in Microsoft Word or LibreOffice desktop, screen-reader experience, complex-script shaping, multi-page layout, all available font-family installs, unrestricted local font-listing permission, Android APK, and mobile virtual-keyboard interaction. The standalone app contains no font binaries or third-party JavaScript dependencies.