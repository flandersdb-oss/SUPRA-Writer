# SUPRA Writer — Fast & Accessible / Universal (Architecture v0.1)

## Principle: one editor, two user-facing editions

**Fast & Accessible** is the default lightweight workflow, designed to keep the original document editor, visible text controls, keyboard shortcuts, visual setup, and offline draft saving.

**Universal** is a compatibility-focused workspace on the *same document* with transparent file-format support information. Switching editions must **never replace or convert the current document**. The same autosave data and editing core are used in both modes. Profile preference persists locally.

## Actual supported formats (as tested by this project)

- DOCX: basic import/export with documented loss risks.
- HTML and TXT: import/export; text/html conversion limitations.
- Markdown (.md / .markdown): new **basic** import/export for headings, paragraphs, lists, quotes, bold and italic text. Raw HTML is escaped on import; Markdown export can flatten tables and advanced page layout.
- PDF: print/save-as-PDF output only; no PDF import.

## Not supported yet

ODT, RTF, old binary DOC, Apple Pages, WordPerfect, LaTeX, EPUB, and any other undeclared format. The Universal compatibility panel labels them *Planned*, not working. **No silent fallback that overwrites originals.**

## Research reviewed from other ChatGPT instances

- `SUPRA_CYCLE015_IMPACT_FIRST` / `SUPRA_CYCLE016_APK_STATION_BETTEROFFICE_DROIDLINE`: BetterOffice/OpenOOXML Rust/WASM candidate for DOCX, XLSX, and PPTX; research reviewed and external adapter started elsewhere, **not integrated or independently benchmarked in SUPRA Writer**. Apache-2.0 licensing and third-party notices need a pinned dependency review.
- Canonical `SUPRA_DISCOVERY_BRIDGE_CANONICAL`: Lexical (MIT) for accessible rich-text editing and Typst for structured publishing; candidates, not drop-in replacements. Test on fixture copies before any editor migration.
- Cycle 012 archival research: distinguish immutable original scans and revised derivatives for any future OCR/manuscript mode; validate every page, punctuation, and ligature.
- Read-only OOXML package-part hashing from Cycle 015 can help spot changed ZIP members; this alone cannot establish visual/semantic fidelity.

## High-value next engineering gates

1. Independent DOCX corpus: normal, RTL, CJK, mathematical, tables, nested styles, embedded objects, tracked changes.
2. Compare before/after document XML parts and reference renders; count actual loss and preservation.
3. Evaluate BetterOffice and Lexical on a separate adapter branch, with pinned upstream versions and rollback.
4. Improve recovery snapshots across sessions and verify browser/Windows behavior with simulated abrupt termination.
5. Only after demonstrated fidelity should Universal advertise additional formats. Do not invent completion percentages or vendor performance claims.

## Safety

Open untrusted documents in a restricted parser with size/time limits. Format conversion is explicit and reversible. Universal mode is a feature profile, not a claim of broad interoperability. Files remain local; user-approved exports are separate from autosave.
