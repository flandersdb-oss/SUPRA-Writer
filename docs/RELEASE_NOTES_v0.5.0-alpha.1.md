# SUPRA Writer v0.5.0-alpha.1 — Windows staged alpha

**Staged candidate — do not call this ready until its exact commit passes Windows packaging and browser regression tests.**

## What's new
- **Start a new page** with one click or Ctrl+Enter.
- Explicit page breaks survive local drafts, HTML edits and DOCX export/import through WordprocessingML.
- Page-break markers guide the editor and are hidden on printed pages.
- Search **Start a new page** in the Ctrl+K Quick Actions panel.

## Preserved
- Windows installer and portable EXE, native file dialogs, Save As, PDF printing.
- Offline document editing and file import/export; saved looks, font controls and accessibility presets.
- Open-source MIT license and temporary SUPRA application icon identity.

## Limits
This is alpha software. Manual breaks **do not mean automatic pagination or Word formatting parity**. Advanced DOCX styling, page-numbering, headers/footers, images, footnotes, comments and tracked changes remain incomplete. Use copies of important documents.

## Quality gate
GitHub Windows job must produce two EXEs; browser suite including DOCX round-trip must pass before publishing a prerelease. CodeQL runs separately. An actual Windows installation on representative devices and signing remain outstanding.
