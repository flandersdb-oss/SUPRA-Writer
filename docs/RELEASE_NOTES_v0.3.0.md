# SUPRA Writer v0.3.0 — Windows Desktop Preview

This is an **unsigned experimental preview**, not a finished Microsoft Word replacement.

### Windows desktop

- Installer (`SUPRA-Writer-Setup-...exe`) and portable executable (`SUPRA-Writer-Portable-...exe`).
- Native Open, Save Word file, Save As, Print, and Export PDF dialogs.
- Offline editing with simplified one-click document looks, accessibility-oriented font selection, and the irony character ⸮.
- New **Find / Replace / Replace All**, also available in the web editor.
- Sandboxed Electron renderer with restricted, validated native file access.

### Important limits

- Complex DOCX layout may change on import or export, and document images are not fully supported. Keep backups of originals.
- Unsigned applications may trigger Windows SmartScreen; the code is public, but there is currently no independent publisher signature.
- Only download builds from the official GitHub release or GitHub Actions.
- Check Windows build job status before downloading; publishing is not guaranteed until successful CI.
