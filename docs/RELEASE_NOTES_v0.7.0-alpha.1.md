# SUPRA Writer v0.7.0-alpha.1 — Fast + Universal Writer (experimental)

## New
- Two user-facing Writer workspaces, **Fast & Accessible** (default) and **Universal** (format guidance), sharing one editing core and local draft.
- Switch modes without changing or converting the document.
- Basic Markdown (.md/.markdown) import/export for headings, paragraphs, lists, quotes and emphasis; text is escaped on import. Complex document structure is not preserved.
- A compatibility matrix distinguishes basic DOCX/HTML/TXT/Markdown support, PDF print/export, and explicitly unsupported legacy/other formats.
- Windows open/save dialogs now recognize Markdown; same extension safety allowlist.
- Retains the v0.6 Visual Setup, Writer local autosave and Undo/Redo, Sheets and Present browser prototypes.

## Not included
No universal format engine: ODT, RTF, legacy binary DOC, Apple Pages, WordPerfect, LaTeX, EPUB are **not supported**. BetterOffice/OpenOOXML and Lexical remain research candidates, not installed. This is not Microsoft Word feature parity.

## Testing and safety
Browser regression tests cover mode switching, autosaved content preservation, basic Markdown input/output, and unsafe raw HTML escaping. Windows packaging and CodeQL must pass on the exact release candidate. Keep source copies and export backups of valuable files; this is an unsigned alpha.

## Faster autosave in Writer
- Local draft autosave now uses a 120 ms idle delay rather than 600 ms, reducing its configured quiet-period interval by **80%**.
- A 1-second maximum interval allows checkpoints during continuous typing; editor blur, page hide and tab backgrounding flush pending changes immediately.
- Browser storage errors are surfaced instead of claiming successful saves.
- This interval improvement is a configuration measurement, **not a benchmark of actual storage latency**; typing performance depends on document size and device.

## Adaptive autosave + recovery
- Small files save after 50 ms of idle time (58.3% less than the previous 120 ms, 12× shorter than the original 600 ms).
- 100k+ HTML-character files use 120 ms and 500k+ use 300 ms, avoiding extra full-document serialization on every key.
- Continuous typing gets a 1-second checkpoint; on blur, pagehide, or tab backgrounding the current draft is flushed.
- Added local IndexedDB **Versions** history (up to 12 revisions, about 60 seconds apart) with manual snapshot and safe restore. It is not cloud backup.
