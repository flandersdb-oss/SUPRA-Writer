# SUPRA Office Autosave, Undo and Redo — Alpha

## Shared interaction
- **Writer:** Browser local storage uses adaptive idle saves: 50 ms for small documents, 120 ms for medium (100k+ HTML characters), and 300 ms for large (500k+). A 1-second maximum checkpoint remains during continuous typing. It also flushes pending changes immediately on focus loss, when the tab becomes hidden, on pagehide and beforeunload. Visible Undo / Redo are the editor's native text-edit history, and Save now writes the local draft immediately. **Undo look** remains a separate control for appearance presets.
- **Sheets:** Automatically saves whenever a cell changes (including while typing), when the sheet name changes, or when a workflow/import is applied. Undo and Redo restore up to 40 committed snapshots. Typing within a single focused cell is grouped into one snapshot.
- **Present:** Autosaves text while typing, slide reordering/add/delete, template application, theme, and deck name. Undo/Redo restore up to 40 snapshots. Typing in a single focused text field is grouped into one snapshot.

## What is stored where
- Autosave uses *browser localStorage*, scoped to this app origin and browser profile. It is **not** a disk file, automatic cloud backup, or cross-device sync.
- Undo/Redo history is **session-only** and not retained after reload; the current autosaved document persists when storage works.
- Save now saves the local working copy. For important files use DOCX (Writer), JSON project backup (Sheets/Present), or another explicit export.
- If browser storage is full or unavailable, status warns the user rather than claiming autosave success.
- Redo history is discarded when the user makes a new edit after undo.
- Undo/Redo of Writer formatting macros and selection changes is not guaranteed by native contenteditable history; appearance presets have their own Undo look control.

## Limitations
The browser's native Undo in focused text fields may behave differently from project-level undo. Windows packaged Writer uses the same controls but needs real-machine verification.

## Recovery versions
SUPRA Writer v0.7 adds up to 12 rolling IndexedDB recovery points, approximately one every 60 seconds of editing activity (and optional manual points). Open **Versions** and select a version to restore. Restoring first snapshots the existing draft so it can be recovered. These revisions are local to the current browser/device; clearing site storage removes them. This is distinct from undo and explicit file export.
